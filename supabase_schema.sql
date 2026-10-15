-- =========================================================================
-- ESQUEMA OFICIAL INF-D003 VERSIÓN 2 PARA EVALUACIONES SENSORIALES MI GUSTO
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.sensorial_evaluations_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Datos Generales
    fecha DATE DEFAULT CURRENT_DATE,
    hora TIME DEFAULT CURRENT_TIME,
    evaluador TEXT NOT NULL,
    lote_batea TEXT NOT NULL,
    gusto TEXT NOT NULL,
    codigo_muestra TEXT,

    -- 1. Vista
    v1_color TEXT,
    v2_cantidad TEXT,
    v3_mezclado TEXT,
    v4_ingredientes_receta TEXT,
    v5_ingrediente_extrano TEXT,
    v6_sellado_carne TEXT,
    v7_rehogado_vegetales TEXT,
    v8_caramelizacion TEXT,
    obs_vista TEXT,

    -- 2. Olfato
    o1_intensidad_aroma TEXT,
    o2_aroma_caracteristico TEXT,
    o3_olor_extrano JSONB DEFAULT '[]'::jsonb,
    obs_olfato TEXT,

    -- 3. Boca
    b1_primer_impacto JSONB DEFAULT '[]'::jsonb,
    b2_textura_masa TEXT,
    b3_jugosidad_relleno TEXT,
    b4_textura_carne TEXT,
    b5_sal TEXT,
    b6_dulce TEXT,
    b7_picante TEXT,
    b8_sabor_caracteristico TEXT,
    b9_ingrediente_tapa TEXT,
    b10_sabor_extrano JSONB DEFAULT '[]'::jsonb,
    b11_retrogusto TEXT,
    obs_boca TEXT,

    -- 4. Evaluación Global
    g1_estandar_gusto TEXT,
    g2_gusto_general NUMERIC,
    g3_aprobacion TEXT,
    obs_global TEXT,

    -- Evidencia y firma
    firma_evaluador TEXT,
    fotos JSONB DEFAULT '[]'::jsonb,
    saved_by_email TEXT
);

-- Permisos
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sensorial_evaluations_v2 TO anon, authenticated, service_role;

ALTER TABLE public.sensorial_evaluations_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion oficial" ON public.sensorial_evaluations_v2;
CREATE POLICY "Permitir insercion oficial" 
ON public.sensorial_evaluations_v2 FOR INSERT 
TO anon, authenticated, service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura oficial" ON public.sensorial_evaluations_v2;
CREATE POLICY "Permitir lectura oficial" 
ON public.sensorial_evaluations_v2 FOR SELECT 
TO anon, authenticated, service_role
USING (true);

DROP POLICY IF EXISTS "Permitir borrado oficial" ON public.sensorial_evaluations_v2;
CREATE POLICY "Permitir borrado oficial" 
ON public.sensorial_evaluations_v2 FOR DELETE 
TO anon, authenticated, service_role
USING (true);
