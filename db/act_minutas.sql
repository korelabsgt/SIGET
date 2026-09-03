-- Minutas de actividades (módulo asistencia / gestión territorial)
--
-- Relación: una minuta por actividad (act_actividades 1 ─ 1 act_minutas).
-- Contenido repetible (bloques, acuerdos, compromisos, anexos) en jsonb.
-- profiles.id = auth.users.id, por eso las referencias de autoría apuntan a profiles.
--
-- Columnas reales en Supabase (no inventar otras):
--   profiles: id, nombre, activo, puesto_id, email, ...
--   departamentos: id, nombre, parent_id, descripcion
--     (sin activo, sin orden, sin created_at)
--   puestos: id, nombre, departamento_id, es_jefatura
--     (sin activo, sin orden, sin created_at)
--   puesto_jefaturas: puesto_id, departamento_id
--
-- Menciones con @: cada responsable es SIEMPRE una referencia real, nunca texto
-- libre. Puede apuntar a un usuario (profiles), a una dependencia completa
-- (departamentos) o a un puesto/jefatura (puestos).
--
-- RLS: cada tabla habilita RLS con una sola política `for all to authenticated`.

-- ── Tablas ───────────────────────────────────────────────────────────────────

create table if not exists public.act_minutas (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null unique references public.act_actividades (id) on delete cascade,

  institucion text not null default 'Comisión Trinacional del Plan Trifinio',
  elaboro text,
  elaboro_por uuid references public.profiles (id) on delete set null,
  estado text not null default 'borrador' check (estado in ('borrador', 'finalizada')),

  -- 1. Introducción (HTML del editor)
  introduccion text not null default '',

  -- 2. Actividades realizadas
  -- [{ "id": "act-bloque-1", "titulo": "Unidad X", "items": ["<p>...</p>"] }]
  actividades_realizadas jsonb not null default '[]'::jsonb,

  -- 3. Resultados y/o acuerdos alcanzados
  -- [{
  --   "id": "acuerdo-1",
  --   "titulo": "<p>Unidad / tema</p>",
  --   "responsablesTexto": "<p>... <span data-type=\"mention\" data-id=\"usuario:<uuid>\">@Juan Pérez</span> ...</p>",
  --   "responsables": [
  --     { "tipo": "usuario",      "id": "<uuid profiles>",     "nombre": "Juan Pérez" },
  --     { "tipo": "departamento", "id": "<uuid departamentos>", "nombre": "Unidad de Comunicación" },
  --     { "tipo": "puesto",       "id": "<uuid puestos>",       "nombre": "Jefatura de Proyectos" }
  --   ],
  --   "items": ["<p>compromiso</p>"]
  -- }]
  acuerdos jsonb not null default '[]'::jsonb,

  -- Compromisos generales (directrices DEN)
  compromisos_generales text not null default '',

  -- 4. Anexos: nota descriptiva + archivos y enlaces
  anexos_nota text not null default '',

  -- Fotografías, PDF y enlaces. `url` siempre es el destino navegable:
  -- URL pública de Storage para imagen/pdf, o el href para enlace.
  -- [{
  --   "id": "anexo-1",
  --   "tipo": "imagen" | "pdf" | "enlace",
  --   "titulo": "Fotografía de la sesión",
  --   "url": "https://.../storage/v1/object/public/minutas-anexos/...",
  --   "bucket": "minutas-anexos",          -- null en enlaces
  --   "path": "<actividad_id>/<uuid>.jpg", -- null en enlaces
  --   "nombreArchivo": "foto.jpg",         -- null en enlaces
  --   "mime": "image/jpeg",                -- null en enlaces
  --   "tamano": 184320                     -- null en enlaces
  -- }]
  anexos jsonb not null default '[]'::jsonb,

  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,

  constraint act_minutas_actividades_es_arreglo
    check (jsonb_typeof(actividades_realizadas) = 'array'),
  constraint act_minutas_acuerdos_es_arreglo
    check (jsonb_typeof(acuerdos) = 'array'),
  constraint act_minutas_anexos_es_arreglo
    check (jsonb_typeof(anexos) = 'array')
);

