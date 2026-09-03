-- Módulo de asistencia: actividades, participantes (DPI) y registros vía QR
-- Políticas RLS (dos niveles por tabla):
--   1) Público (anon + authenticated): ver y crear
--   2) Autenticado: editar y eliminar

-- ── Tablas ───────────────────────────────────────────────────────────────────

create table if not exists public.act_actividades (
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

create table if not exists public.act_registros (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references public.act_actividades (id) on delete cascade,
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

create unique index if not exists act_registros_actividad_dpi_uidx
  on public.act_registros (actividad_id, dpi)
  where dpi is not null;

-- ── Índices ──────────────────────────────────────────────────────────────────

create index if not exists act_actividades_created_at_idx
  on public.act_actividades (created_at desc);

create index if not exists act_actividades_activo_idx
  on public.act_actividades (activo);

create unique index if not exists act_actividades_slug_uidx
  on public.act_actividades (slug)
  where slug is not null;

create index if not exists act_registros_genero_idx
  on public.act_registros (genero);

create index if not exists act_registros_actividad_id_idx
  on public.act_registros (actividad_id);

create index if not exists act_registros_dpi_idx
  on public.act_registros (dpi);

create index if not exists act_registros_created_at_idx
  on public.act_registros (created_at desc);

-- ── Triggers updated_at ──────────────────────────────────────────────────────

create or replace function public.act_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists act_actividades_set_updated_at on public.act_actividades;
create trigger act_actividades_set_updated_at
  before update on public.act_actividades
  for each row
  execute function public.act_set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.act_actividades enable row level security;
alter table public.act_registros enable row level security;

-- act_actividades
drop policy if exists act_actividades_publico on public.act_actividades;
drop policy if exists act_actividades_autenticado on public.act_actividades;
drop policy if exists act_actividades_select_public on public.act_actividades;
drop policy if exists act_actividades_mutate_authenticated on public.act_actividades;

create policy act_actividades_publico
  on public.act_actividades
  for select
  to anon, authenticated
  using (true);

create policy act_actividades_autenticado
  on public.act_actividades
  for all
  to authenticated
  using (true)
  with check (true);

-- act_registros
drop policy if exists act_registros_publico on public.act_registros;
drop policy if exists act_registros_autenticado on public.act_registros;
drop policy if exists act_registros_select_public on public.act_registros;
drop policy if exists act_registros_insert_public on public.act_registros;
drop policy if exists act_registros_mutate_authenticated on public.act_registros;
drop policy if exists act_registros_autenticado_delete on public.act_registros;
drop policy if exists act_registros_publico_insert on public.act_registros;

create policy act_registros_publico
  on public.act_registros
  for select
  to anon, authenticated
  using (true);

create policy act_registros_publico_insert
  on public.act_registros
  for insert
  to anon, authenticated
  with check (true);

create policy act_registros_autenticado
  on public.act_registros
  for update
  to authenticated
  using (true)
  with check (true);

create policy act_registros_autenticado_delete
  on public.act_registros
  for delete
  to authenticated
  using (true);

-- ── Migración desde esquema anterior ─────────────────────────────────────────
-- Si ya tenías tablas creadas, ejecuta en Supabase:

-- alter table public.act_actividades
--   add column if not exists fecha_realizacion date;
-- update public.act_actividades
--   set fecha_realizacion = created_at::date
--   where fecha_realizacion is null;
-- alter table public.act_actividades
--   alter column fecha_realizacion set not null,
--   alter column fecha_realizacion set default current_date;
