import { supabase } from './supabase';
import type { SensorialFormAnswers, SensorialEvaluationRecord } from '../types';

export const OFFLINE_STORAGE_KEY = 'mg_sensorial_official_history';
export const SYNC_EVENT_NAME = 'mg_sensorial_sync_event';

/**
 * Convierte un objeto de respuestas de la app (camelCase) al formato de base de datos Supabase (snake_case)
 */
export function mapPayloadToSupabase(payload: SensorialFormAnswers, savedByEmail?: string) {
  return {
    fecha: payload.fecha,
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

/**
 * Intenta sincronizar todas las evaluaciones pendientes con Supabase
 */
let isSyncing = false;
export async function syncPendingEvaluations(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  
  const pending = getPendingEvaluations();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
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
          // Actualizar id local con el ID real de Supabase
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
