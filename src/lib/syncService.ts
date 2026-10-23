import { supabase } from './supabase';
import type { SensorialFormAnswers, SensorialEvaluationRecord } from '../types';

export const OFFLINE_STORAGE_KEY = 'mg_sensorial_official_history';
export const SIMPLE_STORAGE_KEY = 'mg_sensorial_evaluaciones_simple';
export const SYNC_EVENT_NAME = 'mg_sensorial_sync_event';

/**
 * Convierte cualquier formato de fecha (ej: '23/10/2026' o ISO) a formato PostgreSQL YYYY-MM-DD
 */
export function toPostgresDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Convierte un objeto de respuestas de la app (camelCase) al formato de base de datos Supabase (snake_case)
 */
export function mapPayloadToSupabase(payload: SensorialFormAnswers, savedByEmail?: string) {
  return {
    fecha: toPostgresDate(payload.fecha),
    hora: payload.hora,
    evaluador: payload.evaluador,
    lote_batea: payload.loteBatea,
    gusto: payload.gusto,
    codigo_muestra: payload.codigoMuestra || null,
    v1_color: payload.v1_color || null,
    v2_cantidad: payload.v2_cantidad || null,
    v3_mezclado: payload.v3_mezclado || null,
    v4_ingredientes_receta: payload.v4_ingredientesReceta || null,
    v5_ingrediente_extrano: payload.v5_ingredienteExtrano || null,
    v6_sellado_carne: payload.v6_selladoCarne || null,
    v7_rehogado_vegetales: payload.v7_rehogadoVegetales || null,
    v8_caramelizacion: payload.v8_caramelizacion || null,
    obs_vista: payload.obs_vista || null,
    o1_intensidad_aroma: payload.o1_intensidadAroma || null,
    o2_aroma_caracteristico: payload.o2_aromaCaracteristico || null,
    o3_olor_extrano: payload.o3_olorExtrano || [],
    obs_olfato: payload.obs_olfato || null,
    b1_primer_impacto: payload.b1_primerImpacto || [],
    b2_textura_masa: payload.b2_texturaMasa || null,
    b3_jugosidad_relleno: payload.b3_jugosidadRelleno || null,
    b4_textura_carne: payload.b4_texturaCarne || null,
    b5_sal: payload.b5_sal || null,
    b6_dulce: payload.b6_dulce || null,
    b7_picante: payload.b7_picante || null,
    b8_sabor_caracteristico: payload.b8_saborCaracteristico || null,
    b9_ingrediente_tapa: payload.b9_ingredienteTapa || null,
    b10_sabor_extrano: payload.b10_saborExtrano || [],
    b11_retrogusto: payload.b11_retrogusto || null,
    obs_boca: payload.obs_boca || null,
    g1_estandar_gusto: payload.g1_estandarGusto || null,
    g2_gusto_general: payload.g2_gustoGeneral || null,
    g3_aprobacion: payload.g3_aprobacion || null,
    obs_global: payload.obs_global || null,
    firma_evaluador: payload.firmaEvaluador || null,
    fotos: payload.fotos || [],
    saved_by_email: savedByEmail || localStorage.getItem('mg_sensorial_admin_user') || 'control_calidad@migusto.com.ar'
  };
}

/**
 * Obtiene todas las evaluaciones guardadas en el localStorage
 */
export function getStoredEvaluations(): SensorialEvaluationRecord[] {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error al leer historial local:', e);
    return [];
  }
}

/**
 * Guarda o actualiza una evaluación en el localStorage
 */
export function saveToLocalStorage(record: SensorialEvaluationRecord) {
  try {
    const current = getStoredEvaluations();
    const index = current.findIndex(item => item.id === record.id);
    if (index >= 0) {
      current[index] = record;
    } else {
      current.unshift(record);
    }
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(current));
    notifySyncChange();
  } catch (e) {
    console.error('Error al guardar en localStorage:', e);
  }
}

/**
 * Dispara evento global para que componentes como Header o Dashboard sepan que cambió el estado offline
 */
export function notifySyncChange() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
}

/**
 * Retorna las evaluaciones que están pendientes de sincronizar (cuyo id comienza con 'local_')
 */
export function getPendingEvaluations(): SensorialEvaluationRecord[] {
  return getStoredEvaluations().filter(e => typeof e.id === 'string' && e.id.startsWith('local_'));
}

export function getTotalPendingCount(): number {
  let count = getPendingEvaluations().length;
  try {
    const raw = localStorage.getItem(SIMPLE_STORAGE_KEY);
    if (raw) {
      const sheets: any[] = JSON.parse(raw);
      for (const s of sheets) {
        if (!s.synced) count += (s.muestras?.length || 1);
      }
    }
  } catch (e) {
    // ignore
  }
  return count;
}

/**
 * Intenta sincronizar todas las evaluaciones pendientes con Supabase
 */
