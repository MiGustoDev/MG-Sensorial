import { useState, useRef, useEffect } from 'react';
import type { SensorialFormAnswers } from '../types';
import { EMPANADAS_GUSTOS } from '../types';
import { supabase } from '../lib/supabase';
import {
  CheckCircle2,
  AlertTriangle,
  Camera,
  Trash2,
  Save,
  Eye,
  Wind,
  Smile,
  Award,
  ArrowRight,
  ClipboardList,
  User,
  Layers,
  Tag,
  Clock,
  Calendar,
  Check,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

interface EvaluationFormProps {
  onSavedSuccess?: () => void;
  onOpenAdmin?: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({ onSavedSuccess }) => {
  // Estado de despliegue del flujo en 2 pasos
  const [isEvaluationUnlocked, setIsEvaluationUnlocked] = useState(false);
  const [isEditingSample, setIsEditingSample] = useState(false);

  // Wizard de Evaluación por Módulos y Preguntas
  const [currentModule, setCurrentModule] = useState(0); // 0: Vista, 1: Olfato, 2: Boca, 3: Global
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Estados de carga / análisis de 5s y agradecimiento personalizado
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStageText, setAnalysisStageText] = useState('Iniciando auditoría sensorial...');
  const [showThankYou, setShowThankYou] = useState(false);

  // Encabezado / Formulario de Muestra
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [evaluador, setEvaluador] = useState(() => localStorage.getItem('mg_sensorial_last_evaluator') || '');
  const [loteBatea, setLoteBatea] = useState('');
  const [gusto, setGusto] = useState(EMPANADAS_GUSTOS[0]);
  const [otroGusto, setOtroGusto] = useState('');
  const [codigoMuestra, setCodigoMuestra] = useState('');

  // Estados para selectores 100% personalizados con estilos del proyecto
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isGustoDropdownOpen, setIsGustoDropdownOpen] = useState(false);

  // Mes y año para navegación en calendario custom
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const DAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay + 6) % 7; // Lunes = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  };

  const formatDisplayDate = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const handleSelectDate = (day: number) => {
    const formatted = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setFecha(formatted);
    setIsDatePickerOpen(false);
  };

  // 1. VISTA
  const [v1_color, setV1_color] = useState<'Sí' | 'Más claro' | 'Más oscuro' | ''>('Sí');
  const [v2_cantidad, setV2_cantidad] = useState<'Poco' | 'Justo' | 'Mucho' | ''>('Justo');
  const [v3_mezclado, setV3_mezclado] = useState<'Parejo' | 'Desparejo' | 'Sin mezclar' | ''>('Parejo');
  const [v4_ingredientesReceta, setV4_ingredientesReceta] = useState<'Sí' | 'Falta alguno' | ''>('Sí');
  const [v5_ingredienteExtrano, setV5_ingredienteExtrano] = useState<'No' | 'Sí' | ''>('No');
  const [v6_selladoCarne, setV6_selladoCarne] = useState<'Gris o hervida' | 'Dorada y jugosa' | 'Seca o quemada' | 'N/A' | ''>('Dorada y jugosa');
  const [v7_rehogadoVegetales, setV7_rehogadoVegetales] = useState<'Crudos' | 'Justo' | 'Quemados' | 'N/A' | ''>('Justo');
  const [v8_caramelizacion, setV8_caramelizacion] = useState<'Poca' | 'Justa' | 'Excesiva' | 'N/A' | ''>('Justa');
  const [obs_vista, setObs_vista] = useState('');

  // 2. OLFATO
  const [o1_intensidadAroma, setO1_intensidadAroma] = useState<'Débil' | 'Justa' | 'Fuerte' | ''>('Justa');
  const [o2_aromaCaracteristico, setO2_aromaCaracteristico] = useState<'Sí' | 'Poco' | 'No' | ''>('Sí');
  const [o3_olorExtrano, setO3_olorExtrano] = useState<Array<'No' | 'Quemado' | 'Rancio' | 'Aceite viejo' | 'Ácido' | 'Otro'>>(['No']);
  const [obs_olfato, setObs_olfato] = useState('');

  // 3. BOCA
  const [b1_primerImpacto, setB1_primerImpacto] = useState<Array<'Masa' | 'Carne / proteína' | 'Queso' | 'Cebolla' | 'Especias' | 'Picante' | 'Sal' | 'Dulce' | 'Grasa'>>(['Carne / proteína']);
  const [b2_texturaMasa, setB2_texturaMasa] = useState<'Cruda' | 'Tierna' | 'Crocante' | 'Dura' | ''>('Tierna');
  const [b3_jugosidadRelleno, setB3_jugosidadRelleno] = useState<'Seco' | 'Jugoso' | 'Muy húmedo' | ''>('Jugoso');
  const [b4_texturaCarne, setB4_texturaCarne] = useState<'Tierna' | 'Dura' | 'Fibrosa' | 'N/A' | ''>('Tierna');
  const [b5_sal, setB5_sal] = useState<'Poca' | 'Justa' | 'Mucha' | ''>('Justa');
  const [b6_dulce, setB6_dulce] = useState<'Poco' | 'Justo' | 'Mucho' | ''>('Justo');
  const [b7_picante, setB7_picante] = useState<'Poco' | 'Justo' | 'Mucho' | 'No debería picar' | ''>('No debería picar');
  const [b8_saborCaracteristico, setB8_saborCaracteristico] = useState<'Débil' | 'Justo' | 'Intenso' | ''>('Justo');
  const [b9_ingredienteTapa, setB9_ingredienteTapa] = useState<'No' | 'Sí' | ''>('No');
  const [b10_saborExtrano, setB10_saborExtrano] = useState<Array<'No' | 'Quemado' | 'Rancio' | 'Aceite viejo' | 'Ácido' | 'Otro'>>(['No']);
  const [b11_retrogusto, setB11_retrogusto] = useState<'Agradable' | 'Neutro' | 'Desagradable' | ''>('Agradable');
  const [obs_boca, setObs_boca] = useState('');

  // 4. EVALUACIÓN GLOBAL
  const [g1_estandarGusto, setG1_estandarGusto] = useState<'Igual' | 'Leve diferencia' | 'Muy diferente' | ''>('Igual');
  const [g2_gustoGeneral, setG2_gustoGeneral] = useState<number>(1);
  const [g3_aprobacion, setG3_aprobacion] = useState<'Sí' | 'Sí con observaciones' | 'No' | ''>('Sí');
  const [obs_global, setObs_global] = useState('');

  // Evidencias & Firma
  const [photos, setPhotos] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Estados UI
  const [saving, setSaving] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationAttempt, setValidationAttempt] = useState(false);

  // Canvas resize / DPI handling
  useEffect(() => {
    if (isEvaluationUnlocked && currentModule === 3 && currentQuestion === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, [isEvaluationUnlocked, currentModule, currentQuestion]);

  // Manejo de arrays multiselección
  const toggleArrayItem = <T extends string>(list: T[], setList: (l: T[]) => void, item: T, exclusiveItem?: T) => {
    if (exclusiveItem && item === exclusiveItem) {
      setList([exclusiveItem]);
      return;
    }
    let updated = list.filter(i => i !== exclusiveItem);
    if (updated.includes(item)) {
      updated = updated.filter(i => i !== item);
    } else {
      updated.push(item);
    }
    if (updated.length === 0 && exclusiveItem) {
      updated = [exclusiveItem];
    }
    setList(updated);
  };

  // Canvas firma
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // Validación y desbloqueo de la evaluación
  const handleUnlockEvaluation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationAttempt(true);
    setErrorMessage(null);

    const actualGusto = gusto === 'OTRO' ? otroGusto.trim() : gusto;

    if (!evaluador.trim()) {
      setErrorMessage('Por favor ingresá el nombre del Evaluador para continuar.');
      return;
    }
    if (!loteBatea.trim()) {
      setErrorMessage('Por favor ingresá el Lote o Batea de la muestra.');
      return;
    }
    if (!actualGusto) {
      setErrorMessage('Por favor especificá el Gusto a evaluar.');
      return;
    }

    // Guardar evaluador frecuente
    localStorage.setItem('mg_sensorial_last_evaluator', evaluador.trim());

    // Desplegar evaluación
    setIsEvaluationUnlocked(true);
    setIsEditingSample(false);
    setErrorMessage(null);

    setTimeout(() => {
      const summarySection = document.getElementById('resumen-muestra-activa');
      if (summarySection) {
        summarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 100, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const actualGusto = gusto === 'OTRO' ? otroGusto.trim() : gusto;

    if (!evaluador.trim() || !loteBatea.trim() || !actualGusto) {
      setErrorMessage('Faltan datos obligatorios de la muestra (Evaluador, Lote o Gusto).');
      setIsEditingSample(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStageText('Iniciando auditoría organoléptica...');

    let firmaData = '';
    if (hasSignature && canvasRef.current) {
      firmaData = canvasRef.current.toDataURL('image/png');
    }

    const payload: SensorialFormAnswers = {
      fecha,
      hora,
      evaluador: evaluador.trim(),
      loteBatea: loteBatea.trim().toUpperCase(),
      gusto: actualGusto,
      codigoMuestra: codigoMuestra.trim().toUpperCase() || undefined,
      v1_color,
      v2_cantidad,
      v3_mezclado,
      v4_ingredientesReceta,
      v5_ingredienteExtrano,
      v6_selladoCarne,
      v7_rehogadoVegetales,
      v8_caramelizacion,
      obs_vista: obs_vista.trim(),
      o1_intensidadAroma,
      o2_aromaCaracteristico,
      o3_olorExtrano,
      obs_olfato: obs_olfato.trim(),
      b1_primerImpacto,
      b2_texturaMasa,
      b3_jugosidadRelleno,
      b4_texturaCarne,
      b5_sal,
      b6_dulce,
      b7_picante,
      b8_saborCaracteristico,
      b9_ingredienteTapa,
      b10_saborExtrano,
      b11_retrogusto,
      obs_boca: obs_boca.trim(),
      g1_estandarGusto,
      g2_gustoGeneral,
      g3_aprobacion,
      obs_global: obs_global.trim(),
      firmaEvaluador: firmaData,
      fotos: photos
    };

    // Guardado asíncrono en Supabase / LocalStorage
    const savePromise = (async () => {
      try {
        const { error } = await supabase
          .from('sensorial_evaluations_v2')
          .insert([{
            fecha: payload.fecha,
            hora: payload.hora,
            evaluador: payload.evaluador,
            lote_batea: payload.loteBatea,
            gusto: payload.gusto,
            codigo_muestra: payload.codigoMuestra,
            v1_color: payload.v1_color,
            v2_cantidad: payload.v2_cantidad,
            v3_mezclado: payload.v3_mezclado,
            v4_ingredientes_receta: payload.v4_ingredientesReceta,
            v5_ingrediente_extrano: payload.v5_ingredienteExtrano,
            v6_sellado_carne: payload.v6_selladoCarne,
            v7_rehogado_vegetales: payload.v7_rehogadoVegetales,
            v8_caramelizacion: payload.v8_caramelizacion,
            obs_vista: payload.obs_vista,
            o1_intensidad_aroma: payload.o1_intensidadAroma,
            o2_aroma_caracteristico: payload.o2_aromaCaracteristico,
            o3_olor_extrano: payload.o3_olorExtrano,
            obs_olfato: payload.obs_olfato,
            b1_primer_impacto: payload.b1_primerImpacto,
            b2_textura_masa: payload.b2_texturaMasa,
            b3_jugosidad_relleno: payload.b3_jugosidadRelleno,
            b4_textura_carne: payload.b4_texturaCarne,
            b5_sal: payload.b5_sal,
            b6_dulce: payload.b6_dulce,
            b7_picante: payload.b7_picante,
            b8_sabor_caracteristico: payload.b8_saborCaracteristico,
            b9_ingrediente_tapa: payload.b9_ingredienteTapa,
            b10_sabor_extrano: payload.b10_saborExtrano,
            b11_retrogusto: payload.b11_retrogusto,
            obs_boca: payload.obs_boca,
            g1_estandar_gusto: payload.g1_estandarGusto,
            g2_gusto_general: payload.g2_gustoGeneral,
            g3_aprobacion: payload.g3_aprobacion,
            obs_global: payload.obs_global,
            firma_evaluador: payload.firmaEvaluador,
            fotos: payload.fotos,
            saved_by_email: localStorage.getItem('mg_sensorial_admin_user') || 'control_calidad@migusto.com.ar'
          }]);

        if (error) {
          console.warn('Supabase fallback to local storage:', error);
          const local = JSON.parse(localStorage.getItem('mg_sensorial_official_history') || '[]');
          local.unshift({ ...payload, id: 'local_' + Date.now(), created_at: new Date().toISOString() });
          localStorage.setItem('mg_sensorial_official_history', JSON.stringify(local));
        }
      } catch (err: any) {
        console.error(err);
      }
    })();

    // Simulación técnica de análisis durante 5 segundos
    const startTime = Date.now();
    const duration = 5000;

    const intervalId = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setAnalysisProgress(progress);

      if (progress < 25) {
        setAnalysisStageText('Auditando parámetros organolépticos...');
      } else if (progress < 55) {
        setAnalysisStageText('Verificando estándares de calidad Mi Gusto...');
      } else if (progress < 80) {
        setAnalysisStageText('Compilando protocolo técnico INF-D003...');
      } else {
        setAnalysisStageText('Almacenando evaluación en historial oficial...');
      }

      if (elapsed >= duration) {
        clearInterval(intervalId);
        await savePromise;
        setSaving(false);
        setIsAnalyzing(false);
        setShowThankYou(true);
        setSuccessSaved(true);
        if (onSavedSuccess) onSavedSuccess();

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  // Configuración de los 4 Módulos del Wizard
  const MODULES = [
    {
      id: 'vista',
      name: 'Vista',
      title: '1. VISTA – Empanada cortada al medio',
      subtitle: 'Inspección visual del relleno y cocción',
      icon: Eye,
      totalQuestions: 9
    },
    {
      id: 'olfato',
      name: 'Olfato',
      title: '2. OLFATO – Relleno recién cortado',
      subtitle: 'Intensidad y notas aromáticas',
      icon: Wind,
      totalQuestions: 4
    },
    {
      id: 'boca',
      name: 'Boca',
      title: '3. BOCA – Primer bocado, masa y relleno juntos',
      subtitle: 'Gusto en boca, textura y retrogusto',
      icon: Smile,
      totalQuestions: 12
    },
    {
      id: 'global',
      name: 'Global',
      title: '4. EVALUACIÓN GLOBAL & FIRMA',
      subtitle: 'Puntaje global, dictamen de despacho y firma',
      icon: Award,
      totalQuestions: 5
    }
  ];

  const handleNextStep = () => {
    const totalInModule = MODULES[currentModule].totalQuestions;
    if (currentQuestion < totalInModule - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (currentModule < MODULES.length - 1) {
      setCurrentModule(prev => prev + 1);
      setCurrentQuestion(0);
    }
  };

  const handlePrevStep = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else if (currentModule > 0) {
      const prevMod = currentModule - 1;
      setCurrentModule(prevMod);
      setCurrentQuestion(MODULES[prevMod].totalQuestions - 1);
    }
  };

  // Helper para preguntas de selección única en el Wizard
  const renderWizardSingleSelect = (
    title: string,
    subtitle: string,
    currentValue: string,
    onChange: (val: any) => void,
    options: string[]
  ) => (
    <div className="space-y-3.5 animate-fade-in">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold text-[#2c2724] leading-snug">
          {title}
        </h3>
        {subtitle && <p className="text-[11px] text-[#7c746d] mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(opt => {
          const isSelected = currentValue === opt;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onChange(opt)}
              className={`p-3 rounded-xl text-xs sm:text-sm font-bold text-left transition-all border flex items-center justify-between active:scale-[0.99] ${
                isSelected
                  ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-sm'
                  : 'bg-[#f5f0e6] border-[#e2d9c8] text-[#3d3630] hover:bg-[#ede6d8]'
              }`}
            >
              <span>{opt}</span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                  isSelected ? 'border-white bg-white text-[#4f46e5]' : 'border-[#ded4c3] bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Helper para preguntas de multiselección en el Wizard
  const renderWizardMultiSelect = (
    title: string,
    subtitle: string,
    options: readonly string[],
    currentList: readonly string[] | string[],
    onToggle: (item: any) => void,
    normalOption?: string
  ) => (
    <div className="space-y-3.5 animate-fade-in">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold text-[#2c2724] leading-snug">
          {title}
        </h3>
        <p className="text-[11px] text-[#7c746d] mt-0.5">
          {subtitle || 'Podés seleccionar una o más opciones que correspondan.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(opt => {
          const isSelected = currentList.includes(opt);
          let activeClass = 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-sm';
          if (normalOption && opt === normalOption) {
            activeClass = 'bg-emerald-600 text-white border-emerald-500 shadow-sm';
          } else if (normalOption && opt !== normalOption) {
            activeClass = 'bg-[#eb5757] text-white border-[#eb5757] shadow-sm';
          }

          return (
            <button
              type="button"
              key={opt}
              onClick={() => onToggle(opt)}
              className={`p-3 rounded-xl text-xs font-bold text-center transition-all border active:scale-95 flex items-center justify-center gap-1.5 ${
                isSelected
                  ? activeClass
                  : 'bg-[#f5f0e6] border-[#e2d9c8] text-[#3d3630] hover:bg-[#ede6d8]'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Helper para observaciones de texto en el Wizard
  const renderWizardTextInput = (
    title: string,
    subtitle: string,
    value: string,
    onChange: (val: string) => void,
    placeholder: string
  ) => (
    <div className="space-y-3.5 animate-fade-in">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold text-[#2c2724] leading-snug">
          {title}
        </h3>
        <p className="text-[11px] text-[#7c746d] mt-0.5">{subtitle}</p>
      </div>

      <div>
        <textarea
          rows={2}
          value={value}
          onChange={e => {
            onChange(e.target.value);
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.height = `${Math.max(e.currentTarget.scrollHeight, 68)}px`;
          }}
          onInput={e => {
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.height = `${Math.max(e.currentTarget.scrollHeight, 68)}px`;
          }}
          ref={el => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = `${Math.max(el.scrollHeight, 68)}px`;
            }
          }}
          placeholder={placeholder}
          className="w-full p-3 rounded-xl bg-[#fdfbf7] border border-[#ded4c3] text-xs sm:text-sm text-[#2c2724] placeholder-[#a69c91] focus:bg-white focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] resize-none overflow-hidden transition-all shadow-inner"
        />
        <p className="text-[10px] text-[#8e857b] mt-1 text-right">
          Opcional • Dejá en blanco si la muestra cumple el estándar
        </p>
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-xl mx-auto px-3.5 sm:px-4 py-4 flex-1 flex flex-col justify-between text-[#2c2724] ${
      isEvaluationUnlocked ? 'pb-6' : 'pb-4'
    }`}>
      {/* Contenedor Principal Flexible */}
      <div className="flex-1 space-y-4 flex flex-col">
        {/* Cabecera Documental Oficial - Solo en la primer pantalla */}
        {(!isEvaluationUnlocked || isEditingSample) && (
          <div className="p-4 rounded-2xl bg-[#fdfbf7] border border-[#e2d9c8] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#ebe3d5] pb-2.5 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#5969E6]" />
                <span className="text-sm font-extrabold tracking-tight text-[#2c2724] uppercase">
                  Control de Calidad
                </span>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-[#5969E6] text-white shadow-sm">
                  INF-D003
                </span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="text-[10px] font-mono text-[#8e857b]">V2.0</span>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-[#5969E6] text-white shadow-sm">
                  2026
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#2c2724] flex items-center gap-2">
                Evaluación Sensorial de Muestra
              </h1>
              <p className="text-[11px] text-[#7c746d] mt-0.5">
                Protocolo técnico de degustación y control organoléptico
              </p>
            </div>
          </div>
        )}

      {/* Alerta de guardado exitoso */}
      {successSaved && (
        <div className="mb-4 p-4 rounded-2xl bg-[#eaf8f0] border border-[#bbf7d0] text-emerald-950 shadow-sm animate-fade-in flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-emerald-950">¡Evaluación Registrada con Éxito!</p>
              <p className="text-xs text-emerald-800 mt-0.5">
                La muestra de <span className="font-bold text-emerald-950">{gusto === 'OTRO' ? otroGusto : gusto}</span> ({loteBatea}) fue guardada en el historial oficial de Calidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de error de validación */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#fdf2f2] border border-[#fecaca] text-[#eb5757] text-xs flex items-center gap-2.5 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-[#eb5757] shrink-0" />
          <span className="font-semibold text-[#b91c1c]">{errorMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VISTA 1: FORMULARIO INICIAL DE REGISTRO DE MUESTRA
          ========================================================================= */}
      {(!isEvaluationUnlocked || isEditingSample) && (
        <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-[#e2d9c8] shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#ebe3d5]">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#4f46e5]" />
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-[#2c2724]">
                Ficha de Muestra y Evaluador
              </h2>
            </div>
            {isEvaluationUnlocked && (
              <button
                type="button"
                onClick={() => setIsEditingSample(false)}
                className="text-xs font-bold text-[#4f46e5] hover:text-[#4338ca]"
              >
                Cerrar edición
              </button>
            )}
          </div>

          {/* Selector Personalizado de Fecha y Hora con DESPLEGABLES DIRECTOS */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Campo Fecha y su Desplegable */}
            <div className="relative">
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#4a423b] mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#4f46e5]" />
                <span>FECHA:</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const parts = (fecha || '').split('-');
                  if (parts[0] && parts[1]) {
                    setCalYear(parseInt(parts[0], 10));
                    setCalMonth(parseInt(parts[1], 10) - 1);
                  }
                  setIsDatePickerOpen(prev => !prev);
                  setIsTimePickerOpen(false);
                  setIsGustoDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-left text-xs text-[#2c2724] font-semibold flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all hover:border-[#4f46e5]"
              >
                <span>{formatDisplayDate(fecha)}</span>
                <Calendar className="w-3.5 h-3.5 text-[#4f46e5]" />
              </button>

              {/* DESPLEGABLE DE FECHA (Sin Modal) */}
              {isDatePickerOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsDatePickerOpen(false)} />
                  <div className="absolute left-0 top-full mt-1.5 z-40 w-72 sm:w-80 bg-[#fdfbf7] border border-[#e2d9c8] rounded-2xl p-3.5 shadow-xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-[#ebe3d5]">
                      <button
                        type="button"
                        onClick={() => {
                          if (calMonth === 0) {
                            setCalMonth(11);
                            setCalYear(y => y - 1);
                          } else {
                            setCalMonth(m => m - 1);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-[#f5f0e6] border border-[#e2d9c8] text-[#4a423b] hover:text-[#2c2724] hover:bg-[#ede6d8]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="font-bold text-xs sm:text-sm text-[#2c2724] capitalize">
                        {MONTH_NAMES[calMonth]} {calYear}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (calMonth === 11) {
                            setCalMonth(0);
                            setCalYear(y => y + 1);
                          } else {
                            setCalMonth(m => m + 1);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-[#f5f0e6] border border-[#e2d9c8] text-[#4a423b] hover:text-[#2c2724] hover:bg-[#ede6d8]"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-bold text-[#4f46e5]">
                      {DAYS_SHORT.map(d => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>

                    {/* Grid de días */}
                    <div className="grid grid-cols-7 gap-1">
                      {getCalendarDays(calYear, calMonth).map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} />;
                        const dayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = fecha === dayStr;
                        const isToday = new Date().toISOString().split('T')[0] === dayStr;

                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => handleSelectDate(day)}
                            className={`h-8 w-8 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#4f46e5] text-white font-extrabold shadow-sm'
                                : isToday
                                ? 'border border-[#eb5757] text-[#eb5757] bg-[#fdf2f2] font-bold'
                                : 'text-[#2c2724] hover:bg-[#f3ede2]'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ebe3d5]">
                      <button
                        type="button"
                        onClick={() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          setFecha(todayStr);
                          setIsDatePickerOpen(false);
                        }}
                        className="text-xs font-bold text-[#4f46e5] hover:text-[#4338ca] px-2.5 py-1 rounded-lg hover:bg-[#eeedfc]"
                      >
                        Hoy
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(false)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#f3ede2] border border-[#e2d9c8] text-[#2c2724] hover:bg-[#ede6d8]"
                      >
                        Listo
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Campo Hora y su Desplegable */}
            <div className="relative">
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#4a423b] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#4f46e5]" />
                <span>HORA:</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsTimePickerOpen(prev => !prev);
                  setIsDatePickerOpen(false);
                  setIsGustoDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-left text-xs text-[#2c2724] font-semibold flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all hover:border-[#4f46e5]"
              >
                <span>{hora} hs</span>
                <Clock className="w-3.5 h-3.5 text-[#4f46e5]" />
              </button>

              {/* DESPLEGABLE DE HORA (Sin Modal) */}
              {isTimePickerOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsTimePickerOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-64 sm:w-72 bg-[#fdfbf7] border border-[#e2d9c8] rounded-2xl p-3.5 shadow-xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-[#ebe3d5]">
                      <span className="font-bold text-xs text-[#2c2724]">Seleccionar Hora</span>
                      <span className="text-xs font-mono font-extrabold text-[#4f46e5] bg-[#eeedfc] px-2 py-0.5 rounded-lg border border-[#d7d4f9]">
                        {hora} hs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Columna Horas */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7c746d] block mb-1">Hora</span>
                        <div className="grid grid-cols-3 gap-1 max-h-44 overflow-y-auto pr-1">
                          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => {
                            const isSelected = hora.startsWith(h + ':');
                            return (
                              <button
                                type="button"
                                key={h}
                                onClick={() => {
                                  const parts = hora.split(':');
                                  setHora(`${h}:${parts[1] || '00'}`);
                                }}
                                className={`py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                                  isSelected
                                    ? 'bg-[#4f46e5] text-white shadow-sm'
                                    : 'bg-[#f5f0e6] border border-[#e2d9c8] text-[#2c2724] hover:bg-[#ede6d8]'
                                }`}
                              >
                                {h}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Columna Minutos */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7c746d] block mb-1">Minutos</span>
                        <div className="grid grid-cols-2 gap-1 max-h-44 overflow-y-auto pr-1">
                          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => {
                            const isSelected = hora.endsWith(':' + m);
                            return (
                              <button
                                type="button"
                                key={m}
                                onClick={() => {
                                  const parts = hora.split(':');
                                  setHora(`${parts[0] || '12'}:${m}`);
                                }}
                                className={`py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                                  isSelected
                                    ? 'bg-[#4f46e5] text-white shadow-sm'
                                    : 'bg-[#f5f0e6] border border-[#e2d9c8] text-[#2c2724] hover:bg-[#ede6d8]'
                                }`}
                              >
                                :{m}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ebe3d5]">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const h = String(now.getHours()).padStart(2, '0');
                          const m = String(now.getMinutes()).padStart(2, '0');
                          setHora(`${h}:${m}`);
                        }}
                        className="text-xs font-bold text-[#4f46e5] hover:text-[#4338ca] px-2 py-1 rounded-lg hover:bg-[#eeedfc]"
                      >
                        Ahora
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsTimePickerOpen(false)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#4f46e5] text-white hover:bg-[#4338ca] shadow-sm"
                      >
                        Listo
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#4a423b] mb-1">
                <User className="w-3.5 h-3.5 text-[#4f46e5]" />
                <span>EVALUADOR:</span>
                <span className="text-[#eb5757] font-extrabold text-sm ml-0.5" title="Campo obligatorio">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pérez / Calidad"
                value={evaluador}
                onChange={e => setEvaluador(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl glass-input text-xs text-[#2c2724] placeholder-[#a69c91] ${
                  validationAttempt && !evaluador.trim() ? 'border-[#eb5757] ring-1 ring-[#eb5757]' : ''
                }`}
              />
              {validationAttempt && !evaluador.trim() && (
                <span className="text-[10px] text-[#eb5757] mt-1 block font-medium">Campo obligatorio</span>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#4a423b] mb-1">
                <Layers className="w-3.5 h-3.5 text-[#4f46e5]" />
                <span>LOTE / BATEA:</span>
                <span className="text-[#eb5757] font-extrabold text-sm ml-0.5" title="Campo obligatorio">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. BATEA-04 / L-24"
                value={loteBatea}
                onChange={e => setLoteBatea(e.target.value.toUpperCase())}
                className={`w-full px-3 py-2.5 rounded-xl glass-input text-xs font-mono font-bold uppercase text-[#4f46e5] placeholder-[#a69c91] ${
                  validationAttempt && !loteBatea.trim() ? 'border-[#eb5757] ring-1 ring-[#eb5757]' : ''
                }`}
              />
              {validationAttempt && !loteBatea.trim() && (
                <span className="text-[10px] text-[#eb5757] mt-1 block font-medium">Campo obligatorio</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#ebe3d5]">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#4a423b] mb-1">
                <Tag className="w-3.5 h-3.5 text-[#4f46e5]" />
                <span>GUSTO A EVALUAR:</span>
                <span className="text-[#eb5757] font-extrabold text-sm ml-0.5" title="Campo obligatorio">*</span>
              </label>

              {/* Selector Customizado de Gustos a Evaluar (SIN BUSCADOR) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsGustoDropdownOpen(prev => !prev);
                    setIsDatePickerOpen(false);
                    setIsTimePickerOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-left text-xs text-[#2c2724] font-semibold flex items-center justify-between active:scale-[0.99] transition-all hover:border-[#4f46e5]"
                >
                  <span className="truncate">
                    {gusto === 'OTRO' ? (
                      <span className="text-[#eb5757] font-bold">⭐ {otroGusto.trim() || 'OTRO / DESARROLLO'}</span>
                    ) : (
                      gusto
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#4f46e5] transition-transform duration-200 shrink-0 ${isGustoDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isGustoDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsGustoDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#fdfbf7] border border-[#e2d9c8] rounded-xl shadow-xl p-2 max-h-72 flex flex-col animate-fade-in">
                      <div className="overflow-y-auto space-y-0.5 pr-1 flex-1">
                        {EMPANADAS_GUSTOS.map(g => {
                          const isSelected = gusto === g;
                          return (
                            <button
                              type="button"
                              key={g}
                              onClick={() => {
                                setGusto(g);
                                setIsGustoDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                isSelected
                                  ? 'bg-[#4f46e5] text-white font-bold'
                                  : 'text-[#2c2724] hover:bg-[#eeedfc] hover:text-[#4f46e5]'
                              }`}
                            >
                              <span>{g}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          );
                        })}

                        <div className="pt-1 mt-1 border-t border-[#ebe3d5]">
                          <button
                            type="button"
                            onClick={() => {
                              setGusto('OTRO');
                              setIsGustoDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                              gusto === 'OTRO'
                                ? 'bg-[#eb5757] text-white'
                                : 'text-[#eb5757] hover:bg-[#fdf2f2]'
                            }`}
                          >
                            <span>⭐ OTRO / DESARROLLO...</span>
                            {gusto === 'OTRO' && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {gusto === 'OTRO' && (
                <div className="mt-2">
                  <label className="flex items-center gap-1 text-[10px] font-bold text-[#4a423b] mb-1">
                    <span>ESPECIFICAR GUSTO:</span>
                    <span className="text-[#eb5757] font-extrabold text-sm ml-0.5" title="Campo obligatorio">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Especificar sabor en desarrollo..."
                    value={otroGusto}
                    onChange={e => setOtroGusto(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-[#2c2724] placeholder-[#a69c91]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#4a423b] mb-1">
                <span>CÓDIGO DE MUESTRA (OPCIONAL):</span>
              </label>
              <input
                type="text"
                placeholder="Ej. M-01 / CATA-A"
                value={codigoMuestra}
                onChange={e => setCodigoMuestra(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-mono uppercase text-[#2c2724] placeholder-[#a69c91]"
              />
            </div>
          </div>

          {/* Botón de confirmación para desplegar la evaluación */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleUnlockEvaluation}
              className="w-auto py-3 px-6 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-[#4f46e5]/20 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 group"
            >
              <span>{isEvaluationUnlocked ? 'Confirmar Datos' : 'Comenzar sensorial'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESUMEN DE MUESTRA ACTIVA (VISIBLE CUANDO LA EVALUACIÓN ESTÁ DESPLEGADA)
          ========================================================================= */}
      {isEvaluationUnlocked && !showThankYou && (
        <div id="resumen-muestra-activa" className="mb-4 p-3.5 rounded-2xl bg-[#fdfbf7] border border-[#e2d9c8] shadow-sm animate-fade-in scroll-mt-20">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e2d9c8]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7c746d]">Muestra Activa</span>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-md bg-[#5969E6] text-white shadow-sm">
                Lote: {loteBatea}
              </span>
              {codigoMuestra && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#f5f0e6] text-[#7c746d] border border-[#e2d9c8]">
                  {codigoMuestra}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <p className="font-black text-sm text-[#2c2724] leading-tight">
              {gusto === 'OTRO' ? otroGusto : gusto}
            </p>
            <p className="text-[11px] text-[#7c746d]">
              Evaluador: <span className="text-[#2c2724] font-semibold">{evaluador}</span> • {fecha} {hora}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 2: EVALUACIÓN SENSORIAL DESPLEGADA
          ========================================================================= */}
      {/* =========================================================================
          WIZARD DE EVALUACIÓN SENSORIAL (PASO A PASO POR MÓDULOS Y PREGUNTAS)
          ========================================================================= */}
      {isEvaluationUnlocked && !isEditingSample && !showThankYou && (
        <div id="evaluacion-sensorial-container" className="space-y-4 animate-slide-down">
          {/* Pestañas de los 4 Módulos */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {MODULES.map((mod, idx) => {
              const ModIcon = mod.icon;
              const isActive = currentModule === idx;
              const isCompleted = currentModule > idx;

              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    setCurrentModule(idx);
                    setCurrentQuestion(0);
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    isActive
                      ? 'bg-[#4f46e5] border-[#4f46e5] text-white shadow-sm'
                      : isCompleted
                      ? 'bg-[#eeedfc] border-[#d7d4f9] text-[#4f46e5]'
                      : 'bg-[#fdfbf7] border-[#e2d9c8] text-[#7c746d] hover:text-[#2c2724] hover:bg-[#f5f0e6]'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <ModIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-extrabold tracking-tight truncate w-full">
                    {mod.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tarjeta Activa del Wizard */}
          <div className="bg-[#fdfbf7] p-4 sm:p-5 rounded-2xl border border-[#e2d9c8] shadow-sm space-y-4">
            {/* Cabecera del Módulo */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e2d9c8]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#eeedfc] flex items-center justify-center text-[#4f46e5]">
                  {currentModule === 0 && <Eye className="w-4 h-4 text-[#4f46e5]" />}
                  {currentModule === 1 && <Wind className="w-4 h-4 text-[#4f46e5]" />}
                  {currentModule === 2 && <Smile className="w-4 h-4 text-[#4f46e5]" />}
                  {currentModule === 3 && <Award className="w-4 h-4 text-[#4f46e5]" />}
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2c2724]">
                    {MODULES[currentModule].title}
                  </h2>
                  <span className="text-[10px] text-[#7c746d]">
                    {MODULES[currentModule].subtitle}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#f5f0e6] text-[#7c746d] border border-[#e2d9c8]">
                  {currentQuestion + 1} de {MODULES[currentModule].totalQuestions}
                </span>
              </div>
            </div>

            {/* Barra de progreso de la pregunta en el módulo */}
            <div className="w-full h-1.5 bg-[#ede6d8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4f46e5] rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / MODULES[currentModule].totalQuestions) * 100}%`
                }}
              />
            </div>

            {/* Pregunta Activa */}
            <div className="pt-2">
              {/* MÓDULO 0: VISTA */}
              {currentModule === 0 && (
                <>
                  {currentQuestion === 0 && renderWizardSingleSelect(
                    'V1. ¿El color del relleno es el esperado para el gusto?',
                    'Tonalidad y color característico',
                    v1_color,
                    setV1_color,
                    ['Sí', 'Más claro', 'Más oscuro']
                  )}
                  {currentQuestion === 1 && renderWizardSingleSelect(
                    'V2. ¿Cómo es la cantidad de relleno?',
                    'Proporción y carga de relleno',
                    v2_cantidad,
                    setV2_cantidad,
                    ['Justo', 'Poco', 'Mucho']
                  )}
                  {currentQuestion === 2 && renderWizardSingleSelect(
                    'V3. ¿Cómo está el mezclado de los ingredientes?',
                    'Homogeneidad de la preparación',
                    v3_mezclado,
                    setV3_mezclado,
                    ['Parejo', 'Desparejo', 'Sin mezclar']
                  )}
                  {currentQuestion === 3 && renderWizardSingleSelect(
                    'V4. ¿Están todos los ingredientes de la receta?',
                    'Presencia de componentes obligatorios',
                    v4_ingredientesReceta,
                    setV4_ingredientesReceta,
                    ['Sí', 'Falta alguno']
                  )}
                  {currentQuestion === 4 && renderWizardSingleSelect(
                    'V5. ¿Hay algún ingrediente que no corresponde al gusto?',
                    'Detección de contaminación o desvío',
                    v5_ingredienteExtrano,
                    setV5_ingredienteExtrano,
                    ['No', 'Sí']
                  )}
                  {currentQuestion === 5 && renderWizardSingleSelect(
                    'V6. ¿Cómo está sellada la carne / pollo?',
                    'Punto de cocción y sellado',
                    v6_selladoCarne,
                    setV6_selladoCarne,
                    ['Dorada y jugosa', 'Gris o hervida', 'Seca o quemada', 'N/A']
                  )}
                  {currentQuestion === 6 && renderWizardSingleSelect(
                    'V7. ¿Cómo están rehogados los vegetales?',
                    'Punto de cocción de vegetales',
                    v7_rehogadoVegetales,
                    setV7_rehogadoVegetales,
                    ['Justo', 'Crudos', 'Quemados', 'N/A']
                  )}
                  {currentQuestion === 7 && renderWizardSingleSelect(
                    'V8. ¿Cómo está la caramelización (cebolla u otro)?',
                    'Nivel de caramelizado',
                    v8_caramelizacion,
                    setV8_caramelizacion,
                    ['Justa', 'Poca', 'Excesiva', 'N/A']
                  )}
                  {currentQuestion === 8 && renderWizardTextInput(
                    'Observaciones Vista',
                    'Detallá cualquier anomalía visual o comentario de masa/relleno',
                    obs_vista,
                    setObs_vista,
                    'Anotá el detalle si marcaste una respuesta fuera de lo esperado...'
                  )}
                </>
              )}

              {/* MÓDULO 1: OLFATO */}
              {currentModule === 1 && (
                <>
                  {currentQuestion === 0 && renderWizardSingleSelect(
                    'O1. ¿Cómo es la intensidad del aroma?',
                    'Proyección aromática al corte',
                    o1_intensidadAroma,
                    setO1_intensidadAroma,
                    ['Justa', 'Débil', 'Fuerte']
                  )}
                  {currentQuestion === 1 && renderWizardSingleSelect(
                    'O2. ¿Reconocés el aroma característico del gusto?',
                    'Identidad olfativa del producto',
                    o2_aromaCaracteristico,
                    setO2_aromaCaracteristico,
                    ['Sí', 'Poco', 'No']
                  )}
                  {currentQuestion === 2 && renderWizardMultiSelect(
                    'O3. ¿Sentís algún olor extraño?',
                    'Seleccioná si detectás algún defecto aromático',
                    ['No', 'Quemado', 'Rancio', 'Aceite viejo', 'Ácido', 'Otro'],
                    o3_olorExtrano,
                    (opt: any) => toggleArrayItem(o3_olorExtrano, setO3_olorExtrano, opt, 'No'),
                    'No'
                  )}
                  {currentQuestion === 3 && renderWizardTextInput(
                    'Observaciones Olfato',
                    'Detalle de olores atípicos u observaciones aromáticas',
                    obs_olfato,
                    setObs_olfato,
                    'Detalle de olores u observaciones aromáticas...'
                  )}
                </>
              )}

              {/* MÓDULO 2: BOCA */}
              {currentModule === 2 && (
                <>
                  {currentQuestion === 0 && renderWizardMultiSelect(
                    'B1. ¿Qué fue lo primero que sentiste al morder?',
                    'Primer impacto sensorial en boca (podés seleccionar varios)',
                    ['Masa', 'Carne / proteína', 'Queso', 'Cebolla', 'Especias', 'Picante', 'Sal', 'Dulce', 'Grasa'],
                    b1_primerImpacto,
                    (opt: any) => toggleArrayItem(b1_primerImpacto, setB1_primerImpacto, opt)
                  )}
                  {currentQuestion === 1 && renderWizardSingleSelect(
                    'B2. ¿Cómo es la textura de la masa?',
                    'Textura al morder',
                    b2_texturaMasa,
                    setB2_texturaMasa,
                    ['Tierna', 'Crocante', 'Cruda', 'Dura']
                  )}
                  {currentQuestion === 2 && renderWizardSingleSelect(
                    'B3. ¿Cómo es la jugosidad del relleno?',
                    'Humedad y jugosidad al masticar',
                    b3_jugosidadRelleno,
                    setB3_jugosidadRelleno,
                    ['Jugoso', 'Seco', 'Muy húmedo']
                  )}
                  {currentQuestion === 3 && renderWizardSingleSelect(
                    'B4. ¿Cómo es la textura de la carne / pollo?',
                    'Consistencia de la proteína',
                    b4_texturaCarne,
                    setB4_texturaCarne,
                    ['Tierna', 'Dura', 'Fibrosa', 'N/A']
                  )}
                  {currentQuestion === 4 && renderWizardSingleSelect(
                    'B5. ¿Cómo está de sal?',
                    'Nivel de salazón',
                    b5_sal,
                    setB5_sal,
                    ['Justa', 'Poca', 'Mucha']
                  )}
                  {currentQuestion === 5 && renderWizardSingleSelect(
                    'B6. ¿Cómo está de dulce?',
                    'Nivel de dulzor',
                    b6_dulce,
                    setB6_dulce,
                    ['Justo', 'Poco', 'Mucho']
                  )}
                  {currentQuestion === 6 && renderWizardSingleSelect(
                    'B7. ¿Cómo está de picante?',
                    'Intensidad de picor',
                    b7_picante,
                    setB7_picante,
                    ['Justo', 'Poco', 'Mucho', 'No debería picar']
                  )}
                  {currentQuestion === 7 && renderWizardSingleSelect(
                    'B8. ¿Cómo es el sabor característico del gusto?',
                    'Fidelidad del sabor a la receta original',
                    b8_saborCaracteristico,
                    setB8_saborCaracteristico,
                    ['Justo', 'Intenso', 'Débil']
                  )}
                  {currentQuestion === 8 && renderWizardSingleSelect(
                    'B9. ¿Algún ingrediente tapa a los demás?',
                    'Equilibrio de ingredientes',
                    b9_ingredienteTapa,
                    setB9_ingredienteTapa,
                    ['No', 'Sí']
                  )}
                  {currentQuestion === 9 && renderWizardMultiSelect(
                    'B10. ¿Sentís algún sabor extraño?',
                    'Seleccioná si detectás algún defecto de sabor',
                    ['No', 'Quemado', 'Rancio', 'Aceite viejo', 'Ácido', 'Otro'],
                    b10_saborExtrano,
                    (opt: any) => toggleArrayItem(b10_saborExtrano, setB10_saborExtrano, opt, 'No'),
                    'No'
                  )}
                  {currentQuestion === 10 && renderWizardSingleSelect(
                    'B11. ¿Qué sabor te queda después de tragar?',
                    'Retrogusto y sensación final',
                    b11_retrogusto,
                    setB11_retrogusto,
                    ['Agradable', 'Neutro', 'Desagradable']
                  )}
                  {currentQuestion === 11 && renderWizardTextInput(
                    'Observaciones Boca',
                    'Detalle sobre textura, paladar o balance de sabor',
                    obs_boca,
                    setObs_boca,
                    'Detalle sobre textura, paladar, balance de sabor...'
                  )}
                </>
              )}

              {/* MÓDULO 3: GLOBAL & FIRMA */}
              {currentModule === 3 && (
                <>
                  {currentQuestion === 0 && renderWizardSingleSelect(
                    'G1. ¿Es igual al estándar del gusto?',
                    'Comparación contra el estándar de Mi Gusto',
                    g1_estandarGusto,
                    setG1_estandarGusto,
                    ['Igual', 'Leve diferencia', 'Muy diferente']
                  )}

                  {currentQuestion === 1 && (
                    <div className="space-y-4 animate-fade-in text-center py-2">
                      <div>
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#2c2724] leading-snug">
                          G2. ¿Cuánto te gusta en general?
                        </h3>
                        <p className="text-[11px] text-[#7c746d] mt-0.5">
                          Asigná una calificación general de 1 a 5 estrellas
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 sm:gap-3 py-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setG2_gustoGeneral(star)}
                            className="p-1.5 sm:p-2 rounded-2xl transition-transform active:scale-90 hover:scale-110"
                          >
                            <Star
                              className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors ${
                                star <= g2_gustoGeneral
                                  ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                                  : 'fill-[#ede6d8] text-[#ded4c3]'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <div className="inline-block px-4 py-1.5 rounded-full bg-[#fef9ee] border border-[#fde68a] text-[#b45309] font-extrabold text-xs">
                        {g2_gustoGeneral} de 5 {g2_gustoGeneral === 5 ? '★ Excelente' : g2_gustoGeneral >= 4 ? '★ Muy Bueno' : '★ Aceptable'}
                      </div>
                    </div>
                  )}

                  {currentQuestion === 2 && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div>
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#2c2724] leading-snug">
                          G3. ¿Aprobarías este producto para despacho?
                        </h3>
                        <p className="text-[11px] text-[#7c746d] mt-0.5">
                          Resolución final de calidad para liberar el lote
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'Sí', label: 'Sí (Aprobado)', desc: 'Apto para despacho' },
                          { id: 'Sí con observaciones', label: 'Sí c/ Observaciones', desc: 'Con desvíos menores' },
                          { id: 'No', label: 'No (Rechazado)', desc: 'Bloquear lote / No conforme' }
                        ].map(item => {
                          const isSelected = g3_aprobacion === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setG3_aprobacion(item.id as any)}
                              className={`p-3 rounded-xl border text-center transition-all active:scale-95 ${
                                isSelected
                                  ? item.id === 'Sí'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : item.id === 'Sí con observaciones'
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                    : 'bg-[#eb5757] text-white border-[#eb5757] shadow-sm'
                                  : 'bg-[#f5f0e6] border-[#e2d9c8] text-[#3d3630] hover:bg-[#ede6d8]'
                              }`}
                            >
                              <p className="font-extrabold text-xs">{item.label}</p>
                              <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#7c746d]'}`}>
                                {item.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {currentQuestion === 3 && renderWizardTextInput(
                    'Observaciones Globales',
                    'Conclusión general sobre la partida o batea evaluada',
                    obs_global,
                    setObs_global,
                    'Conclusión general sobre la partida o batea...'
                  )}

                  {currentQuestion === 4 && (
                    <div className="space-y-4 animate-fade-in">
                      <div>
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#2c2724] leading-snug">
                          Firma del Evaluador & Evidencias Fotográficas
                        </h3>
                        <p className="text-[11px] text-[#7c746d] mt-0.5">
                          Firmá digitalmente para dar validez técnica a la evaluación INF-D003
                        </p>
                      </div>

                      {/* Firma digital */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-[#3d3630] font-bold">
                            Firma del Evaluador ({evaluador}):
                          </span>
                          {hasSignature && (
                            <button
                              type="button"
                              onClick={clearSignature}
                              className="text-[10px] text-[#eb5757] font-bold hover:underline"
                            >
                              Limpiar firma
                            </button>
                          )}
                        </div>
                        <div className="rounded-xl border border-[#ded4c3] bg-[#f5f0e6] overflow-hidden touch-none shadow-sm">
                          <canvas
                            ref={canvasRef}
                            width={380}
                            height={120}
                            onMouseDown={startDrawing}
                            onMouseUp={stopDrawing}
                            onMouseMove={draw}
                            onTouchStart={startDrawing}
                            onTouchEnd={stopDrawing}
                            onTouchMove={draw}
                            className="w-full h-[110px] cursor-crosshair bg-[#f5f0e6]"
                          />
                        </div>
                      </div>

                      {/* Fotos de la Muestra */}
                      <div className="pt-2">
                        <span className="text-[11px] text-[#3d3630] font-bold block mb-1.5">
                          Fotos de la muestra cortada (opcional):
                        </span>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <label className="flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-[#ded4c3] hover:border-[#4f46e5] bg-[#f5f0e6] hover:bg-[#ede6d8] text-[#4f46e5] cursor-pointer active:scale-95 transition-all shadow-sm">
                            <Camera className="w-5 h-5 mb-1 text-[#4f46e5]" />
                            <span className="text-[9.5px] font-bold">Subir</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </label>

                          {photos.map((src, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden group border border-[#e2d9c8] shadow-sm">
                              <img src={src} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removePhoto(idx)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#eb5757] transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Barra de Navegación del Wizard */}
            <div className="pt-4 border-t border-[#e2d9c8] flex items-center justify-between gap-2">
              {/* Botón Anterior */}
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentModule === 0 && currentQuestion === 0}
                className="px-3.5 py-2.5 rounded-xl border border-[#e2d9c8] text-[#4a423b] bg-[#f5f0e6] hover:bg-[#ede6d8] text-xs font-bold flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {/* Botón Siguiente / Siguiente Módulo / Guardar */}
              {currentModule === 3 && currentQuestion === 4 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || isAnalyzing}
                  className="w-auto py-2.5 px-5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-[#4f46e5]/25 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Evaluación (INF-D003)</span>
                </button>
              ) : currentQuestion === MODULES[currentModule].totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-auto py-2.5 px-5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-[#4f46e5]/25 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 group"
                >
                  <span>Módulo {MODULES[currentModule + 1].name}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-auto py-2.5 px-5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-[#4f46e5]/25 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 group"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PANTALLA DE CARGA / ANÁLISIS SENSORIAL (5 SEGUNDOS)
          ========================================================================= */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-[#1c1815]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#fdfbf7] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e2d9c8] shadow-2xl text-center space-y-6">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              {/* Pulso exterior Rojo Coral */}
              <div className="absolute inset-0 rounded-full bg-[#FC7572]/20 animate-ping opacity-60" />
              {/* Aro giratorio tricolor: Rojo Coral (#FC7572) y Azul Violáceo (#5969E6) sobre Beige (#ebdccb) */}
              <div
                className="absolute inset-1 rounded-full border-[3.5px] border-transparent border-t-[#FC7572] border-r-[#5969E6] border-b-[#ebdccb] animate-spin"
                style={{ animationDuration: '1.8s' }}
              />
              {/* Círculo central en Beige Pastel con el logo de Mi Gusto */}
              <div className="relative w-20 h-20 rounded-full bg-[#ebdccb] border-2 border-[#e2d9c8] shadow-inner flex items-center justify-center p-3">
                <img
                  src={`${import.meta.env.BASE_URL}logo-script.png`}
                  alt="Mi Gusto"
                  className="w-full h-auto object-contain brightness-0 drop-shadow-sm"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5969E6] bg-[#eeedfc] px-3 py-1 rounded-full border border-[#d7d4f9]">
                Control de Calidad Mi Gusto
              </span>
              <h3 className="text-lg sm:text-xl font-black text-[#2c2724] mt-3">
                Analizando Evaluación Sensorial
              </h3>
              <p className="text-xs text-[#7c746d] mt-1">
                Procesando parámetros organolépticos según protocolo INF-D003...
              </p>
            </div>

            {/* Etapa actual y Barra de Progreso */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#3d3630] truncate max-w-[240px] text-left">
                  {analysisStageText}
                </span>
                <span className="text-[#4f46e5] font-mono">{analysisProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#ede6d8] overflow-hidden border border-[#ded4c3]">
                <div
                  className="h-full bg-gradient-to-r from-[#4f46e5] to-[#4338ca] rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#7c746d] border-t border-[#e2d9c8] flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auditando muestra: <strong className="text-[#2c2724]">{loteBatea}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MENSAJE PERSONALIZADO DE AGRADECIMIENTO TRAS EL ANÁLISIS
          ========================================================================= */}
      {showThankYou && (
        <div className="bg-[#fdfbf7] rounded-3xl p-6 sm:p-8 border border-[#e2d9c8] shadow-md text-center space-y-6 animate-slide-down">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Evaluación Registrada con Éxito
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#2c2724] mt-3">
              ¡Muchas gracias, {evaluador}!
            </h2>
            <p className="text-xs sm:text-sm text-[#4a423b] mt-2 leading-relaxed max-w-md mx-auto">
              Tu evaluación sensorial ha sido analizada e incorporada al sistema de Control de Calidad de Mi Gusto bajo el protocolo oficial <strong className="text-[#2c2724]">INF-D003</strong>.
            </p>
          </div>

          {/* Resumen de la evaluación */}
          <div className="p-4 rounded-2xl bg-[#f5f0e6] border border-[#e2d9c8] text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#ded4c3]">
              <span className="text-[#7c746d]">Gusto evaluado:</span>
              <span className="font-bold text-[#2c2724]">{gusto === 'OTRO' ? otroGusto : gusto}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#ded4c3]">
              <span className="text-[#7c746d]">Lote / Batea:</span>
              <span className="font-mono font-bold text-[#2c2724]">{loteBatea}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#ded4c3]">
              <span className="text-[#7c746d]">Dictamen final:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                g3_aprobacion === 'Sí'
                  ? 'bg-emerald-100 text-emerald-800'
                  : g3_aprobacion === 'Sí con observaciones'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-[#fdf2f2] text-[#eb5757] border border-[#fecaca]'
              }`}>
                {g3_aprobacion === 'Sí' ? 'Aprobado' : g3_aprobacion === 'Sí con observaciones' ? 'Aprobado c/ Obs.' : 'Rechazado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#7c746d]">Puntaje global:</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                {g2_gustoGeneral} de 5 <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              </span>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Footer Sutil - Siempre al pie del viewport */}
      <footer className="mt-auto pt-8 pb-3 border-t border-[#e2d9c8] text-center">
        <p className="text-[10px] sm:text-[11px] text-[#7c746d] font-medium tracking-wide">
          © Desarrollado por el Departamento de Sistemas de Mi Gusto | Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};
