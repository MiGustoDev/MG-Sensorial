import { useState, useRef } from 'react';
import type { SensorialFormAnswers } from '../types';
import { EMPANADAS_GUSTOS } from '../types';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Camera,
  Trash2,
  Save,
  ChevronRight,
  Eye,
  Wind,
  Smile,
  Award,
  PenTool,
  RotateCcw
} from 'lucide-react';

interface EvaluationFormProps {
  onSavedSuccess?: () => void;
  onOpenAdmin: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({ onSavedSuccess, onOpenAdmin }) => {
  // Encabezado
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [evaluador, setEvaluador] = useState('');
  const [loteBatea, setLoteBatea] = useState('');
  const [gusto, setGusto] = useState(EMPANADAS_GUSTOS[0]);
  const [otroGusto, setOtroGusto] = useState('');
  const [codigoMuestra, setCodigoMuestra] = useState('');

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
  const [g2_gustoGeneral, setG2_gustoGeneral] = useState<number>(5);
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
    ctx.strokeStyle = '#38a5f8';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const actualGusto = gusto === 'OTRO' ? otroGusto.trim() : gusto;

    if (!evaluador.trim()) {
      setErrorMessage('Por favor completá el nombre del Evaluador');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!loteBatea.trim()) {
      setErrorMessage('Por favor indicá el Lote o Batea');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!actualGusto) {
      setErrorMessage('Por favor indicá el gusto a evaluar');
      return;
    }

    setSaving(true);

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

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#38a5f8', '#026bc9', '#10b981', '#ffffff']
      });

      setSuccessSaved(true);
      if (onSavedSuccess) onSavedSuccess();

      // Resetear lote y firma para siguiente gusto
      setLoteBatea('');
      setCodigoMuestra('');
      setPhotos([]);
      clearSignature();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Helper para renderizar selector tipo Chips de opción única
  const renderSingleSelect = (
    label: string,
    currentValue: string,
    onChange: (val: any) => void,
    options: string[]
  ) => (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-300 block">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isSelected = currentValue === opt;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                isSelected
                  ? 'bg-qc-600 text-white border-qc-400 shadow-md shadow-qc-600/30'
                  : 'bg-dark-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 pb-28 text-slate-100">
      {/* Cabecera Documental Oficial */}
      <div className="mb-4 p-3.5 rounded-2xl glass-panel border border-qc-500/25">
        <div className="flex items-center justify-between border-b border-qc-500/15 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-white">Mi Gusto</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-qc-950 text-qc-400 border border-qc-500/30">
              CÓDIGO: INF-D003
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">VERSIÓN: 2</span>
            <span className="text-[10px] font-mono text-qc-400 font-bold block">VIGENCIA: 2026</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-white">
            Cuestionario de Evaluación Sensorial
          </h1>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="text-[11px] font-bold text-qc-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-qc-900/60 border border-qc-500/30"
          >
            <span>Historial</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
          Marcá UNA opción por pregunta. Evaluá en orden: vista, olfato y boca. Probá del gusto más suave al más intenso. Entre gustos: agua y galleta sin sal.
        </p>
      </div>

      {successSaved && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-xs">¡Evaluación INF-D003 Registrada!</p>
              <p className="text-[11px] text-emerald-400/80">Guardada en el historial de Calidad.</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessSaved(false)}
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200"
          >
            Nueva
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ENCABEZADO: FECHA, HORA, EVALUADOR, LOTE / BATEA, GUSTO */}
        <div className="glass-panel p-4 rounded-2xl space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">FECHA:</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">HORA:</label>
              <input
                type="time"
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">EVALUADOR: *</label>
              <input
                type="text"
                required
                placeholder="Nombre del evaluador"
                value={evaluador}
                onChange={e => setEvaluador(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">LOTE / BATEA: *</label>
              <input
                type="text"
                required
                placeholder="Ej. BATEA-04 / LOT-12"
                value={loteBatea}
                onChange={e => setLoteBatea(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold uppercase text-qc-400 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-qc-500/10">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">GUSTO A EVALUAR: *</label>
              <select
                value={gusto}
                onChange={e => setGusto(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white font-medium"
              >
                {EMPANADAS_GUSTOS.map(g => (
                  <option key={g} value={g} className="bg-slate-900">{g}</option>
                ))}
                <option value="OTRO" className="bg-slate-900">-- OTRO / DESARROLLO --</option>
              </select>
              {gusto === 'OTRO' && (
                <input
                  type="text"
                  placeholder="Especificar gusto..."
                  value={otroGusto}
                  onChange={e => setOtroGusto(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-xl glass-input text-xs text-white"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">CÓDIGO DE MUESTRA:</label>
              <input
                type="text"
                placeholder="Ej. M-01"
                value={codigoMuestra}
                onChange={e => setCodigoMuestra(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono uppercase text-white placeholder-slate-600"
              />
            </div>
          </div>
        </div>

        {/* 1. VISTA – empanada cortada al medio */}
        <div className="glass-panel p-4 rounded-2xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-qc-500/20">
            <Eye className="w-4 h-4 text-qc-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-qc-300">
              1. VISTA – Empanada cortada al medio
            </h2>
          </div>

          {renderSingleSelect('V1. ¿El color del relleno es el esperado para el gusto?', v1_color, setV1_color, ['Sí', 'Más claro', 'Más oscuro'])}
          {renderSingleSelect('V2. ¿Cómo es la cantidad de relleno?', v2_cantidad, setV2_cantidad, ['Poco', 'Justo', 'Mucho'])}
          {renderSingleSelect('V3. ¿Cómo está el mezclado de los ingredientes?', v3_mezclado, setV3_mezclado, ['Parejo', 'Desparejo', 'Sin mezclar'])}
          {renderSingleSelect('V4. ¿Están todos los ingredientes de la receta?', v4_ingredientesReceta, setV4_ingredientesReceta, ['Sí', 'Falta alguno'])}
          {renderSingleSelect('V5. ¿Hay algún ingrediente que no corresponde al gusto?', v5_ingredienteExtrano, setV5_ingredienteExtrano, ['No', 'Sí'])}
          {renderSingleSelect('V6. ¿Cómo está sellada la carne / pollo?', v6_selladoCarne, setV6_selladoCarne, ['Gris o hervida', 'Dorada y jugosa', 'Seca o quemada', 'N/A'])}
          {renderSingleSelect('V7. ¿Cómo están rehogados los vegetales?', v7_rehogadoVegetales, setV7_rehogadoVegetales, ['Crudos', 'Justo', 'Quemados', 'N/A'])}
          {renderSingleSelect('V8. ¿Cómo está la caramelización (cebolla u otro)?', v8_caramelizacion, setV8_caramelizacion, ['Poca', 'Justa', 'Excesiva', 'N/A'])}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Observaciones Vista:</label>
            <input
              type="text"
              placeholder="Anotá el detalle si marcaste una respuesta fuera de lo esperado..."
              value={obs_vista}
              onChange={e => setObs_vista(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-600"
            />
          </div>
        </div>

        {/* 2. OLFATO – relleno recién cortado */}
        <div className="glass-panel p-4 rounded-2xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-qc-500/20">
            <Wind className="w-4 h-4 text-qc-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-qc-300">
              2. OLFATO – Relleno recién cortado
            </h2>
          </div>

          {renderSingleSelect('O1. ¿Cómo es la intensidad del aroma?', o1_intensidadAroma, setO1_intensidadAroma, ['Débil', 'Justa', 'Fuerte'])}
          {renderSingleSelect('O2. ¿Reconocés el aroma característico del gusto?', o2_aromaCaracteristico, setO2_aromaCaracteristico, ['Sí', 'Poco', 'No'])}

          {/* O3 Olor extraño (multiselección) */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 block">O3. ¿Sentís algún olor extraño?</span>
            <div className="flex flex-wrap gap-1.5">
              {(['No', 'Quemado', 'Rancio', 'Aceite viejo', 'Ácido', 'Otro'] as const).map(opt => {
                const isSelected = o3_olorExtrano.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleArrayItem(o3_olorExtrano, setO3_olorExtrano, opt, 'No')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                      isSelected
                        ? opt === 'No'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-rose-600 text-white border-rose-400'
                        : 'bg-dark-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Observaciones Olfato:</label>
            <input
              type="text"
              placeholder="Detalle de olores u observaciones..."
              value={obs_olfato}
              onChange={e => setObs_olfato(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-600"
            />
          </div>
        </div>

        {/* 3. BOCA – primer bocado, masa y relleno juntos */}
        <div className="glass-panel p-4 rounded-2xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-qc-500/20">
            <Smile className="w-4 h-4 text-qc-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-qc-300">
              3. BOCA – Primer bocado, masa y relleno juntos
            </h2>
          </div>

          {/* B1 Primer impacto (selección múltiple de sensaciones) */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 block">B1. ¿Qué fue lo primero que sentiste al morder?</span>
            <div className="flex flex-wrap gap-1.5">
              {(['Masa', 'Carne / proteína', 'Queso', 'Cebolla', 'Especias', 'Picante', 'Sal', 'Dulce', 'Grasa'] as const).map(opt => {
                const isSelected = b1_primerImpacto.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleArrayItem(b1_primerImpacto, setB1_primerImpacto, opt)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                      isSelected
                        ? 'bg-qc-600 text-white border-qc-400'
                        : 'bg-dark-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {renderSingleSelect('B2. ¿Cómo es la textura de la masa?', b2_texturaMasa, setB2_texturaMasa, ['Cruda', 'Tierna', 'Crocante', 'Dura'])}
          {renderSingleSelect('B3. ¿Cómo es la jugosidad del relleno?', b3_jugosidadRelleno, setB3_jugosidadRelleno, ['Seco', 'Jugoso', 'Muy húmedo'])}
          {renderSingleSelect('B4. ¿Cómo es la textura de la carne / pollo?', b4_texturaCarne, setB4_texturaCarne, ['Tierna', 'Dura', 'Fibrosa', 'N/A'])}
          {renderSingleSelect('B5. ¿Cómo está de sal?', b5_sal, setB5_sal, ['Poca', 'Justa', 'Mucha'])}
          {renderSingleSelect('B6. ¿Cómo está de dulce?', b6_dulce, setB6_dulce, ['Poco', 'Justo', 'Mucho'])}
          {renderSingleSelect('B7. ¿Cómo está de picante?', b7_picante, setB7_picante, ['Poco', 'Justo', 'Mucho', 'No debería picar'])}
          {renderSingleSelect('B8. ¿Cómo es el sabor característico del gusto?', b8_saborCaracteristico, setB8_saborCaracteristico, ['Débil', 'Justo', 'Intenso'])}
          {renderSingleSelect('B9. ¿Algún ingrediente tapa a los demás?', b9_ingredienteTapa, setB9_ingredienteTapa, ['No', 'Sí'])}

          {/* B10 Sabor extraño */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 block">B10. ¿Sentís algún sabor extraño?</span>
            <div className="flex flex-wrap gap-1.5">
              {(['No', 'Quemado', 'Rancio', 'Aceite viejo', 'Ácido', 'Otro'] as const).map(opt => {
                const isSelected = b10_saborExtrano.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleArrayItem(b10_saborExtrano, setB10_saborExtrano, opt, 'No')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                      isSelected
                        ? opt === 'No'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-rose-600 text-white border-rose-400'
                        : 'bg-dark-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {renderSingleSelect('B11. ¿Qué sabor te queda después de tragar?', b11_retrogusto, setB11_retrogusto, ['Agradable', 'Neutro', 'Desagradable'])}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Observaciones Boca:</label>
            <input
              type="text"
              placeholder="Detalle sobre textura, sabor, balance..."
              value={obs_boca}
              onChange={e => setObs_boca(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-600"
            />
          </div>
        </div>

        {/* 4. EVALUACIÓN GLOBAL */}
        <div className="glass-panel p-4 rounded-2xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-qc-500/20">
            <Award className="w-4 h-4 text-qc-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-qc-300">
              4. EVALUACIÓN GLOBAL
            </h2>
          </div>

          {renderSingleSelect('G1. ¿Es igual al estándar del gusto?', g1_estandarGusto, setG1_estandarGusto, ['Igual', 'Leve diferencia', 'Muy diferente'])}

          {/* G2 ¿Cuánto te gusta en general? 1 a 5 */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 block">
              G2. ¿Cuánto te gusta en general? (1 = nada • 5 = mucho)
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setG2_gustoGeneral(num)}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all border active:scale-95 ${
                    g2_gustoGeneral === num
                      ? 'bg-qc-500 text-white border-qc-300 shadow-md shadow-qc-500/30'
                      : 'bg-dark-900/70 border-slate-800 text-slate-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* G3 ¿Aprobarías este producto? */}
          {renderSingleSelect('G3. ¿Aprobarías este producto?', g3_aprobacion, setG3_aprobacion, ['Sí', 'Sí con observaciones', 'No'])}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Observaciones Globales:</label>
            <textarea
              rows={2}
              placeholder="Conclusión general sobre la partida o batea..."
              value={obs_global}
              onChange={e => setObs_global(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-600 resize-none"
            />
          </div>
        </div>

        {/* FIRMA Y EVIDENCIA FOTOGRÁFICA */}
        <div className="glass-panel p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-qc-500/20">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-qc-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-qc-300">
                Firma del Evaluador & Fotos
              </h2>
            </div>
            {hasSignature && (
              <button
                type="button"
                onClick={clearSignature}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Borrar Firma</span>
              </button>
            )}
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">
              Firmá con el dedo en el recuadro:
            </span>
            <div className="rounded-xl border border-qc-500/25 bg-dark-950 overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={360}
                height={120}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="w-full h-[100px] cursor-crosshair bg-slate-950/60"
              />
            </div>
          </div>

          {/* Fotos de la Muestra */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-400 block mb-1.5">
              Fotos de la muestra cortada (opcional):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 border-dashed border-qc-500/30 hover:border-qc-400 bg-qc-950/60 text-qc-400 cursor-pointer active:scale-95">
                <Camera className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] font-bold">Subir</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photos.map((src, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden group border border-qc-500/20">
                  <img src={src} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botón flotante inferior fijo para mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#05070c] via-[#05070c]/95 to-transparent backdrop-blur-md border-t border-qc-500/15 z-30">
          <div className="max-w-xl mx-auto">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-qc-600 via-qc-500 to-blue-600 hover:from-qc-500 hover:to-blue-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-qc-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span>Guardando Evaluación INF-D003...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Evaluación Sensorial (INF-D003)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
