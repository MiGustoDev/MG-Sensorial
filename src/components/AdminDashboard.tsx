import { useState, useEffect, useRef } from 'react';
import type { SensorialEvaluationRecord } from '../types';
import { formatDisplayDate } from '../types';
import { supabase } from '../lib/supabase';
import {
  syncPendingEvaluations,
  getPendingEvaluations,
  SYNC_EVENT_NAME
} from '../lib/syncService';
import { AnimatedNumber, AnimatedBar, SmoothModal, AnimatedDonutChart, AnimatedRadialGauge } from '../utils/gsapAnimations';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  LogOut,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart,
  TrendingUp,
  ChevronDown,
  Check,
  Star
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
  currentUser: string;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  currentUser,
  onLogout,
}) => {
  const [evaluations, setEvaluations] = useState<SensorialEvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAprobacion, setFilterAprobacion] = useState<string>('ALL');
  const [pendingOfflineCount, setPendingOfflineCount] = useState(() => getPendingEvaluations().length);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<SensorialEvaluationRecord | null>(null);
  const [selectedStats, setSelectedStats] = useState<SensorialEvaluationRecord | null>(null);
  const [evaluationToDelete, setEvaluationToDelete] = useState<SensorialEvaluationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statsContentRef = useRef<HTMLDivElement>(null);
  const evalContentRef = useRef<HTMLDivElement>(null);

  // Bloquear scroll de la página de fondo cuando cualquier modal esté abierto
  useEffect(() => {
    if (selectedEvaluation || selectedStats || evaluationToDelete) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedEvaluation, selectedStats, evaluationToDelete]);

  // Asegurar que al abrir el modal siempre comience desde la parte superior (top: 0)
  useEffect(() => {
    if (selectedStats && statsContentRef.current) {
      statsContentRef.current.scrollTop = 0;
    }
  }, [selectedStats]);

  useEffect(() => {
    if (selectedEvaluation && evalContentRef.current) {
      evalContentRef.current.scrollTop = 0;
    }
  }, [selectedEvaluation]);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      // Auto-sincronizar cualquier registro pendiente en este dispositivo
      await syncPendingEvaluations().catch(err => console.warn('Sync error:', err));
      setPendingOfflineCount(getPendingEvaluations().length);

      const { data, error } = await supabase
        .from('sensorial_evaluations_v2')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, fallback to local:', error);
        const local = JSON.parse(localStorage.getItem('mg_sensorial_official_history') || '[]');
        setEvaluations(local);
      } else {
        const local = JSON.parse(localStorage.getItem('mg_sensorial_official_history') || '[]');
        // Unificar supabase con offline si hubiese
        const mappedData: SensorialEvaluationRecord[] = (data || []).map((d: any) => ({
          id: d.id,
          created_at: d.created_at,
          fecha: d.fecha,
          hora: d.hora,
          evaluador: d.evaluador,
          loteBatea: d.lote_batea,
          gusto: d.gusto,
          codigoMuestra: d.codigo_muestra,
          v1_color: d.v1_color,
          v2_cantidad: d.v2_cantidad,
          v3_mezclado: d.v3_mezclado,
          v4_ingredientesReceta: d.v4_ingredientes_receta,
          v5_ingredienteExtrano: d.v5_ingrediente_extrano,
          v6_selladoCarne: d.v6_sellado_carne,
          v7_rehogadoVegetales: d.v7_rehogado_vegetales,
          v8_caramelizacion: d.v8_caramelizacion,
          obs_vista: d.obs_vista,
          o1_intensidadAroma: d.o1_intensidad_aroma,
          o2_aromaCaracteristico: d.o2_aroma_caracteristico,
          o3_olorExtrano: d.o3_olor_extrano || [],
          obs_olfato: d.obs_olfato,
          b1_primerImpacto: d.b1_primer_impacto || [],
          b2_texturaMasa: d.b2_textura_masa,
          b3_jugosidadRelleno: d.b3_jugosidad_relleno,
          b4_texturaCarne: d.b4_textura_carne,
          b5_sal: d.b5_sal,
          b6_dulce: d.b6_dulce,
          b7_picante: d.b7_picante,
          b8_saborCaracteristico: d.b8_sabor_caracteristico,
          b9_ingredienteTapa: d.b9_ingrediente_tapa,
          b10_saborExtrano: d.b10_sabor_extrano || [],
          b11_retrogusto: d.b11_retrogusto,
          obs_boca: d.obs_boca,
          g1_estandarGusto: d.g1_estandar_gusto,
          g2_gustoGeneral: d.g2_gusto_general,
          g3_aprobacion: d.g3_aprobacion,
          obs_global: d.obs_global,
          firmaEvaluador: d.firma_evaluador,
          fotos: d.fotos || []
        }));
        const combined = [...mappedData, ...local.filter((l: any) => !mappedData.some(d => d.id === l.id))];
        setEvaluations(combined);
      }
    } catch (err) {
      console.error(err);
      const local = JSON.parse(localStorage.getItem('mg_sensorial_official_history') || '[]');
      setEvaluations(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();

    const handleSyncUpdate = () => {
      setPendingOfflineCount(getPendingEvaluations().length);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSyncUpdate);
    return () => window.removeEventListener(SYNC_EVENT_NAME, handleSyncUpdate);
  }, []);

  const handleConfirmDelete = async (closeWithAnimation: () => void) => {
    if (!evaluationToDelete?.id) return;
    const id = evaluationToDelete.id;
    setIsDeleting(true);

    try {
      if (id.startsWith('local_')) {
        const local = JSON.parse(localStorage.getItem('mg_sensorial_official_history') || '[]');
        const filtered = local.filter((item: any) => item.id !== id);
        localStorage.setItem('mg_sensorial_official_history', JSON.stringify(filtered));
      } else {
        await supabase.from('sensorial_evaluations_v2').delete().eq('id', id);
      }
      setEvaluations(prev => prev.filter(e => e.id !== id));
      if (selectedEvaluation?.id === id) setSelectedEvaluation(null);
      closeWithAnimation();
      setEvaluationToDelete(null);
    } catch (err) {
      console.error('Error al borrar', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredList = evaluations.filter(ev => {
    const matchesSearch =
      ev.gusto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.loteBatea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.evaluador.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAprob = filterAprobacion === 'ALL' || ev.g3_aprobacion === filterAprobacion;

    return matchesSearch && matchesAprob;
  });

  const exportCSV = () => {
    if (evaluations.length === 0) return;
    const headers = [
      'Fecha',
      'Hora',
      'Evaluador',
      'Lote/Batea',
      'Gusto',
      'Muestra',
      'V1 Color',
      'V2 Cantidad',
      'V3 Mezclado',
      'V4 Receta',
      'V5 Extrano',
      'V6 Sellado',
      'V7 Rehogado',
      'V8 Caramelizado',
      'Obs Vista',
      'O1 Intensidad',
      'O2 Caracteristico',
      'O3 Olores Extranos',
      'Obs Olfato',
      'B1 Primer Impacto',
      'B2 Masa',
      'B3 Jugosidad',
      'B4 Carne',
      'B5 Sal',
      'B6 Dulce',
      'B7 Picante',
      'B8 Sabor Caracteristico',
      'B9 Tapa Ingredientes',
      'B10 Sabores Extranos',
      'B11 Retrogusto',
      'Obs Boca',
      'G1 Estandar',
      'G2 Gusto General (1-5)',
      'G3 Aprobacion',
      'Obs Global'
    ];

    const rows = evaluations.map(e => [
      formatDisplayDate(e.fecha),
      e.hora,
      `"${e.evaluador}"`,
      `"${e.loteBatea}"`,
      `"${e.gusto}"`,
      `"${e.codigoMuestra || ''}"`,
      e.v1_color,
      e.v2_cantidad,
      e.v3_mezclado,
      e.v4_ingredientesReceta,
      e.v5_ingredienteExtrano,
      e.v6_selladoCarne,
      e.v7_rehogadoVegetales,
      e.v8_caramelizacion,
      `"${(e.obs_vista || '').replace(/"/g, '""')}"`,
      e.o1_intensidadAroma,
      e.o2_aromaCaracteristico,
      `"${(e.o3_olorExtrano || []).join(';')}"`,
      `"${(e.obs_olfato || '').replace(/"/g, '""')}"`,
      `"${(e.b1_primerImpacto || []).join(';')}"`,
      e.b2_texturaMasa,
      e.b3_jugosidadRelleno,
      e.b4_texturaCarne,
      e.b5_sal,
      e.b6_dulce,
      e.b7_picante,
      e.b8_saborCaracteristico,
      e.b9_ingredienteTapa,
      `"${(e.b10_saborExtrano || []).join(';')}"`,
      e.b11_retrogusto,
      `"${(e.obs_boca || '').replace(/"/g, '""')}"`,
      e.g1_estandarGusto,
      e.g2_gustoGeneral,
      e.g3_aprobacion,
      `"${(e.obs_global || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `INF-D003_Evaluaciones_Sensoriales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    total: evaluations.length,
    aprobados: evaluations.filter(e => e.g3_aprobacion === 'Sí').length,
    observados: evaluations.filter(e => e.g3_aprobacion === 'Sí con observaciones').length,
    rechazados: evaluations.filter(e => e.g3_aprobacion === 'No').length,
    promedioGusto: evaluations.length
      ? (evaluations.reduce((acc, curr) => acc + (curr.g2_gustoGeneral || 0), 0) / evaluations.length).toFixed(1)
      : '0.0'
  };

  // Click outside para cerrar dropdown de filtro personalizado
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#filter-dropdown-container')) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

  // Agrupamiento y cálculo para Top Gustos Catados
  const gustoCounts: Record<string, { count: number; totalRating: number }> = {};
  evaluations.forEach(ev => {
    if (!gustoCounts[ev.gusto]) {
      gustoCounts[ev.gusto] = { count: 0, totalRating: 0 };
    }
    gustoCounts[ev.gusto].count += 1;
    gustoCounts[ev.gusto].totalRating += (ev.g2_gustoGeneral || 0);
  });

  const topGustos = Object.entries(gustoCounts)
    .map(([gusto, data]) => ({
      gusto,
      count: data.count,
      avgRating: (data.totalRating / data.count).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count);

  // Helper para calcular métricas organolépticas individuales de una muestra
  const calculateSensoryMetrics = (ev: SensorialEvaluationRecord) => {
    let vistaScore = 100;
    if (ev.v1_color !== 'Sí') vistaScore -= 20;
    if (ev.v2_cantidad !== 'Justo') vistaScore -= 15;
    if (ev.v3_mezclado !== 'Parejo') vistaScore -= 15;
    if (ev.v4_ingredientesReceta !== 'Sí') vistaScore -= 20;
    if (ev.v5_ingredienteExtrano !== 'No') vistaScore -= 30;
    if (ev.v6_selladoCarne !== 'Dorada y jugosa' && ev.v6_selladoCarne !== 'N/A') vistaScore -= 15;
    if (ev.v7_rehogadoVegetales !== 'Justo' && ev.v7_rehogadoVegetales !== 'N/A') vistaScore -= 10;
    if (ev.v8_caramelizacion !== 'Justa' && ev.v8_caramelizacion !== 'N/A') vistaScore -= 10;
    vistaScore = Math.max(15, Math.min(100, vistaScore));

    let olfatoScore = 100;
    if (ev.o1_intensidadAroma !== 'Justa') olfatoScore -= 20;
    if (ev.o2_aromaCaracteristico !== 'Sí') olfatoScore -= 30;
    const oloresExtranos = (ev.o3_olorExtrano || []).filter(o => o !== 'No');
    if (oloresExtranos.length > 0) olfatoScore -= 40;
    olfatoScore = Math.max(15, Math.min(100, olfatoScore));

    let bocaScore = 100;
    if (ev.b2_texturaMasa !== 'Tierna') bocaScore -= 20;
    if (ev.b3_jugosidadRelleno !== 'Jugoso') bocaScore -= 20;
    if (ev.b4_texturaCarne !== 'Tierna' && ev.b4_texturaCarne !== 'N/A') bocaScore -= 15;
    if (ev.b5_sal !== 'Justa') bocaScore -= 15;
    if (ev.b8_saborCaracteristico !== 'Justo') bocaScore -= 20;
    const saboresExtranos = (ev.b10_saborExtrano || []).filter(s => s !== 'No');
    if (saboresExtranos.length > 0) bocaScore -= 35;
    if (ev.b11_retrogusto !== 'Agradable') bocaScore -= 15;
    bocaScore = Math.max(15, Math.min(100, bocaScore));

    let globalScore = Math.round((ev.g2_gustoGeneral / 5) * 100);
    if (ev.g3_aprobacion === 'Sí con observaciones') globalScore = Math.min(globalScore, 75);
    if (ev.g3_aprobacion === 'No') globalScore = Math.min(globalScore, 40);

    const totalIndex = Math.round((vistaScore * 0.25) + (olfatoScore * 0.20) + (bocaScore * 0.35) + (globalScore * 0.20));

    return {
      vistaScore,
      olfatoScore,
      bocaScore,
      globalScore,
      totalIndex,
      oloresExtranos,
      saboresExtranos
    };
  };

  return (
    <div className="w-full max-w-xl sm:max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 flex flex-col justify-between animate-fade-in min-h-[calc(100vh-65px)]">
      {/* Header Admin */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#ded4c3]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] text-[#2c2724] hover:bg-[#f5f0e6] shadow-xs active:scale-95 transition-all flex items-center justify-center"
            title="Volver a Cata"
          >
            <ArrowLeft className="w-5 h-5 text-[#5969E6]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#2c2724] tracking-tight leading-tight">
                Historial INF-D003
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-[#5969E6] text-white uppercase tracking-wider">
                Oficial
              </span>
            </div>
            <p className="text-xs text-[#7c746d] mt-0.5">
              Auditor: <span className="text-[#5969E6] font-bold bg-[#eeedfc] px-2 py-0.5 rounded-md border border-[#d7d4f9] ml-1">{currentUser}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingOfflineCount > 0 && (
            <button
              onClick={async () => {
                setIsManualSyncing(true);
                await syncPendingEvaluations();
                await fetchEvaluations();
                setIsManualSyncing(false);
              }}
              title="Sincronizar evaluaciones pendientes guardadas offline"
              className="py-2 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>Sincronizar ({pendingOfflineCount})</span>
            </button>
          )}
          <button
            onClick={fetchEvaluations}
            title="Recargar historial"
            className="p-2.5 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] text-[#5969E6] hover:bg-[#eeedfc] active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCSV}
            title="Descargar Planilla Oficial en CSV"
            className="py-2.5 px-4 rounded-2xl bg-[#4f46e5] hover:bg-[#4338ca] border border-[#4f46e5] text-white text-xs font-extrabold uppercase tracking-wider shadow-md shadow-[#4f46e5]/25 active:scale-95 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Planilla</span>
          </button>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2.5 rounded-2xl bg-[#fdf2f2] border border-[#fecaca] text-[#eb5757] hover:bg-[#fee2e2] active:scale-95 transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Sólidos con alto contraste y conteo numérico animado */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5 mb-6">
        <div className="bg-[#fdfbf7] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#ded4c3] shadow-xs hover:shadow-md transition-shadow">
          <p className="text-[10px] sm:text-xs font-black text-[#7c746d] uppercase tracking-wider">Muestras Evaluadas</p>
          <p className="text-2xl sm:text-3xl font-black text-[#2c2724] mt-1">
            <AnimatedNumber value={stats.total} />
          </p>
        </div>
        <div className="bg-[#f0fdf4] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#bbf7d0] shadow-xs hover:shadow-md transition-shadow">
          <p className="text-[10px] sm:text-xs font-black text-[#166534] uppercase tracking-wider">Aprobadas</p>
          <p className="text-2xl sm:text-3xl font-black text-[#15803d] mt-1">
            <AnimatedNumber value={stats.aprobados} />
          </p>
        </div>
        <div className="bg-[#fffbeb] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#fde68a] shadow-xs hover:shadow-md transition-shadow">
          <p className="text-[10px] sm:text-xs font-black text-[#92400e] uppercase tracking-wider">Con Observaciones</p>
          <p className="text-2xl sm:text-3xl font-black text-[#b45309] mt-1">
            <AnimatedNumber value={stats.observados} />
          </p>
        </div>
        <div className="bg-[#fef2f2] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#fecaca] shadow-xs hover:shadow-md transition-shadow">
          <p className="text-[10px] sm:text-xs font-black text-[#991b1b] uppercase tracking-wider">Rechazadas</p>
          <p className="text-2xl sm:text-3xl font-black text-[#b91c1c] mt-1">
            <AnimatedNumber value={stats.rechazados} />
          </p>
        </div>
        <div className="bg-[#eeedfc] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#d7d4f9] shadow-xs hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <p className="text-[10px] sm:text-xs font-black text-[#5969E6] uppercase tracking-wider">Gusto General</p>
          <p className="text-2xl sm:text-3xl font-black text-[#4338ca] mt-1 font-mono flex items-baseline gap-1">
            <AnimatedNumber value={stats.promedioGusto} decimals={1} /> <span className="text-xs text-[#7c746d] font-sans font-bold">/ 5 ★</span>
          </p>
        </div>
      </div>

      {/* =========================================================================
          PANEL ANALÍTICO: GRÁFICOS GENERALES DEL HISTORIAL DE CATAS
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
        {/* Gráfico 1: Dictámenes de Aprobación (Donut SVG) */}
        <div className="bg-[#fdfbf7] p-4 sm:p-5 rounded-3xl border border-[#ded4c3] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#ded4c3]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#2c2724]">Dictámenes Globales</h3>
                <p className="text-[10px] text-[#7c746d]">Distribución de aprobación INF-D003</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#f5f0e6] text-[#7c746d] border border-[#e2d9c8]">
              {stats.total} catas
            </span>
          </div>

          <div className="py-4 flex items-center justify-around gap-4">
            {/* SVG Donut con animación GSAP */}
            <AnimatedDonutChart
              total={stats.total}
              aprobados={stats.aprobados}
              observados={stats.observados}
              rechazados={stats.rechazados}
              sizeClassName="w-28 h-28"
              strokeWidth={4}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <AnimatedNumber
                  value={stats.total ? Math.round((stats.aprobados / stats.total) * 100) : 0}
                  suffix="%"
                  duration={1.1}
                  className="text-base font-black text-[#2c2724] leading-none"
                />
                <span className="text-[9px] font-bold text-[#7c746d] uppercase mt-0.5">Aprobado</span>
              </div>
            </AnimatedDonutChart>

            {/* Leyenda */}
            <div className="space-y-1.5 flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[#4a423b] truncate">Aprobadas</span>
                </div>
                <span className="font-bold text-[#2c2724]">{stats.aprobados} ({stats.total ? Math.round((stats.aprobados / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[#4a423b] truncate">C/ Observación</span>
                </div>
                <span className="font-bold text-[#2c2724]">{stats.observados} ({stats.total ? Math.round((stats.observados / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-[#4a423b] truncate">Rechazadas</span>
                </div>
                <span className="font-bold text-[#2c2724]">{stats.rechazados} ({stats.total ? Math.round((stats.rechazados / stats.total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Distribución de Calificación General (Estrellas 1 a 5) */}
        <div className="bg-[#fdfbf7] p-4 sm:p-5 rounded-3xl border border-[#ded4c3] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#ded4c3]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#2c2724]">Puntaje Organoléptico</h3>
                <p className="text-[10px] text-[#7c746d]">Escala de 1 a 5 estrellas</p>
              </div>
            </div>
            <span className="text-xs font-mono font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {stats.promedioGusto} ★ prom.
            </span>
          </div>

          <div className="py-2.5 space-y-2 text-xs">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = evaluations.filter(e => e.g2_gustoGeneral === stars).length;
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-2 text-[11px]">
                  <span className="w-7 font-black text-[#4a423b] flex items-center gap-0.5">
                    {stars} <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  </span>
                  <div className="flex-1">
                    <AnimatedBar
                      targetWidthPercent={pct}
                      barClassName={`h-full rounded-full transition-all ${
                        stars >= 4 ? 'bg-[#5969E6]' : stars === 3 ? 'bg-amber-500' : 'bg-rose-400'
                      }`}
                      className="w-full h-3 rounded-full bg-[#ede6d8] overflow-hidden"
                    />
                  </div>
                  <span className="w-12 text-right font-mono font-bold text-[#7c746d]">
                    {count} <span className="text-[9px] font-normal text-[#a69d91]">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 3: Top Gustos Evaluados y Calidad Media */}
        <div className="bg-[#fdfbf7] p-4 sm:p-5 rounded-3xl border border-[#ded4c3] shadow-xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between pb-3 border-b border-[#ded4c3]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#eeedfc] text-[#4f46e5] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#2c2724]">Top Gustos Catados</h3>
                <p className="text-[10px] text-[#7c746d]">Muestras por variedad y aceptación</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#eeedfc] text-[#5969E6] border border-[#d7d4f9]">
              Ranking
            </span>
          </div>

          <div className="py-2.5 space-y-2 text-xs">
            {topGustos.length === 0 ? (
              <p className="text-[#7c746d] text-center py-6 text-xs">Sin registros de gustos aún</p>
            ) : (
              topGustos.slice(0, 4).map((g, idx) => (
                <div key={g.gusto} className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="w-4 h-4 rounded-md bg-[#f5f0e6] text-[#7c746d] font-black text-[9px] flex items-center justify-center border border-[#ded4c3] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#2c2724] truncate">{g.gusto}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-[#7c746d] bg-[#f5f0e6] px-1.5 py-0.5 rounded border border-[#ded4c3]">
                      {g.count} cata{g.count > 1 ? 's' : ''}
                    </span>
                    <span className="font-mono font-black text-amber-600 flex items-center gap-0.5">
                      {g.avgRating} <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Buscador & Filtro con Estilos Personalizados */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7c746d] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar gusto, lote/batea o evaluador..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] text-xs sm:text-sm font-semibold text-[#2c2724] placeholder-[#a69d91] shadow-xs focus:bg-white focus:border-[#5969E6] focus:ring-2 focus:ring-[#5969E6]/20 transition-all outline-none"
          />
        </div>

        {/* Filtro Desplegable con Estilos Personalizados */}
        <div id="filter-dropdown-container" className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen(prev => !prev)}
            className="w-full sm:w-64 px-4 py-2.5 sm:py-3 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] text-xs sm:text-sm font-bold text-[#2c2724] shadow-xs hover:border-[#5969E6] focus:border-[#5969E6] focus:ring-2 focus:ring-[#5969E6]/20 transition-all flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                filterAprobacion === 'Sí'
                  ? 'bg-emerald-500'
                  : filterAprobacion === 'Sí con observaciones'
                  ? 'bg-amber-500'
                  : filterAprobacion === 'No'
                  ? 'bg-rose-500'
                  : 'bg-[#5969E6]'
              }`} />
              <span className="truncate">
                {filterAprobacion === 'ALL'
                  ? 'Todas las aprobaciones'
                  : filterAprobacion === 'Sí'
                  ? 'Aprobados (Sí)'
                  : filterAprobacion === 'Sí con observaciones'
                  ? 'Con observaciones'
                  : 'Rechazados (No)'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#7c746d] shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180 text-[#5969E6]' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-full sm:w-64 bg-[#fdfbf7] rounded-2xl border border-[#ded4c3] shadow-xl p-1.5 z-30 animate-fade-in space-y-1">
              {[
                { value: 'ALL', label: 'Todas las aprobaciones', color: 'bg-[#5969E6]', badge: `${stats.total}` },
                { value: 'Sí', label: 'Aprobados (Sí)', color: 'bg-emerald-500', badge: `${stats.aprobados}` },
                { value: 'Sí con observaciones', label: 'Con observaciones', color: 'bg-amber-500', badge: `${stats.observados}` },
                { value: 'No', label: 'Rechazados (No)', color: 'bg-rose-500', badge: `${stats.rechazados}` }
              ].map(opt => {
                const isSelected = filterAprobacion === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setFilterAprobacion(opt.value);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#eeedfc] text-[#4f46e5]'
                        : 'text-[#3d3630] hover:bg-[#f5f0e6]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-2 h-2 rounded-full ${opt.color} shrink-0`} />
                      <span className="truncate">{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-[#ded4c3] font-mono text-[#7c746d]">
                        {opt.badge}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#4f46e5] stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cards para Mobile (intacto en estructura, colores nítidos) */}
      <div className="space-y-3 sm:hidden">
        {loading ? (
          <div className="text-center py-10 text-[#7c746d] text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5969E6]" />
            Cargando historial oficial...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-[#fdfbf7] p-8 text-center text-[#7c746d] text-xs rounded-2xl border border-[#ded4c3]">
            No hay evaluaciones INF-D003 registradas con los filtros actuales.
          </div>
        ) : (
          filteredList.map(ev => {
            const isAprobado = ev.g3_aprobacion === 'Sí';
            const isObservado = ev.g3_aprobacion === 'Sí con observaciones';

            return (
              <div
                key={ev.id || Math.random()}
                onClick={() => setSelectedEvaluation(ev)}
                className="bg-[#fdfbf7] p-4 rounded-2xl border border-[#ded4c3] shadow-xs active:scale-[0.99] transition-transform space-y-2.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[#2c2724]">{ev.gusto}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono text-[11px] font-black text-[#5969E6] bg-[#eeedfc] px-2 py-0.5 rounded border border-[#d7d4f9]">
                        {ev.loteBatea}
                      </span>
                      {ev.codigoMuestra && (
                        <span className="text-[10px] text-[#7c746d] font-mono">
                          [{ev.codigoMuestra}]
                        </span>
                      )}
                      <span className="text-[10px] text-[#7c746d]">
                        {formatDisplayDate(ev.fecha)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      isAprobado
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isObservado
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-[#fdf2f2] text-[#eb5757] border-[#fecaca]'
                    }`}
                  >
                    {isAprobado ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : isObservado ? (
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-rose-600" />
                    )}
                    {ev.g3_aprobacion}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#ded4c3] text-[11px]">
                  <span className="text-[#7c746d]">
                    Evaluador: <strong className="text-[#2c2724]">{ev.evaluador}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStats(ev);
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="Ver Estadísticas y Métricas"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Stats</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEvaluationToDelete(ev);
                      }}
                      className="p-1.5 rounded-lg bg-[#fdf2f2] border border-[#fecaca] text-[#eb5757] hover:bg-[#eb5757] hover:text-white transition-all active:scale-95 shadow-2xs"
                      title="Eliminar Registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-black text-amber-600 font-mono ml-1">{ev.g2_gustoGeneral}/5 ★</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla Desktop (Ampliada, nítida, centrada y de escala cómoda) */}
      <div className="hidden sm:block bg-[#fdfbf7] rounded-3xl border border-[#ded4c3] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-[#f5f0e6] text-[#7c746d] uppercase tracking-wider border-b border-[#ded4c3] font-black text-[11px] sm:text-xs select-none">
              <tr>
                <th className="py-4 px-5">Fecha / Hora</th>
                <th className="py-4 px-5">Gusto a Evaluar</th>
                <th className="py-4 px-5">Lote / Batea</th>
                <th className="py-4 px-5">Evaluador</th>
                <th className="py-4 px-5 text-center">Gusto (1-5)</th>
                <th className="py-4 px-5 text-center">Dictamen Final</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece4d5]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#7c746d]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5969E6]" />
                    <span>Cargando planilla de evaluaciones...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#7c746d] font-medium">
                    No se encontraron evaluaciones con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredList.map(ev => {
                  const isAprobado = ev.g3_aprobacion === 'Sí';
                  const isObservado = ev.g3_aprobacion === 'Sí con observaciones';

                  return (
                    <tr
                      key={ev.id || Math.random()}
                      className="hover:bg-[#f8f5ee] transition-colors"
                    >
                      <td className="py-4 px-5 text-[#4a423b] font-mono text-xs sm:text-sm">
                        <div className="font-bold text-[#2c2724]">{formatDisplayDate(ev.fecha)}</div>
                        <div className="text-[11px] text-[#7c746d]">{ev.hora} hs</div>
                      </td>
                      <td className="py-4 px-5 font-black text-sm sm:text-base text-[#2c2724]">
                        {ev.gusto}
                        {ev.codigoMuestra && (
                          <span className="text-[10px] text-[#7c746d] font-mono font-normal ml-1.5 px-1.5 py-0.5 rounded bg-[#f5f0e6] border border-[#e2d9c8]">
                            {ev.codigoMuestra}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono bg-[#eeedfc] text-[#4f46e5] border border-[#d7d4f9] px-2.5 py-1 rounded-lg font-black text-xs sm:text-sm tracking-wide shadow-2xs">
                          {ev.loteBatea}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-xs sm:text-sm text-[#2c2724]">
                        {ev.evaluador}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="font-mono font-black text-sm sm:text-base text-amber-600 inline-flex items-center justify-center gap-1">
                          {ev.g2_gustoGeneral}
                          <span className="text-xs text-[#7c746d] font-normal">/ 5 ★</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${
                            isAprobado
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isObservado
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-[#fdf2f2] text-[#eb5757] border border-[#fecaca]'
                          }`}
                        >
                          {isAprobado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {isObservado && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          {!isAprobado && !isObservado && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          <span>{ev.g3_aprobacion === 'Sí' ? 'Aprobado' : ev.g3_aprobacion === 'Sí con observaciones' ? 'Aprobado c/ Obs.' : 'Rechazado'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStats(ev)}
                            title="Estadísticas y Análisis de la Muestra"
                            className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center shadow-2xs active:scale-95"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedEvaluation(ev)}
                            title="Ver Cuestionario Completo"
                            className="w-8 h-8 rounded-xl bg-[#eeedfc] border border-[#d7d4f9] text-[#4f46e5] hover:bg-[#4f46e5] hover:text-white transition-all flex items-center justify-center shadow-2xs active:scale-95"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEvaluationToDelete(ev)}
                            title="Eliminar Registro"
                            className="w-8 h-8 rounded-xl bg-[#fdf2f2] border border-[#fecaca] text-[#eb5757] hover:bg-[#eb5757] hover:text-white transition-all flex items-center justify-center shadow-2xs active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cuestionario Completo INF-D003 */}
      <SmoothModal
        isOpen={Boolean(selectedEvaluation)}
        onClose={() => setSelectedEvaluation(null)}
        contentClassName="relative w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-[#fdfbf7] rounded-3xl shadow-2xl border border-[#ded4c3] text-[#2c2724] overflow-hidden"
      >
        {(closeWithAnimation) => selectedEvaluation && (
          <>
            {/* Cabecera Fija */}
            <div className="p-5 sm:p-6 pb-3.5 border-b border-[#ded4c3] bg-[#fdfbf7] shrink-0 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black text-[#5969E6] tracking-wider bg-[#eeedfc] px-2.5 py-0.5 rounded-full border border-[#d7d4f9]">
                    Planilla Oficial INF-D003
                  </span>
                  <span className="text-[10px] text-[#7c746d] font-mono">• Protocolo de Calidad</span>
                </div>
                <h3 className="text-xl font-black text-[#2c2724] mt-1.5">{selectedEvaluation.gusto}</h3>
                <p className="text-xs text-[#7c746d] mt-0.5">
                  Lote/Batea: <strong className="text-[#5969E6] font-mono font-black">{selectedEvaluation.loteBatea}</strong> {selectedEvaluation.codigoMuestra ? `• Muestra: ${selectedEvaluation.codigoMuestra}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={closeWithAnimation}
                className="w-8 h-8 rounded-full bg-[#f5f0e6] border border-[#ded4c3] text-[#7c746d] hover:text-[#2c2724] hover:bg-[#ede6d8] flex items-center justify-center text-xs font-bold transition-all shrink-0 active:scale-95 shadow-2xs"
                title="Cerrar cuestionario"
              >
                ✕
              </button>
            </div>

            {/* Contenido Scrolleable sin barra de scroll */}
            <div
              ref={evalContentRef}
              className="p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-3.5 text-xs flex-1"
            >
              {/* Sección 1: Vista */}
              <div className="bg-[#f5f0e6] p-4 rounded-2xl border border-[#ded4c3] space-y-2">
                <span className="font-black text-[#5969E6] uppercase text-[11px] block tracking-wider">1. VISTA</span>
                <div className="grid grid-cols-2 gap-2 text-[#4a423b]">
                  <div>Color relleno: <strong className="text-[#2c2724]">{selectedEvaluation.v1_color}</strong></div>
                  <div>Cantidad: <strong className="text-[#2c2724]">{selectedEvaluation.v2_cantidad}</strong></div>
                  <div>Mezclado: <strong className="text-[#2c2724]">{selectedEvaluation.v3_mezclado}</strong></div>
                  <div>Ingredientes receta: <strong className="text-[#2c2724]">{selectedEvaluation.v4_ingredientesReceta}</strong></div>
                  <div>Ingrediente extraño: <strong className="text-[#2c2724]">{selectedEvaluation.v5_ingredienteExtrano}</strong></div>
                  <div>Sellado carne/pollo: <strong className="text-[#2c2724]">{selectedEvaluation.v6_selladoCarne}</strong></div>
                  <div>Rehogado vegetales: <strong className="text-[#2c2724]">{selectedEvaluation.v7_rehogadoVegetales}</strong></div>
                  <div>Caramelización: <strong className="text-[#2c2724]">{selectedEvaluation.v8_caramelizacion}</strong></div>
                </div>
                {selectedEvaluation.obs_vista && (
                  <p className="text-[#7c746d] text-[11px] pt-1.5 border-t border-[#ded4c3] italic">Obs: "{selectedEvaluation.obs_vista}"</p>
                )}
              </div>

              {/* Sección 2: Olfato */}
              <div className="bg-[#f5f0e6] p-4 rounded-2xl border border-[#ded4c3] space-y-2">
                <span className="font-black text-[#5969E6] uppercase text-[11px] block tracking-wider">2. OLFATO</span>
                <div className="grid grid-cols-2 gap-2 text-[#4a423b]">
                  <div>Intensidad aroma: <strong className="text-[#2c2724]">{selectedEvaluation.o1_intensidadAroma}</strong></div>
                  <div>Aroma característico: <strong className="text-[#2c2724]">{selectedEvaluation.o2_aromaCaracteristico}</strong></div>
                  <div className="col-span-2">Olores extraños: <strong className="text-[#2c2724]">{(selectedEvaluation.o3_olorExtrano || []).join(', ') || 'No'}</strong></div>
                </div>
                {selectedEvaluation.obs_olfato && (
                  <p className="text-[#7c746d] text-[11px] pt-1.5 border-t border-[#ded4c3] italic">Obs: "{selectedEvaluation.obs_olfato}"</p>
                )}
              </div>

              {/* Sección 3: Boca */}
              <div className="bg-[#f5f0e6] p-4 rounded-2xl border border-[#ded4c3] space-y-2">
                <span className="font-black text-[#5969E6] uppercase text-[11px] block tracking-wider">3. BOCA</span>
                <div className="text-[#4a423b]">
                  Primer impacto: <strong className="text-[#2c2724]">{(selectedEvaluation.b1_primerImpacto || []).join(', ') || 'N/A'}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#4a423b]">
                  <div>Textura masa: <strong className="text-[#2c2724]">{selectedEvaluation.b2_texturaMasa}</strong></div>
                  <div>Jugosidad relleno: <strong className="text-[#2c2724]">{selectedEvaluation.b3_jugosidadRelleno}</strong></div>
                  <div>Textura carne: <strong className="text-[#2c2724]">{selectedEvaluation.b4_texturaCarne}</strong></div>
                  <div>Sal: <strong className="text-[#2c2724]">{selectedEvaluation.b5_sal}</strong></div>
                  <div>Dulce: <strong className="text-[#2c2724]">{selectedEvaluation.b6_dulce}</strong></div>
                  <div>Picante: <strong className="text-[#2c2724]">{selectedEvaluation.b7_picante}</strong></div>
                  <div>Sabor característico: <strong className="text-[#2c2724]">{selectedEvaluation.b8_saborCaracteristico}</strong></div>
                  <div>Ingrediente tapa: <strong className="text-[#2c2724]">{selectedEvaluation.b9_ingredienteTapa}</strong></div>
                  <div className="col-span-2">Sabores extraños: <strong className="text-[#2c2724]">{(selectedEvaluation.b10_saborExtrano || []).join(', ') || 'No'}</strong></div>
                  <div className="col-span-2">Retrogusto: <strong className="text-[#2c2724]">{selectedEvaluation.b11_retrogusto}</strong></div>
                </div>
                {selectedEvaluation.obs_boca && (
                  <p className="text-[#7c746d] text-[11px] pt-1.5 border-t border-[#ded4c3] italic">Obs: "{selectedEvaluation.obs_boca}"</p>
                )}
              </div>

              {/* Sección 4: Evaluación Global */}
              <div className="bg-[#eeedfc] p-4 rounded-2xl border border-[#d7d4f9] space-y-2">
                <span className="font-black text-[#5969E6] uppercase text-[11px] block tracking-wider">4. EVALUACIÓN GLOBAL</span>
                <div className="grid grid-cols-2 gap-2 text-[#4a423b]">
                  <div>Estándar gusto: <strong className="text-[#2c2724]">{selectedEvaluation.g1_estandarGusto}</strong></div>
                  <div>Aceptación general: <strong className="text-[#4338ca] font-mono font-black">{selectedEvaluation.g2_gustoGeneral} / 5 ★</strong></div>
                  <div className="col-span-2">Dictamen de aprobación: <strong className="text-[#2c2724]">{selectedEvaluation.g3_aprobacion}</strong></div>
                </div>
                {selectedEvaluation.obs_global && (
                  <p className="text-[#7c746d] text-[11px] pt-1.5 border-t border-[#d7d4f9] italic">Obs Global: "{selectedEvaluation.obs_global}"</p>
                )}
              </div>

              {/* Firma */}
              {selectedEvaluation.firmaEvaluador && (
                <div className="bg-[#f5f0e6] p-4 rounded-2xl border border-[#ded4c3]">
                  <span className="font-black text-[#5969E6] uppercase text-[11px] block mb-2 tracking-wider">Firma del Evaluador:</span>
                  <div className="bg-[#fdfbf7] p-2 rounded-xl inline-block border border-[#ded4c3]">
                    <img src={selectedEvaluation.firmaEvaluador} alt="Firma" className="h-14 object-contain" />
                  </div>
                </div>
              )}

              {/* Fotos */}
              {selectedEvaluation.fotos && selectedEvaluation.fotos.length > 0 && (
                <div className="bg-[#f5f0e6] p-4 rounded-2xl border border-[#ded4c3]">
                  <span className="font-black text-[#5969E6] uppercase text-[11px] block mb-2 tracking-wider">Fotos adjuntas de la muestra:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedEvaluation.fotos.map((src, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-[#ded4c3] shadow-xs">
                        <img src={src} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pie de modal fijo */}
            <div className="p-4 sm:p-5 border-t border-[#ded4c3] bg-[#f5f0e6]/70 shrink-0 text-[11px] text-[#7c746d] flex justify-between items-center">
              <span>Evaluador: <strong className="text-[#2c2724]">{selectedEvaluation.evaluador}</strong> ({formatDisplayDate(selectedEvaluation.fecha)} {selectedEvaluation.hora} hs)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEvaluationToDelete(selectedEvaluation)}
                  className="px-3 py-1.5 rounded-lg bg-[#fdf2f2] border border-[#fecaca] text-[#eb5757] hover:bg-rose-600 hover:text-white font-extrabold text-[11px] transition-all"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={closeWithAnimation}
                  className="px-3.5 py-1.5 rounded-lg bg-[#f5f0e6] border border-[#ded4c3] text-[#2c2724] hover:bg-[#ede6d8] font-bold text-[11px] transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </>
        )}
      </SmoothModal>

      {/* Modal de Estadísticas y Análisis Sensorial Individual */}
      <SmoothModal
        isOpen={Boolean(selectedStats)}
        onClose={() => setSelectedStats(null)}
        contentClassName="relative w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-[#fdfbf7] rounded-3xl shadow-2xl border border-[#ded4c3] text-[#2c2724] overflow-hidden"
      >
        {(closeWithAnimation) => {
          if (!selectedStats) return null;
          const metrics = calculateSensoryMetrics(selectedStats);
          const isOptimo = metrics.totalIndex >= 85;
          const isObservado = metrics.totalIndex >= 70 && metrics.totalIndex < 85;

          return (
            <>
              {/* Cabecera Fija del Análisis */}
              <div className="p-5 sm:p-6 pb-3.5 border-b border-[#ded4c3] bg-[#fdfbf7] shrink-0 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <BarChart3 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#5969E6] bg-[#eeedfc] px-2.5 py-0.5 rounded-full border border-[#d7d4f9]">
                        Auditoría Sensorial Individual
                      </span>
                      <span className="text-[10px] text-[#7c746d] font-mono">INF-D003</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#2c2724] mt-0.5 leading-tight">
                      {selectedStats.gusto}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7c746d] mt-1">
                      <span>Lote / Batea: <strong className="font-mono text-[#5969E6] font-bold">{selectedStats.loteBatea}</strong></span>
                      <span>•</span>
                      <span>Evaluador: <strong className="text-[#2c2724] font-bold">{selectedStats.evaluador}</strong></span>
                      <span>•</span>
                      <span>{formatDisplayDate(selectedStats.fecha)} {selectedStats.hora} hs</span>
                    </div>
                  </div>
                </div>

                {/* Botón cerrar fijo en la cabecera */}
                <button
                  type="button"
                  onClick={closeWithAnimation}
                  className="w-8 h-8 rounded-full bg-[#f5f0e6] border border-[#ded4c3] text-[#7c746d] hover:text-[#2c2724] hover:bg-[#ede6d8] flex items-center justify-center text-xs font-bold transition-all shrink-0 active:scale-95 shadow-2xs"
                  title="Cerrar análisis"
                >
                  ✕
                </button>
              </div>

              {/* Cuerpo Scrolleable sin barra de scroll */}
              <div
                ref={statsContentRef}
                className="p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-4 flex-1 text-xs"
              >
                {/* Resumen Principal: Gauge de Índice y Dictamen */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center bg-[#f5f0e6] p-4 sm:p-5 rounded-2xl border border-[#ded4c3]">
                  {/* Gauge Radial */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <AnimatedRadialGauge
                      percentage={metrics.totalIndex}
                      strokeColor={isOptimo ? '#10b981' : isObservado ? '#f59e0b' : '#ef4444'}
                      strokeWidth={3.5}
                      sizeClassName="w-24 h-24"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <AnimatedNumber value={metrics.totalIndex} suffix="%" className="text-xl font-black text-[#2c2724] leading-none" />
                        <span className="text-[8px] font-bold text-[#7c746d] uppercase mt-0.5">Índice</span>
                      </div>
                    </AnimatedRadialGauge>
                    <span className="text-[11px] font-extrabold text-[#2c2724] mt-1.5">Conformidad Sensorial</span>
                  </div>

                  {/* Dictamen y Calificación */}
                  <div className="sm:col-span-2 space-y-2 border-t sm:border-t-0 sm:border-l border-[#ded4c3] pt-3 sm:pt-0 sm:pl-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#7c746d]">Dictamen Oficial:</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-xs inline-flex items-center gap-1 ${
                        selectedStats.g3_aprobacion === 'Sí'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : selectedStats.g3_aprobacion === 'Sí con observaciones'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-[#fdf2f2] text-[#eb5757] border border-[#fecaca]'
                      }`}>
                        {selectedStats.g3_aprobacion === 'Sí' ? 'Aprobado para despacho' : selectedStats.g3_aprobacion === 'Sí con observaciones' ? 'Aprobado c/ Observación' : 'Rechazado'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#7c746d]">Aceptación General:</span>
                      <span className="font-mono font-black text-sm text-amber-600 flex items-center gap-1">
                        {selectedStats.g2_gustoGeneral} de 5 <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#7c746d]">Comparación con Estándar:</span>
                      <strong className="text-[#2c2724]">{selectedStats.g1_estandarGusto}</strong>
                    </div>

                    <div className="pt-1.5 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-md font-bold inline-block ${
                        isOptimo
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isObservado
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isOptimo
                          ? 'Cumple con los estándares organolépticos de Mi Gusto'
                          : isObservado
                          ? 'Registra observaciones a monitorear en próximas bateas'
                          : 'Muestra con desvíos sensoriales no conformes'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Los 4 Pilares Sensoriales (Barras de Rendimiento Técnico) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#7c746d]">
                    Desglose por Dimensión Organoléptica
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    {/* Pilar 1: Vista */}
                    <div className="p-3 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#2c2724]">1. Vista y Aspecto Visual</span>
                        <span className="font-mono font-black text-[#4f46e5]">{metrics.vistaScore}%</span>
                      </div>
                      <AnimatedBar
                        targetWidthPercent={metrics.vistaScore}
                        barClassName="h-full rounded-full bg-[#4f46e5]"
                        className="w-full h-2.5 rounded-full bg-[#ede6d8] overflow-hidden"
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#7c746d]">
                        <span>Color: <strong>{selectedStats.v1_color}</strong> • Relleno: <strong>{selectedStats.v2_cantidad}</strong> • Mezclado: <strong>{selectedStats.v3_mezclado}</strong></span>
                        <span className="font-semibold text-[#2c2724]">Sellado: {selectedStats.v6_selladoCarne}</span>
                      </div>
                    </div>

                    {/* Pilar 2: Olfato */}
                    <div className="p-3 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#2c2724]">2. Olfato y Perfil Aromático</span>
                        <span className="font-mono font-black text-[#5969E6]">{metrics.olfatoScore}%</span>
                      </div>
                      <AnimatedBar
                        targetWidthPercent={metrics.olfatoScore}
                        barClassName="h-full rounded-full bg-[#5969E6]"
                        className="w-full h-2.5 rounded-full bg-[#ede6d8] overflow-hidden"
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#7c746d]">
                        <span>Intensidad: <strong>{selectedStats.o1_intensidadAroma}</strong> • Característico: <strong>{selectedStats.o2_aromaCaracteristico}</strong></span>
                        <span className={`font-semibold ${metrics.oloresExtranos.length === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {metrics.oloresExtranos.length === 0 ? '✓ Sin olores extraños' : `Desvío: ${metrics.oloresExtranos.join(', ')}`}
                        </span>
                      </div>
                    </div>

                    {/* Pilar 3: Boca */}
                    <div className="p-3 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#2c2724]">3. Boca, Textura y Retrogusto</span>
                        <span className="font-mono font-black text-[#FC7572]">{metrics.bocaScore}%</span>
                      </div>
                      <AnimatedBar
                        targetWidthPercent={metrics.bocaScore}
                        barClassName="h-full rounded-full bg-[#FC7572]"
                        className="w-full h-2.5 rounded-full bg-[#ede6d8] overflow-hidden"
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#7c746d]">
                        <span>Masa: <strong>{selectedStats.b2_texturaMasa}</strong> • Jugosidad: <strong>{selectedStats.b3_jugosidadRelleno}</strong> • Sal: <strong>{selectedStats.b5_sal}</strong></span>
                        <span className={`font-semibold ${metrics.saboresExtranos.length === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {metrics.saboresExtranos.length === 0 ? '✓ Sin sabores extraños' : `Desvío: ${metrics.saboresExtranos.join(', ')}`}
                        </span>
                      </div>
                    </div>

                    {/* Pilar 4: Consistencia Global */}
                    <div className="p-3 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#2c2724]">4. Consistencia y Aprobación Global</span>
                        <span className="font-mono font-black text-amber-600">{metrics.globalScore}%</span>
                      </div>
                      <AnimatedBar
                        targetWidthPercent={metrics.globalScore}
                        barClassName="h-full rounded-full bg-amber-500"
                        className="w-full h-2.5 rounded-full bg-[#ede6d8] overflow-hidden"
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#7c746d]">
                        <span>Dictamen: <strong>{selectedStats.g3_aprobacion}</strong></span>
                        <span className="font-semibold text-[#2c2724]">Puntuación: {selectedStats.g2_gustoGeneral}/5 estrellas</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hallazgos e Indicadores Técnicos */}
                <div className="bg-[#f5f0e6] p-4 rounded-2xl border border-[#ded4c3] space-y-2.5 text-xs">
                  <span className="font-black text-[#5969E6] uppercase text-[10px] block tracking-wider">
                    Indicadores de Cata
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#7c746d]">Primer Impacto en Boca:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedStats.b1_primerImpacto || []).map((imp, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-[#fdfbf7] border border-[#ded4c3] font-bold text-[#2c2724]">
                            {imp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[#7c746d]">Retrogusto / Final en Boca:</span>
                      <p className="font-bold text-[#2c2724] mt-1">{selectedStats.b11_retrogusto || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedStats.obs_global && (
                    <div className="pt-2 border-t border-[#ded4c3] text-[11px]">
                      <span className="text-[#7c746d] font-bold">Observaciones del auditor:</span>
                      <p className="text-[#2c2724] italic mt-0.5">"{selectedStats.obs_global}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie de modal fijo con firma y botón cerrar */}
              <div className="p-4 sm:p-5 border-t border-[#ded4c3] bg-[#f5f0e6]/70 shrink-0 flex items-center justify-between">
                <div>
                  {selectedStats.firmaEvaluador && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#7c746d] font-semibold">Firma registrada:</span>
                      <img src={selectedStats.firmaEvaluador} alt="Firma" className="h-8 max-w-[100px] object-contain opacity-80" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={closeWithAnimation}
                  className="py-2.5 px-6 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-[#4f46e5]/25 active:scale-95 transition-all"
                >
                  Cerrar Análisis
                </button>
              </div>
            </>
          );
        }}
      </SmoothModal>

      {/* Modal Estilizado de Confirmación de Eliminación */}
      <SmoothModal
        isOpen={Boolean(evaluationToDelete)}
        onClose={() => setEvaluationToDelete(null)}
        contentClassName="relative w-full max-w-md bg-[#fdfbf7] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#ded4c3] text-[#2c2724]"
      >
        {(closeWithAnimation) => evaluationToDelete && (
          <div>
            <button
              type="button"
              disabled={isDeleting}
              onClick={closeWithAnimation}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f5f0e6] border border-[#ded4c3] text-[#7c746d] hover:text-[#2c2724] hover:bg-[#ede6d8] flex items-center justify-center text-xs font-bold transition-all"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#fdf2f2] border border-[#fecaca] flex items-center justify-center text-[#eb5757] shrink-0 shadow-xs">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#2c2724] leading-tight">
                  ¿Eliminar evaluación?
                </h3>
                <p className="text-[11px] text-[#7c746d] mt-0.5">
                  Protocolo Oficial INF-D003 • Control de Calidad
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f5f0e6] border border-[#ded4c3] space-y-1.5 text-xs mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[#7c746d]">Gusto:</span>
                <strong className="text-[#2c2724] font-black">{evaluationToDelete.gusto}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7c746d]">Lote / Batea:</span>
                <span className="font-mono font-bold text-[#5969E6]">{evaluationToDelete.loteBatea}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7c746d]">Evaluador:</span>
                <span className="font-semibold text-[#2c2724]">{evaluationToDelete.evaluador}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7c746d]">Fecha y hora:</span>
                <span className="text-[#7c746d] font-mono">{formatDisplayDate(evaluationToDelete.fecha)} {evaluationToDelete.hora} hs</span>
              </div>
            </div>

            <p className="text-xs text-[#7c746d] mb-6 leading-relaxed">
              Esta acción eliminará de forma permanente el registro del historial de calidad. <strong className="text-[#2c2724]">No se podrá recuperar.</strong>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleConfirmDelete(closeWithAnimation)}
                className="px-5 py-2.5 rounded-xl bg-[#eb5757] hover:bg-[#d94444] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#eb5757]/25 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Eliminando...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Registro</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={closeWithAnimation}
                className="px-4 py-2.5 rounded-xl bg-[#f5f0e6] border border-[#ded4c3] text-[#4a423b] hover:bg-[#ede6d8] font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </SmoothModal>

      {/* Footer Sutil - Siempre al pie del viewport */}
      <footer className="mt-auto pt-8 pb-3 border-t border-[#ded4c3] text-center">
        <p className="text-[10px] sm:text-[11px] text-[#7c746d] font-medium tracking-wide">
          © Desarrollado por el Departamento de Sistemas de Mi Gusto | Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};
