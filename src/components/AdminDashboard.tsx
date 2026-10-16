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
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20">
      {/* Header */}
      {/* Header Admin */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-[#1f293d]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#0c121e] border border-[#1f293d] text-slate-300 hover:text-white active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-qc-400" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white leading-tight">
              Historial INF-D003
            </h1>
            <p className="text-[11px] text-slate-400">
              Auditor: <span className="text-qc-400 font-semibold">{currentUser}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchEvaluations}
            title="Recargar"
            className="p-2 rounded-xl bg-[#0c121e] border border-[#1f293d] hover:text-qc-400 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCSV}
            title="Descargar Planilla Oficial"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#161f30] hover:bg-[#1d293f] border border-[#223048] text-qc-300 hover:text-white text-xs font-bold active:scale-95 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Planilla</span>
          </button>
          <button
            onClick={onLogout}
            title="Salir"
            className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/50 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Sólidos */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-5">
        <div className="glass-panel p-3 rounded-xl border border-[#1f293d]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Muestras Evaluadas</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{stats.total}</p>
        </div>
        <div className="glass-panel p-3 rounded-xl border border-emerald-500/30 bg-[#0d1f19]">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Aprobadas</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{stats.aprobados}</p>
        </div>
        <div className="glass-panel p-3 rounded-xl border border-amber-500/30 bg-[#1f1a0e]">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Con Observaciones</p>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{stats.observados}</p>
        </div>
        <div className="glass-panel p-3 rounded-xl border border-rose-500/30 bg-[#221013]">
          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Rechazadas</p>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-0.5">{stats.rechazados}</p>
        </div>
        <div className="glass-panel p-3 rounded-xl border border-qc-500/30 bg-[#0c1626] col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold text-qc-400 uppercase tracking-wider">Gusto General</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">{stats.promedioGusto} <span className="text-[10px] text-slate-400">/ 5</span></p>
        </div>
      </div>

      {/* Buscador & Filtro */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar gusto, lote/batea o evaluador..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500"
          />
        </div>

        <select
          value={filterAprobacion}
          onChange={e => setFilterAprobacion(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl glass-input text-xs text-white"
        >
          <option value="ALL" className="bg-slate-900">Todas las aprobaciones</option>
          <option value="Sí" className="bg-slate-900">Aprobados (Sí)</option>
          <option value="Sí con observaciones" className="bg-slate-900">Con observaciones</option>
          <option value="No" className="bg-slate-900">Rechazados (No)</option>
        </select>
      </div>

      {/* Cards para Mobile */}
      <div className="space-y-2.5 sm:hidden">
        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-qc-400" />
            Cargando historial oficial...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-500 text-xs rounded-2xl">
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
                className="glass-panel p-3.5 rounded-2xl border border-[#1f293d] active:scale-[0.99] transition-transform space-y-2 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{ev.gusto}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] font-bold text-qc-400 bg-[#0c121e] px-2 py-0.5 rounded border border-[#1f293d]">
                        {ev.loteBatea}
                      </span>
                      {ev.codigoMuestra && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{ev.codigoMuestra}]
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {ev.fecha}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      isAprobado
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : isObservado
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {isAprobado ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : isObservado ? (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-rose-400" />
                    )}
                    {ev.g3_aprobacion}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#1f293d] text-[11px]">
                  <span className="text-slate-400">
                    Evaluador: <strong className="text-slate-200">{ev.evaluador}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Aceptación:</span>
                    <span className="text-sm font-black text-qc-400 font-mono">{ev.g2_gustoGeneral}/5</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla Desktop */}
      <div className="hidden sm:block glass-panel rounded-2xl border border-[#1f293d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1422] text-slate-300 uppercase tracking-wider border-b border-[#1f293d] font-bold">
              <tr>
                <th className="py-3 px-4">Fecha/Hora</th>
                <th className="py-3 px-4">Gusto</th>
                <th className="py-3 px-4">Lote / Batea</th>
                <th className="py-3 px-4">Evaluador</th>
                <th className="py-3 px-4 text-center">Gusto (1-5)</th>
                <th className="py-3 px-4 text-center">Aprobación</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-qc-400" />
                    Cargando planilla...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Sin registros.
                  </td>
                </tr>
              ) : (
                filteredList.map(ev => {
                  const isAprobado = ev.g3_aprobacion === 'Sí';
                  const isObservado = ev.g3_aprobacion === 'Sí con observaciones';

                  return (
                    <tr
                      key={ev.id || Math.random()}
                      className="hover:bg-[#161f30] transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        <div>{ev.fecha}</div>
                        <div className="text-[10px] text-slate-500">{ev.hora}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {ev.gusto}
                        {ev.codigoMuestra && <span className="text-[10px] text-slate-400 ml-1">({ev.codigoMuestra})</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-[#0c121e] px-2 py-0.5 rounded text-qc-400 border border-[#1f293d] font-bold">
                          {ev.loteBatea}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {ev.evaluador}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-black text-sm text-qc-400">
                          {ev.g2_gustoGeneral}
                        </span>
                        <span className="text-[10px] text-slate-500">/5</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isAprobado
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : isObservado
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {ev.g3_aprobacion}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEvaluation(ev)}
                            title="Ver Cuestionario Completo"
                            className="p-1.5 rounded-lg bg-qc-950 hover:text-qc-400 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            title="Eliminar"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:text-rose-400 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#1f293d]">
            <button
              onClick={() => setSelectedEvaluation(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            <div className="border-b border-[#1f293d] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-qc-400 tracking-wider">Planilla Oficial INF-D003</span>
                <span className="text-[10px] text-slate-400 font-mono">• Versión 2</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">{selectedEvaluation.gusto}</h3>
              <p className="text-xs text-slate-400 font-mono">
                Lote/Batea: <strong className="text-qc-400">{selectedEvaluation.loteBatea}</strong> {selectedEvaluation.codigoMuestra ? `| Muestra: ${selectedEvaluation.codigoMuestra}` : ''}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Sección 1: Vista */}
              <div className="glass-card p-3 rounded-xl border border-[#1f293d] space-y-1.5">
                <span className="font-bold text-qc-400 uppercase text-[10px] block">1. VISTA</span>
                <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                  <div>Color relleno: <strong className="text-white">{selectedEvaluation.v1_color}</strong></div>
                  <div>Cantidad: <strong className="text-white">{selectedEvaluation.v2_cantidad}</strong></div>
                  <div>Mezclado: <strong className="text-white">{selectedEvaluation.v3_mezclado}</strong></div>
                  <div>Ingredientes receta: <strong className="text-white">{selectedEvaluation.v4_ingredientesReceta}</strong></div>
                  <div>Ingrediente extraño: <strong className="text-white">{selectedEvaluation.v5_ingredienteExtrano}</strong></div>
                  <div>Sellado carne/pollo: <strong className="text-white">{selectedEvaluation.v6_selladoCarne}</strong></div>
                  <div>Rehogado vegetales: <strong className="text-white">{selectedEvaluation.v7_rehogadoVegetales}</strong></div>
                  <div>Caramelización: <strong className="text-white">{selectedEvaluation.v8_caramelizacion}</strong></div>
                </div>
                {selectedEvaluation.obs_vista && (
                  <p className="text-slate-400 text-[11px] pt-1 italic">Obs: "{selectedEvaluation.obs_vista}"</p>
                )}
              </div>

              {/* Sección 2: Olfato */}
              <div className="glass-card p-3 rounded-xl border border-qc-500/10 space-y-1.5">
                <span className="font-bold text-qc-400 uppercase text-[10px] block">2. OLFATO</span>
                <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                  <div>Intensidad: <strong className="text-white">{selectedEvaluation.o1_intensidadAroma}</strong></div>
                  <div>Característico: <strong className="text-white">{selectedEvaluation.o2_aromaCaracteristico}</strong></div>
                  <div className="col-span-2">Olor extraño: <strong className="text-white">{(selectedEvaluation.o3_olorExtrano || []).join(', ') || 'No'}</strong></div>
                </div>
                {selectedEvaluation.obs_olfato && (
                  <p className="text-slate-400 text-[11px] pt-1 italic">Obs: "{selectedEvaluation.obs_olfato}"</p>
                )}
              </div>

              {/* Sección 3: Boca */}
              <div className="glass-card p-3 rounded-xl border border-qc-500/10 space-y-1.5">
                <span className="font-bold text-qc-400 uppercase text-[10px] block">3. BOCA</span>
                <div className="text-slate-300">
                  Primer impacto: <strong className="text-white">{(selectedEvaluation.b1_primerImpacto || []).join(', ') || 'N/A'}</strong>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                  <div>Textura masa: <strong className="text-white">{selectedEvaluation.b2_texturaMasa}</strong></div>
                  <div>Jugosidad relleno: <strong className="text-white">{selectedEvaluation.b3_jugosidadRelleno}</strong></div>
                  <div>Textura carne: <strong className="text-white">{selectedEvaluation.b4_texturaCarne}</strong></div>
                  <div>Sal: <strong className="text-white">{selectedEvaluation.b5_sal}</strong></div>
                  <div>Dulce: <strong className="text-white">{selectedEvaluation.b6_dulce}</strong></div>
                  <div>Picante: <strong className="text-white">{selectedEvaluation.b7_picante}</strong></div>
                  <div>Sabor característico: <strong className="text-white">{selectedEvaluation.b8_saborCaracteristico}</strong></div>
                  <div>Ingrediente tapa: <strong className="text-white">{selectedEvaluation.b9_ingredienteTapa}</strong></div>
                  <div className="col-span-2">Sabor extraño: <strong className="text-white">{(selectedEvaluation.b10_saborExtrano || []).join(', ') || 'No'}</strong></div>
                  <div className="col-span-2">Retrogusto: <strong className="text-white">{selectedEvaluation.b11_retrogusto}</strong></div>
                </div>
                {selectedEvaluation.obs_boca && (
                  <p className="text-slate-400 text-[11px] pt-1 italic">Obs: "{selectedEvaluation.obs_boca}"</p>
                )}
              </div>

              {/* Sección 4: Evaluación Global */}
              <div className="glass-card p-3 rounded-xl border border-qc-500/20 bg-qc-950/40 space-y-1.5">
                <span className="font-bold text-qc-400 uppercase text-[10px] block">4. EVALUACIÓN GLOBAL</span>
                <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                  <div>Estándar gusto: <strong className="text-white">{selectedEvaluation.g1_estandarGusto}</strong></div>
                  <div>Aceptación general: <strong className="text-qc-400 font-bold">{selectedEvaluation.g2_gustoGeneral} / 5</strong></div>
                  <div className="col-span-2">Dictamen aprobación: <strong className="text-white">{selectedEvaluation.g3_aprobacion}</strong></div>
                </div>
                {selectedEvaluation.obs_global && (
                  <p className="text-slate-400 text-[11px] pt-1 italic">Obs Global: "{selectedEvaluation.obs_global}"</p>
                )}
              </div>

              {/* Firma */}
              {selectedEvaluation.firmaEvaluador && (
                <div className="glass-card p-3 rounded-xl border border-qc-500/10">
                  <span className="font-bold text-qc-400 uppercase text-[10px] block mb-1">Firma del Evaluador:</span>
                  <div className="bg-slate-950 p-2 rounded-lg inline-block border border-qc-500/20">
                    <img src={selectedEvaluation.firmaEvaluador} alt="Firma" className="h-14 object-contain" />
                  </div>
                </div>
              )}

              {/* Fotos */}
              {selectedEvaluation.fotos && selectedEvaluation.fotos.length > 0 && (
                <div className="glass-card p-3 rounded-xl border border-qc-500/10">
                  <span className="font-bold text-qc-400 uppercase text-[10px] block mb-1.5">Fotos adjuntas:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedEvaluation.fotos.map((src, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-qc-500/20">
                        <img src={src} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 mt-4 border-t border-qc-500/20 text-[11px] text-slate-400 flex justify-between items-center">
              <span>Evaluador: <strong className="text-white">{selectedEvaluation.evaluador}</strong> ({selectedEvaluation.fecha} {selectedEvaluation.hora})</span>
              <button
                onClick={() => handleDelete(selectedEvaluation.id)}
                className="text-rose-400 hover:text-rose-300 font-semibold"
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
