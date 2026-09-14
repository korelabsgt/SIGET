-- ============================================================================
-- MÓDULO DE GESTIÓN DE COMBUSTIBLE - SIGET (MODELO 2 TABLAS)
-- Base de datos: PostgreSQL / Supabase
-- Se conecta a: ot_vehiculos, profiles
--
-- Idempotente: puede ejecutarse aunque existan tipos, tablas o políticas previas.
--
-- IMPORTANTE (SIGET):
--   profiles.rol guarda SLUGS: user, admin, super, admin-ot, etc.
--   "Administrador" es solo etiqueta UI; is_admin() compara slugs.
--   Tablas siempre en minúsculas: ot_requisicion_combustible (no OT_…).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fondo_combustible') THEN
        CREATE TYPE fondo_combustible AS ENUM ('OT', 'HAME');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_solicitud_combustible') THEN
        CREATE TYPE estado_solicitud_combustible AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. REQUISICIÓN DE COMBUSTIBLE (inventario / talonario + trazabilidad)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ot_requisicion_combustible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cantidad INT NOT NULL,
    denominacion NUMERIC(10, 2) NOT NULL,
    cupon_del INT NOT NULL,
    cupon_al INT NOT NULL,
    disponibles INT NOT NULL,
    ultimo_entregado INT,
    fondo fondo_combustible NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_ot_req_rango_valido CHECK (cupon_al >= cupon_del),
    CONSTRAINT chk_ot_req_disponibles_rango CHECK (disponibles >= 0 AND disponibles <= cantidad)
);

ALTER TABLE ot_requisicion_combustible
    ADD COLUMN IF NOT EXISTS solicitante_id UUID REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE ot_requisicion_combustible
    ADD COLUMN IF NOT EXISTS aprobador_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ot_requisicion_fondo
    ON ot_requisicion_combustible(fondo);

CREATE INDEX IF NOT EXISTS idx_ot_requisicion_solicitante
    ON ot_requisicion_combustible(solicitante_id);

CREATE INDEX IF NOT EXISTS idx_ot_requisicion_aprobador
    ON ot_requisicion_combustible(aprobador_id);

-- ----------------------------------------------------------------------------
-- 3. SOLICITUD DE COMBUSTIBLE (petición previa de vales)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ot_solicitud_combustible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehiculo_id UUID NOT NULL REFERENCES ot_vehiculos(id) ON DELETE RESTRICT,
    cupon_del INT,
    cupon_al INT,
    solicitante_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    entregante_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    estado estado_solicitud_combustible NOT NULL DEFAULT 'PENDIENTE',
    comentarios TEXT,
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_aprobacion TIMESTAMPTZ,
    url_comprobante TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_ot_sol_rango CHECK (cupon_al IS NULL OR cupon_del IS NULL OR cupon_al >= cupon_del)
);

CREATE INDEX IF NOT EXISTS idx_ot_solicitud_vehiculo
    ON ot_solicitud_combustible(vehiculo_id);

CREATE INDEX IF NOT EXISTS idx_ot_solicitud_estado
    ON ot_solicitud_combustible(estado);

CREATE INDEX IF NOT EXISTS idx_ot_solicitud_solicitante
    ON ot_solicitud_combustible(solicitante_id);

-- Índices legacy (instalaciones anteriores)
CREATE INDEX IF NOT EXISTS idx_ot_solicitud_combustible_vehiculo
    ON ot_solicitud_combustible(vehiculo_id);

CREATE INDEX IF NOT EXISTS idx_ot_solicitud_combustible_estado
    ON ot_solicitud_combustible(estado);

-- ----------------------------------------------------------------------------
-- 4. FUNCIONES DE APOYO
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_rol_slug(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    replace(
      replace(
        replace(trim(coalesce(raw, '')), ' ', '-'),
        '_',
        '-'
      ),
      '--',
      '-'
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        public.normalize_rol_slug(p.rol) IN ('admin', 'super', 'admin-ot', 'administrador-ot')
        OR (
          public.normalize_rol_slug(p.rol) LIKE '%administrador%'
          AND public.normalize_rol_slug(p.rol) LIKE '%ot%'
        )
      )
  )
$$;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE ot_requisicion_combustible ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_solicitud_combustible ENABLE ROW LEVEL SECURITY;

-- Políticas legacy (script anterior)
DROP POLICY IF EXISTS "requisicion_combustible_select_autenticados" ON ot_requisicion_combustible;
DROP POLICY IF EXISTS "requisicion_combustible_escritura_admin" ON ot_requisicion_combustible;
DROP POLICY IF EXISTS "solicitud_combustible_select_autenticados" ON ot_solicitud_combustible;
DROP POLICY IF EXISTS "solicitud_combustible_insert_propio" ON ot_solicitud_combustible;
DROP POLICY IF EXISTS "solicitud_combustible_update_admin" ON ot_solicitud_combustible;
DROP POLICY IF EXISTS "solicitud_combustible_delete_admin" ON ot_solicitud_combustible;

-- Políticas actuales (re-ejecución segura)
DROP POLICY IF EXISTS "requisicion_select_autenticados" ON ot_requisicion_combustible;
DROP POLICY IF EXISTS "requisicion_insert_autenticados" ON ot_requisicion_combustible;
DROP POLICY IF EXISTS "requisicion_update_admin" ON ot_requisicion_combustible;
DROP POLICY IF EXISTS "requisicion_delete_admin" ON ot_requisicion_combustible;

DROP POLICY IF EXISTS "solicitud_select_autenticados" ON ot_solicitud_combustible;
DROP POLICY IF EXISTS "solicitud_insert_propio" ON ot_solicitud_combustible;
DROP POLICY IF EXISTS "solicitud_update_admin" ON ot_solicitud_combustible;
DROP POLICY IF EXISTS "solicitud_delete_admin" ON ot_solicitud_combustible;

CREATE POLICY "requisicion_select_autenticados"
ON ot_requisicion_combustible
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "requisicion_insert_autenticados"
ON ot_requisicion_combustible
FOR INSERT
TO authenticated
WITH CHECK (solicitante_id = auth.uid() OR is_admin());

CREATE POLICY "requisicion_update_admin"
ON ot_requisicion_combustible
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "requisicion_delete_admin"
ON ot_requisicion_combustible
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "solicitud_select_autenticados"
ON ot_solicitud_combustible
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "solicitud_insert_propio"
ON ot_solicitud_combustible
FOR INSERT
TO authenticated
WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "solicitud_update_admin"
ON ot_solicitud_combustible
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "solicitud_delete_admin"
ON ot_solicitud_combustible
FOR DELETE
TO authenticated
USING (is_admin());
