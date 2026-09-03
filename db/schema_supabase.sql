-- Instantánea del esquema vivo en Supabase (solo contexto; no ejecutar).
-- Tablas de organización, perfiles, asistencia y minutas.
-- Fuente: dump del proyecto al aplicar db/act_minutas.sql.

CREATE TABLE public.departamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  parent_id uuid,
  descripcion text,
  CONSTRAINT departamentos_pkey PRIMARY KEY (id),
  CONSTRAINT departamentos_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departamentos(id)
);

CREATE TABLE public.puestos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  departamento_id uuid,
  es_jefatura boolean DEFAULT false,
  CONSTRAINT puestos_pkey PRIMARY KEY (id),
  CONSTRAINT puestos_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id)
);

CREATE TABLE public.puesto_jefaturas (
  puesto_id uuid NOT NULL,
  departamento_id uuid NOT NULL,
  CONSTRAINT puesto_jefaturas_puesto_id_fkey FOREIGN KEY (puesto_id) REFERENCES public.puestos(id),
  CONSTRAINT puesto_jefaturas_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  nombre text,
  dpi text,
  genero text,
  fecha_nacimiento date,
  direccion text,
  telefono text,
  nit text,
  contacto_emergencia text,
  rol text,
  avatar_url text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  email text,
  telefono_emergencia text,
  puesto_id uuid,
  organizacion_id uuid,
  ultimo_cambio_password timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT info_usuario_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_puesto_id_fkey FOREIGN KEY (puesto_id) REFERENCES public.puestos(id)
);

CREATE TABLE public.act_actividades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  fecha_realizacion date NOT NULL DEFAULT CURRENT_DATE,
  direccion text,
  departamento text,
  municipio text,
  CONSTRAINT act_actividades_pkey PRIMARY KEY (id),
  CONSTRAINT act_actividades_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT act_actividades_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.act_registros (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actividad_id uuid NOT NULL,
  nombre text NOT NULL,
  puesto text,
  direccion_administrativa text,
  fecha_nacimiento date NOT NULL,
  genero text NOT NULL CHECK (genero = ANY (ARRAY['masculino'::text, 'femenino'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  dpi text,
  es_trifinio boolean NOT NULL DEFAULT false,
  email text,
  institucion text,
  telefono text,
  CONSTRAINT act_registros_pkey PRIMARY KEY (id),
  CONSTRAINT act_registros_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.act_actividades(id)
);

CREATE TABLE public.act_minutas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actividad_id uuid NOT NULL UNIQUE,
  institucion text NOT NULL DEFAULT 'Comisión Trinacional del Plan Trifinio'::text,
  elaboro text,
  elaboro_por uuid,
  estado text NOT NULL DEFAULT 'borrador'::text CHECK (estado = ANY (ARRAY['borrador'::text, 'finalizada'::text])),
  introduccion text NOT NULL DEFAULT ''::text,
  actividades_realizadas jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(actividades_realizadas) = 'array'::text),
  acuerdos jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(acuerdos) = 'array'::text),
  compromisos_generales text NOT NULL DEFAULT ''::text,
  anexos_nota text NOT NULL DEFAULT ''::text,
  anexos jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(anexos) = 'array'::text),
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT act_minutas_pkey PRIMARY KEY (id),
  CONSTRAINT act_minutas_elaboro_por_fkey FOREIGN KEY (elaboro_por) REFERENCES public.profiles(id),
  CONSTRAINT act_minutas_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT act_minutas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id),
  CONSTRAINT act_minutas_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.act_actividades(id)
);

CREATE TABLE public.act_minuta_responsables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  minuta_id uuid NOT NULL,
  seccion text NOT NULL CHECK (seccion = ANY (ARRAY['introduccion'::text, 'actividad'::text, 'acuerdo'::text, 'compromiso'::text, 'compromisos_generales'::text])),
  bloque_id text,
  item_indice integer,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['usuario'::text, 'departamento'::text, 'puesto'::text])),
  profile_id uuid,
  departamento_id uuid,
  puesto_id uuid,
  nombre text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT act_minuta_responsables_pkey PRIMARY KEY (id),
  CONSTRAINT act_minuta_responsables_minuta_id_fkey FOREIGN KEY (minuta_id) REFERENCES public.act_minutas(id),
  CONSTRAINT act_minuta_responsables_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT act_minuta_responsables_departamento_id_fkey FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id),
  CONSTRAINT act_minuta_responsables_puesto_id_fkey FOREIGN KEY (puesto_id) REFERENCES public.puestos(id)
);