-- Índice relacional de las menciones @ de la minuta.
-- Se reconstruye en cada guardado (delete + insert) a partir del jsonb.
-- Garantiza integridad referencial: si el usuario o la dependencia se elimina,
-- la asignación desaparece (cascade).
create table if not exists public.act_minuta_responsables (
  id uuid primary key default gen_random_uuid(),
  minuta_id uuid not null references public.act_minutas (id) on delete cascade,

  -- Ubicación de la mención dentro de la minuta
  seccion text not null check (
    seccion in (
      'introduccion',
      'actividad',
      'acuerdo',
      'compromiso',
      'compromisos_generales'
    )
  ),
  bloque_id text,        -- id del bloque de actividad o del acuerdo
  item_indice integer,   -- índice del compromiso/ítem dentro del bloque

  -- Destinatario: exactamente uno de los tres
  tipo text not null check (tipo in ('usuario', 'departamento', 'puesto')),
  profile_id uuid references public.profiles (id) on delete cascade,
  departamento_id uuid references public.departamentos (id) on delete cascade,
  puesto_id uuid references public.puestos (id) on delete cascade,

  nombre text not null,  -- snapshot del nombre al momento de la minuta
  created_at timestamptz not null default now(),

  constraint act_minuta_responsables_referencia_unica check (
    (tipo = 'usuario'
      and profile_id is not null
      and departamento_id is null
      and puesto_id is null)
    or (tipo = 'departamento'
      and departamento_id is not null
      and profile_id is null
      and puesto_id is null)
    or (tipo = 'puesto'
      and puesto_id is not null
      and profile_id is null
      and departamento_id is null)
  )
);

-- ── Índices ──────────────────────────────────────────────────────────────────

-- actividad_id ya tiene índice por la restricción unique.

create index if not exists act_minutas_estado_idx
  on public.act_minutas (estado);

create index if not exists act_minutas_elaboro_por_idx
  on public.act_minutas (elaboro_por);

create index if not exists act_minutas_updated_at_idx
  on public.act_minutas (updated_at desc nulls last);

create index if not exists act_minutas_acuerdos_gin_idx
  on public.act_minutas using gin (acuerdos);

create index if not exists act_minutas_anexos_gin_idx
  on public.act_minutas using gin (anexos);

-- Evita menciones duplicadas en la misma posición.
-- Se usa expresión porque las columnas de referencia son nullables.
create unique index if not exists act_minuta_responsables_uidx
  on public.act_minuta_responsables (
    minuta_id,
    seccion,
    coalesce(bloque_id, ''),
    coalesce(item_indice, -1),
    tipo,
    coalesce(profile_id, departamento_id, puesto_id)
  );

create index if not exists act_minuta_responsables_minuta_idx
  on public.act_minuta_responsables (minuta_id);

create index if not exists act_minuta_responsables_profile_idx
  on public.act_minuta_responsables (profile_id)
  where profile_id is not null;

create index if not exists act_minuta_responsables_departamento_idx
  on public.act_minuta_responsables (departamento_id)
  where departamento_id is not null;

create index if not exists act_minuta_responsables_puesto_idx
  on public.act_minuta_responsables (puesto_id)
  where puesto_id is not null;

-- ── Trigger updated_at ───────────────────────────────────────────────────────
-- Reutiliza public.act_set_updated_at() definida en db/act_actividades.sql.

create or replace function public.act_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists act_minutas_set_updated_at on public.act_minutas;
create trigger act_minutas_set_updated_at
  before update on public.act_minutas
  for each row
  execute function public.act_set_updated_at();

