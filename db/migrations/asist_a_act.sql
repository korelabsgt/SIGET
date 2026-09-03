-- Prefijo asist_ → act_ (tablas, vistas, índices, políticas, triggers).
-- Idempotente: se puede volver a ejecutar si ya quedó aplicado a medias.
-- Pegar completo en el SQL Editor de Supabase.

-- ── 1. Vistas que apuntan a las tablas viejas ────────────────────────────────

drop view if exists public.vw_asist_minuta_responsables;
drop view if exists public.vw_act_minuta_responsables;

-- ── 2. Tablas ────────────────────────────────────────────────────────────────

do $$
begin
  if to_regclass('public.asist_actividades') is not null
     and to_regclass('public.act_actividades') is null then
    alter table public.asist_actividades rename to act_actividades;
  end if;

  if to_regclass('public.asist_registros') is not null
     and to_regclass('public.act_registros') is null then
    alter table public.asist_registros rename to act_registros;
  end if;

  if to_regclass('public.asist_minutas') is not null
     and to_regclass('public.act_minutas') is null then
    alter table public.asist_minutas rename to act_minutas;
  end if;

  if to_regclass('public.asist_minuta_responsables') is not null
     and to_regclass('public.act_minuta_responsables') is null then
    alter table public.asist_minuta_responsables rename to act_minuta_responsables;
  end if;
end $$;

-- ── 3. Función del trigger updated_at ────────────────────────────────────────

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'asist_set_updated_at'
  ) and not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'act_set_updated_at'
  ) then
    alter function public.asist_set_updated_at() rename to act_set_updated_at;
  end if;
end $$;

create or replace function public.act_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 4. Índices, constraints, políticas y triggers con prefijo asist_ ─────────

do $$
declare
  r record;
begin
  for r in
    select schemaname, indexname
    from pg_indexes
    where schemaname = 'public'
      and indexname like 'asist_%'
  loop
    execute format(
      'alter index %I.%I rename to %I',
      r.schemaname,
      r.indexname,
      regexp_replace(r.indexname, '^asist_', 'act_')
    );
  end loop;

  for r in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname like 'asist_%'
  loop
    execute format(
      'alter table %s rename constraint %I to %I',
      r.tbl,
      r.conname,
      regexp_replace(r.conname, '^asist_', 'act_')
    );
  end loop;

  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname like 'asist_%'
  loop
    execute format(
      'alter policy %I on %I.%I rename to %I',
      r.policyname,
      r.schemaname,
      r.tablename,
      regexp_replace(r.policyname, '^asist_', 'act_')
    );
  end loop;

  for r in
    select distinct event_object_table as tbl, trigger_name
    from information_schema.triggers
    where trigger_schema = 'public'
      and trigger_name like 'asist_%'
  loop
    execute format(
      'alter trigger %I on public.%I rename to %I',
      r.trigger_name,
      r.tbl,
      regexp_replace(r.trigger_name, '^asist_', 'act_')
    );
  end loop;
end $$;

-- ── 5. Vista de responsables ─────────────────────────────────────────────────

create or replace view public.vw_act_minuta_responsables
with (security_invoker = on) as
select
  r.id,
  r.minuta_id,
  m.actividad_id,
  a.nombre as actividad_nombre,
  a.fecha_realizacion,
  m.estado,
  r.seccion,
  r.bloque_id,
  r.item_indice,
  r.tipo,
  r.profile_id,
  r.departamento_id,
  r.puesto_id,
  coalesce(p.nombre, d.nombre, pu.nombre, r.nombre) as nombre,
  coalesce(pd.nombre, d.nombre, pud.nombre) as dependencia
from public.act_minuta_responsables r
join public.act_minutas m on m.id = r.minuta_id
join public.act_actividades a on a.id = m.actividad_id
left join public.profiles p on p.id = r.profile_id
left join public.puestos ppu on ppu.id = p.puesto_id
left join public.departamentos pd on pd.id = ppu.departamento_id
left join public.departamentos d on d.id = r.departamento_id
left join public.puestos pu on pu.id = r.puesto_id
left join public.departamentos pud on pud.id = pu.departamento_id;
