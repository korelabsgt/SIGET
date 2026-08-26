-- Módulo de asistencia: actividades, participantes (DPI) y registros vía QR
-- Políticas RLS (dos niveles por tabla):
--   1) Público (anon + authenticated): ver y crear
--   2) Autenticado: editar y eliminar

-- ── Tablas ───────────────────────────────────────────────────────────────────

create table if not exists public.asist_actividades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  fecha_realizacion date not null default current_date,
  direccion text,
  departamento text,
  municipio text,
  activo boolean not null default true,
  slug text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.asist_registros (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references public.asist_actividades (id) on delete cascade,
  dpi text,
  nombre text not null,
  puesto text,
  direccion_administrativa text,
  fecha_nacimiento date not null,
  genero text not null check (genero in ('masculino', 'femenino')),
  email text,
  telefono text,
  institucion text,
  es_trifinio boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists asist_registros_actividad_dpi_uidx
  on public.asist_registros (actividad_id, dpi)
  where dpi is not null;

-- ── Índices ──────────────────────────────────────────────────────────────────

create index if not exists asist_actividades_created_at_idx
  on public.asist_actividades (created_at desc);

create index if not exists asist_actividades_activo_idx
  on public.asist_actividades (activo);

create unique index if not exists asist_actividades_slug_uidx
  on public.asist_actividades (slug)
  where slug is not null;

create index if not exists asist_registros_genero_idx
  on public.asist_registros (genero);

create index if not exists asist_registros_actividad_id_idx
  on public.asist_registros (actividad_id);

create index if not exists asist_registros_dpi_idx
  on public.asist_registros (dpi);

create index if not exists asist_registros_created_at_idx
  on public.asist_registros (created_at desc);

-- ── Triggers updated_at ──────────────────────────────────────────────────────

create or replace function public.asist_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists asist_actividades_set_updated_at on public.asist_actividades;
create trigger asist_actividades_set_updated_at
  before update on public.asist_actividades
  for each row
  execute function public.asist_set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.asist_actividades enable row level security;
alter table public.asist_registros enable row level security;

-- asist_actividades
drop policy if exists asist_actividades_publico on public.asist_actividades;
drop policy if exists asist_actividades_autenticado on public.asist_actividades;
drop policy if exists asist_actividades_select_public on public.asist_actividades;
drop policy if exists asist_actividades_mutate_authenticated on public.asist_actividades;

create policy asist_actividades_publico
  on public.asist_actividades
  for select
  to anon, authenticated
  using (true);

create policy asist_actividades_autenticado
  on public.asist_actividades
  for all
  to authenticated
  using (true)
  with check (true);

-- asist_registros
drop policy if exists asist_registros_publico on public.asist_registros;
drop policy if exists asist_registros_autenticado on public.asist_registros;
drop policy if exists asist_registros_select_public on public.asist_registros;
drop policy if exists asist_registros_insert_public on public.asist_registros;
drop policy if exists asist_registros_mutate_authenticated on public.asist_registros;
drop policy if exists asist_registros_autenticado_delete on public.asist_registros;
drop policy if exists asist_registros_publico_insert on public.asist_registros;

create policy asist_registros_publico
  on public.asist_registros
  for select
  to anon, authenticated
  using (true);

create policy asist_registros_publico_insert
  on public.asist_registros
  for insert
  to anon, authenticated
  with check (true);

create policy asist_registros_autenticado
  on public.asist_registros
  for update
  to authenticated
  using (true)
  with check (true);

create policy asist_registros_autenticado_delete
  on public.asist_registros
  for delete
  to authenticated
  using (true);

-- ── Migración desde esquema anterior ─────────────────────────────────────────
-- Si ya tenías tablas creadas, ejecuta en Supabase:

-- alter table public.asist_actividades
--   add column if not exists fecha_realizacion date;
-- update public.asist_actividades
--   set fecha_realizacion = created_at::date
--   where fecha_realizacion is null;
-- alter table public.asist_actividades
--   alter column fecha_realizacion set not null,
--   alter column fecha_realizacion set default current_date;