let isSyncing = false;
export async function syncPendingEvaluations(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  
  const pending = getPendingEvaluations();
  const totalCount = getTotalPendingCount();
  if (totalCount === 0) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    // 1. Sincronizar evaluaciones del formulario avanzado
    if (pending.length > 0) {
      const allStored = getStoredEvaluations();

      for (const record of pending) {
        try {
          const dbPayload = mapPayloadToSupabase(record, record.saved_by_email);
          const { data, error } = await supabase
            .from('sensorial_evaluations_v2')
            .insert([dbPayload])
            .select();

          if (error) {
            console.warn(`[Sync] Error sincronizando registro ${record.id}:`, error);
            failed++;
          } else if (data && data[0]) {
            const insertedRow = data[0];
            const idx = allStored.findIndex(item => item.id === record.id);
            if (idx >= 0) {
              allStored[idx] = {
                ...allStored[idx],
                id: insertedRow.id,
                created_at: insertedRow.created_at
              };
            }
            synced++;
          }
        } catch (err) {
          console.error(`[Sync] Excepción al sincronizar ${record.id}:`, err);
          failed++;
        }
      }

      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(allStored));
    }

    // 2. Sincronizar evaluaciones del formulario simple si las hubiera
    try {
      const rawSimple = localStorage.getItem(SIMPLE_STORAGE_KEY);
      if (rawSimple) {
        const simpleSheets: any[] = JSON.parse(rawSimple);
        let simpleUpdated = false;

        for (const sheet of simpleSheets) {
          if (sheet.synced) continue;
          const muestras = sheet.muestras || [];
          if (muestras.length === 0) continue;

          const rowsToInsert = muestras.map((m: any) => ({
            fecha: toPostgresDate(sheet.fecha),
            hora: sheet.hora,
            evaluador: (sheet.evaluador || '').trim(),
            lote_batea: (sheet.loteBatea || '').trim(),
            gusto: m.gusto,
            codigo_muestra: m.codigoMuestra || 'INF-D003-V3',
            v1_color: m.v1_color || 'Simple',
            v2_cantidad: 'Justo',
            v3_mezclado: 'Parejo',
            v4_ingredientes_receta: 'Sí',
            v5_ingrediente_extrano: 'No',
            v6_sellado_carne: 'Dorada y jugosa',
            v7_rehogado_vegetales: 'Justo',
            v8_caramelizacion: 'Justa',
            obs_vista: `[V1 Color]: ${m.v1_color || ''}\n[V2 Relleno/Mezclado]: ${m.v2_cantidad_mezclado || ''}\n[V3 Ingredientes]: ${m.v3_ingredientes || ''}\n[V4 Sellado]: ${m.v4_sellado || ''}\n[V5 Caramelización]: ${m.v5_caramelizacion || ''}`.trim(),
            o1_intensidad_aroma: 'Justa',
            o2_aroma_caracteristico: 'Sí',
            o3_olor_extrano: ['No'],
            obs_olfato: `[O1 Aroma]: ${m.o1_aroma || ''}`.trim(),
            b1_primer_impacto: ['Masa'],
            b2_textura_masa: 'Tierna',
            b3_jugosidad_relleno: 'Jugoso',
            b4_textura_carne: 'Tierna',
            b5_sal: 'Justa',
            b6_dulce: 'Justo',
            b7_picante: 'Justo',
            b8_sabor_caracteristico: 'Justo',
            b9_ingrediente_tapa: 'No',
            b10_sabor_extrano: ['No'],
            b11_retrogusto: 'Agradable',
            obs_boca: `[B1 Primer mordisco]: ${m.b1_primer_mordisco || ''}\n[B2 Textura]: ${m.b2_textura || ''}\n[B3 Sal/Dulce/Picante]: ${m.b3_sal_dulce_picante || ''}\n[B4 Sabor]: ${m.b4_sabor || ''}\n[B5 Retrogusto]: ${m.b5_sabor_post_tragar || ''}`.trim(),
            g1_estandar_gusto: 'Igual',
            g2_gusto_general: 5,
            g3_aprobacion: (m.g3_aprobacion || '').toLowerCase().includes('no') ? 'No' : 'Sí',
            obs_global: `[G1 Diferencias estándar]: ${m.g1_diferencias_estandar || ''}\n[G2 General y mejoras]: ${m.g2_general_mejoras || ''}\n[G3 Aprobación / Por qué]: ${m.g3_aprobacion || ''}\n[FORMATO]: Cuestionario Simple INF-D003 V3`.trim(),
            firma_evaluador: sheet.firmaEvaluador || sheet.evaluador,
            fotos: [],
            saved_by_email: localStorage.getItem('mg_sensorial_admin_user') || 'control_calidad@migusto.com.ar'
          }));

          const { error: simpleErr } = await supabase.from('sensorial_evaluations_v2').insert(rowsToInsert);
          if (!simpleErr) {
            sheet.synced = true;
            simpleUpdated = true;
            synced += rowsToInsert.length;
          } else {
            console.warn('[Sync Simple] Error:', simpleErr);
            failed += rowsToInsert.length;
          }
        }

        if (simpleUpdated) {
          localStorage.setItem(SIMPLE_STORAGE_KEY, JSON.stringify(simpleSheets));
        }
      }
    } catch (e) {
      console.warn('Error sincronizando planillas simples:', e);
    }

    notifySyncChange();
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

/**
 * Comprime imágenes en el navegador antes de convertirlas a DataURL
 * Reduce drásticamente el tamaño a ~150-250KB por foto evitando errores de tamaño o cuota
 */
export function compressImage(file: File, maxWidth = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    // Si no es imagen, retornar vacío
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
            return;
          }
        } catch (err) {
          console.warn('Fallo compresión en canvas, usando original', err);
        }
        resolve(e.target?.result as string || '');
      };
      img.onerror = () => resolve(e.target?.result as string || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
