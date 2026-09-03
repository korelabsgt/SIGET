-- Organización jerárquica alineada con Supabase:
--   departamentos (id, nombre, parent_id, descripcion)
--   puestos (id, nombre, departamento_id, es_jefatura)
--   puesto_jefaturas (puesto_id, departamento_id)
--   profiles.puesto_id → puestos.id
-- Idempotente. No agregar activo/orden/created_at: no existen en producción.

create table if not exists public.departamentos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  parent_id uuid,
  descripcion text
);

create table if not exists public.puestos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  departamento_id uuid,
  es_jefatura boolean default false
);

create table if not exists public.puesto_jefaturas (
  puesto_id uuid not null,
  departamento_id uuid not null,
  unique (puesto_id, departamento_id)
);

alter table public.departamentos
  add column if not exists parent_id uuid,
  add column if not exists descripcion text;

alter table public.puestos
  add column if not exists departamento_id uuid,
  add column if not exists es_jefatura boolean default false;

alter table public.profiles
  add column if not exists puesto_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'departamentos_parent_id_fkey'
  ) then
    alter table public.departamentos
      add constraint departamentos_parent_id_fkey
      foreign key (parent_id) references public.departamentos(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'departamentos_no_self_parent'
  ) then
    alter table public.departamentos
      add constraint departamentos_no_self_parent
      check (parent_id is null or parent_id <> id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'puestos_departamento_id_fkey'
  ) then
    alter table public.puestos
      add constraint puestos_departamento_id_fkey
      foreign key (departamento_id) references public.departamentos(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'puesto_jefaturas_puesto_id_fkey'
  ) then
    alter table public.puesto_jefaturas
      add constraint puesto_jefaturas_puesto_id_fkey
      foreign key (puesto_id) references public.puestos(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'puesto_jefaturas_departamento_id_fkey'
  ) then
    alter table public.puesto_jefaturas
      add constraint puesto_jefaturas_departamento_id_fkey
      foreign key (departamento_id) references public.departamentos(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_puesto_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_puesto_id_fkey
      foreign key (puesto_id) references public.puestos(id) on delete set null;
  end if;
end $$;

create index if not exists departamentos_parent_id_idx on public.departamentos (parent_id);
create index if not exists puestos_departamento_id_idx on public.puestos (departamento_id);
create index if not exists puesto_jefaturas_puesto_id_idx on public.puesto_jefaturas (puesto_id);
create index if not exists puesto_jefaturas_departamento_id_idx on public.puesto_jefaturas (departamento_id);
create index if not exists profiles_puesto_id_idx on public.profiles (puesto_id);

alter table public.departamentos enable row level security;
alter table public.puestos enable row level security;
alter table public.puesto_jefaturas enable row level security;

drop policy if exists departamentos_all_authenticated on public.departamentos;
create policy departamentos_all_authenticated
  on public.departamentos for all to authenticated using (true) with check (true);

drop policy if exists puestos_all_authenticated on public.puestos;
create policy puestos_all_authenticated
  on public.puestos for all to authenticated using (true) with check (true);

drop policy if exists puesto_jefaturas_all_authenticated on public.puesto_jefaturas;
create policy puesto_jefaturas_all_authenticated
  on public.puesto_jefaturas for all to authenticated using (true) with check (true);
