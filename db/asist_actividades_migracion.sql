-- Histórico. Ya aplicado cuando las tablas se llamaban asist_*.
-- No ejecutar. El esquema vigente usa act_actividades / act_registros.

-- Migración para alinear registros con el código actual
-- Ejecutar en Supabase SQL Editor

-- 1) Columnas nuevas en actividades (si falta fecha_realizacion)
alter table public.asist_actividades
  add column if not exists fecha_realizacion date;

update public.asist_actividades
set fecha_realizacion = created_at::date
where fecha_realizacion is null;

alter table public.asist_actividades
  alter column fecha_realizacion set default current_date;

alter table public.asist_actividades
  alter column fecha_realizacion set not null;

alter table public.asist_actividades
  add column if not exists direccion text;

alter table public.asist_actividades
  add column if not exists departamento text;

alter table public.asist_actividades
  add column if not exists municipio text;

-- 2) Columnas nuevas en registros
alter table public.asist_registros
  add column if not exists dpi text;

alter table public.asist_registros
  add column if not exists es_trifinio boolean not null default false;

alter table public.asist_registros
  add column if not exists email text;

alter table public.asist_registros
  add column if not exists institucion text;

alter table public.asist_registros
  add column if not exists telefono text;

-- 3) Puesto y dirección opcionales (cuando no es Trifinio)
alter table public.asist_registros
  alter column puesto drop not null;

alter table public.asist_registros
  alter column direccion_administrativa drop not null;

-- 4) Evitar DPI duplicado en la misma actividad
create unique index if not exists asist_registros_actividad_dpi_uidx
  on public.asist_registros (actividad_id, dpi)
  where dpi is not null;

-- 5) RLS en registros (si no existen)
alter table public.asist_registros enable row level security;

drop policy if exists asist_registros_publico on public.asist_registros;
drop policy if exists asist_registros_publico_insert on public.asist_registros;
drop policy if exists asist_registros_autenticado on public.asist_registros;
drop policy if exists asist_registros_autenticado_delete on public.asist_registros;

create policy asist_registros_publico
  on public.asist_registros for select to anon, authenticated using (true);

create policy asist_registros_publico_insert
  on public.asist_registros for insert to anon, authenticated with check (true);

create policy asist_registros_autenticado
  on public.asist_registros for update to authenticated
  using (true) with check (true);

create policy asist_registros_autenticado_delete
  on public.asist_registros for delete to authenticated using (true);

-- 6) Ubicación solo en actividad (no en registros)
drop index if exists public.asist_registros_departamento_idx;

alter table public.asist_registros
  drop column if exists departamento;

alter table public.asist_registros
  drop column if exists municipio;
