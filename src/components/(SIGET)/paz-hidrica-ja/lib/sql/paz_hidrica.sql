create table if not exists public.ja_incidentes (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  fecha date not null default current_date,
  microcuenca text not null,
  municipio text not null,
  criticidad text not null,
  tipologia text not null,
  descripcion text not null,
  pob_hombres integer not null default 0,
  pob_mujeres integer not null default 0,
  pob_juventudes integer not null default 0,
  pob_pueblo_maya_chorti integer not null default 0,
  confidencial boolean not null default false,
  id_anonimo text,
  derivacion text not null,
  asignado_usuario_id uuid references public.profiles(id),
  asignado_a text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.ja_sesiones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  fecha date not null default current_date,
  microcuenca text not null,
  municipio text not null,
  fase text not null,
  incidente_id uuid not null references public.ja_incidentes (id),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.ja_acuerdos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.ja_sesiones (id),
  incidente_id uuid not null references public.ja_incidentes (id),
  descripcion text not null,
  institucion_responsable text not null,
  fecha_limite date not null,
  estado text not null,
  efectividad integer not null check (efectividad between 1 and 5),
  medio_verificacion text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.ja_proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  comunidad text not null,
  microcuenca text not null,
  municipio text not null,
  agencia text not null,
  tipologia text not null,
  avance_fisico numeric not null default 0,
  presupuesto_total numeric not null default 0,
  presupuesto_ejecutado numeric not null default 0,
  representatividad_comunitaria numeric not null default 0,
  impacto_medios_vida integer not null check (impacto_medios_vida between 1 and 5),
  innovacion_climatica integer not null check (innovacion_climatica between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.ja_evidencias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null,
  etiqueta text not null,
  fecha date not null default current_date,
  vinculado text not null,
  created_at timestamptz not null default now()
);

create or replace function public.ja_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ja_incidentes_set_updated_at
  before update on public.ja_incidentes
  for each row execute function public.ja_set_updated_at();

create trigger ja_sesiones_set_updated_at
  before update on public.ja_sesiones
  for each row execute function public.ja_set_updated_at();

create trigger ja_acuerdos_set_updated_at
  before update on public.ja_acuerdos
  for each row execute function public.ja_set_updated_at();

create trigger ja_proyectos_set_updated_at
  before update on public.ja_proyectos
  for each row execute function public.ja_set_updated_at();