-- ── Vistas de apoyo ──────────────────────────────────────────────────────────
-- security_invoker = on para que se respete el RLS de las tablas base.

-- Catálogo unificado para el autocompletado del @ (usuarios + dependencias +
-- puestos de jefatura) con el id compuesto que guarda el nodo Mention.
create or replace view public.vw_minuta_menciones
with (security_invoker = on) as
select
  'usuario'::text as tipo,
  p.id as referencia_id,
  'usuario:' || p.id::text as mencion_id,
  p.nombre,
  pu.nombre as detalle,
  d.nombre as dependencia
from public.profiles p
left join public.puestos pu on pu.id = p.puesto_id
left join public.departamentos d on d.id = pu.departamento_id
where coalesce(p.activo, true) and p.nombre is not null

union all

select
  'departamento'::text as tipo,
  d.id as referencia_id,
  'departamento:' || d.id::text as mencion_id,
  d.nombre,
  d.descripcion as detalle,
  padre.nombre as dependencia
from public.departamentos d
left join public.departamentos padre on padre.id = d.parent_id

union all

select
  'puesto'::text as tipo,
  pu.id as referencia_id,
  'puesto:' || pu.id::text as mencion_id,
  pu.nombre,
  case when coalesce(pu.es_jefatura, false) then 'Jefatura' else 'Puesto' end as detalle,
  d.nombre as dependencia
from public.puestos pu
left join public.departamentos d on d.id = pu.departamento_id;

-- Personas que pertenecen a cada dependencia (para expandir una mención de
-- departamento a sus integrantes: notificaciones, reportes, seguimiento).
create or replace view public.vw_dependencia_personas
with (security_invoker = on) as
select
  d.id as departamento_id,
  d.nombre as departamento_nombre,
  pu.id as puesto_id,
  pu.nombre as puesto_nombre,
  coalesce(pu.es_jefatura, false) as es_jefatura,
  p.id as profile_id,
  p.nombre as profile_nombre,
  p.email
from public.departamentos d
join public.puestos pu on pu.departamento_id = d.id
join public.profiles p on p.puesto_id = pu.id
where coalesce(p.activo, true);

-- Jefaturas declaradas por dependencia (tabla puente puesto_jefaturas).
create or replace view public.vw_dependencia_jefaturas
with (security_invoker = on) as
select
  d.id as departamento_id,
  d.nombre as departamento_nombre,
  pu.id as puesto_id,
  pu.nombre as puesto_nombre,
  p.id as profile_id,
  p.nombre as profile_nombre
from public.departamentos d
join public.puesto_jefaturas pj on pj.departamento_id = d.id
join public.puestos pu on pu.id = pj.puesto_id
left join public.profiles p on p.puesto_id = pu.id;

-- Responsables de minuta ya resueltos: nombre vigente, dependencia y actividad.
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

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.act_minutas enable row level security;
alter table public.act_minuta_responsables enable row level security;

drop policy if exists act_minutas_autenticado on public.act_minutas;
create policy act_minutas_autenticado
  on public.act_minutas
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists act_minuta_responsables_autenticado on public.act_minuta_responsables;
create policy act_minuta_responsables_autenticado
  on public.act_minuta_responsables
  for all
  to authenticated
  using (true)
  with check (true);

-- ── Storage: bucket de anexos ────────────────────────────────────────────────
-- Público en lectura para poder mostrar imágenes y abrir PDF con URL directa.
-- Escritura y borrado solo autenticado.

insert into storage.buckets (id, name, public)
values ('minutas-anexos', 'minutas-anexos', true)
on conflict (id) do nothing;

drop policy if exists minutas_anexos_lectura_publica on storage.objects;
create policy minutas_anexos_lectura_publica
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'minutas-anexos');

drop policy if exists minutas_anexos_autenticado on storage.objects;
create policy minutas_anexos_autenticado
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'minutas-anexos')
  with check (bucket_id = 'minutas-anexos');
