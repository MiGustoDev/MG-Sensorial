import { useState, useEffect } from 'react';
import type { SensorialEvaluationRecord } from '../types';
import { supabase } from '../lib/supabase';
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
  Eye
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
  const [selectedEvaluation, setSelectedEvaluation] = useState<SensorialEvaluationRecord | null>(null);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
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
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('¿Deseás eliminar esta evaluación sensorial?')) return;

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
    } catch (err) {
      console.error('Error al borrar', err);
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
      e.fecha,
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

  return (
    <div className="w-full max-w-xl sm:max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 animate-fade-in">
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

      {/* KPI Cards Sólidos con alto contraste */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5 mb-6">
        <div className="bg-[#fdfbf7] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#ded4c3] shadow-xs hover:shadow-md transition-shadow">
          <p className="text-[10px] sm:text-xs font-black text-[#7c746d] uppercase tracking-wider">Muestras Evaluadas</p>
          <p className="text-2xl sm:text-3xl font-black text-[#2c2724] mt-1">{stats.total}</p>
        </div>
        <div className="bg-[#f0fdf4] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#bbf7d0] shadow-xs hover:shadow-md transition-shadow">
          <p className="text-[10px] sm:text-xs font-black text-[#166534] uppercase tracking-wider">Aprobadas</p>
          <p className="text-2xl sm:text-3xl font-black text-[#15803d] mt-1">{stats.aprobados}</p>
        </div>
        <div className="bg-[#fffbeb] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#fde68a] shadow-xs hover:shadow-md transition-shadow">
          <p className="text-[10px] sm:text-xs font-black text-[#92400e] uppercase tracking-wider">Con Observaciones</p>
          <p className="text-2xl sm:text-3xl font-black text-[#b45309] mt-1">{stats.observados}</p>
        </div>
        <div className="bg-[#fef2f2] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#fecaca] shadow-xs hover:shadow-md transition-shadow">
          <p className="text-[10px] sm:text-xs font-black text-[#991b1b] uppercase tracking-wider">Rechazadas</p>
          <p className="text-2xl sm:text-3xl font-black text-[#b91c1c] mt-1">{stats.rechazados}</p>
        </div>
        <div className="bg-[#eeedfc] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#d7d4f9] shadow-xs hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <p className="text-[10px] sm:text-xs font-black text-[#5969E6] uppercase tracking-wider">Gusto General</p>
          <p className="text-2xl sm:text-3xl font-black text-[#4338ca] mt-1 font-mono flex items-baseline gap-1">
            {stats.promedioGusto} <span className="text-xs text-[#7c746d] font-sans font-bold">/ 5 ★</span>
          </p>
        </div>
      </div>

      {/* Buscador & Filtro */}
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

        <select
          value={filterAprobacion}
          onChange={e => setFilterAprobacion(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-2xl bg-[#fdfbf7] border border-[#ded4c3] text-xs sm:text-sm font-bold text-[#2c2724] shadow-xs focus:bg-white focus:border-[#5969E6] focus:ring-2 focus:ring-[#5969E6]/20 transition-all outline-none cursor-pointer"
        >
          <option value="ALL">Todas las aprobaciones</option>
          <option value="Sí">Aprobados (Sí)</option>
          <option value="Sí con observaciones">Con observaciones</option>
          <option value="No">Rechazados (No)</option>
        </select>
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
                        {ev.fecha}
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
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#7c746d]">Aceptación:</span>
                    <span className="text-sm font-black text-amber-600 font-mono">{ev.g2_gustoGeneral}/5 ★</span>
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
                        <div className="font-bold text-[#2c2724]">{ev.fecha}</div>
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
                            onClick={() => setSelectedEvaluation(ev)}
                            title="Ver Cuestionario Completo"
                            className="w-8 h-8 rounded-xl bg-[#eeedfc] border border-[#d7d4f9] text-[#4f46e5] hover:bg-[#4f46e5] hover:text-white transition-all flex items-center justify-center shadow-2xs active:scale-95"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
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
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1c1815]/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#fdfbf7] rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#ded4c3] text-[#2c2724]">
            <button
              onClick={() => setSelectedEvaluation(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f5f0e6] border border-[#ded4c3] text-[#7c746d] hover:text-[#2c2724] hover:bg-[#ede6d8] flex items-center justify-center text-xs font-bold transition-all"
            >
              ✕
            </button>

            <div className="border-b border-[#ded4c3] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black text-[#5969E6] tracking-wider bg-[#eeedfc] px-2.5 py-0.5 rounded-full border border-[#d7d4f9]">
                  Planilla Oficial INF-D003
                </span>
                <span className="text-[10px] text-[#7c746d] font-mono">• Protocolo de Calidad</span>
              </div>
              <h3 className="text-xl font-black text-[#2c2724] mt-2">{selectedEvaluation.gusto}</h3>
              <p className="text-xs text-[#7c746d] mt-0.5">
                Lote/Batea: <strong className="text-[#5969E6] font-mono font-black">{selectedEvaluation.loteBatea}</strong> {selectedEvaluation.codigoMuestra ? `• Muestra: ${selectedEvaluation.codigoMuestra}` : ''}
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
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

            <div className="pt-3.5 mt-5 border-t border-[#ded4c3] text-[11px] text-[#7c746d] flex justify-between items-center">
              <span>Evaluador: <strong className="text-[#2c2724]">{selectedEvaluation.evaluador}</strong> ({selectedEvaluation.fecha} {selectedEvaluation.hora})</span>
              <button
                onClick={() => handleDelete(selectedEvaluation.id)}
                className="text-[#eb5757] hover:text-red-700 font-extrabold hover:underline"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
