-- Archivos de actividades (privados / públicos)
-- Storage: {fecha_realizacion}/{actividad_id}/{nodo_id}/{nombre}
-- Límite de archivo: 10 MB. Si pesa más, se guarda un enlace (Drive u otro).
-- Tope: 5 archivos o enlaces por pestaña (privado / público). Lo aplica la app.

alter table public.act_actividades
  add column if not exists token_archivos_publicos text;

create unique index if not exists act_actividades_token_archivos_publicos_uidx
  on public.act_actividades (token_archivos_publicos)
  where token_archivos_publicos is not null;

create table if not exists public.act_archivos (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references public.act_actividades (id) on delete cascade,
  parent_id uuid references public.act_archivos (id) on delete cascade,
  visibilidad text not null check (visibilidad in ('privado', 'publico')),
  tipo text not null check (tipo in ('carpeta', 'archivo', 'enlace')),
  nombre text not null,
  descripcion text,
  bucket text,
  path text,
  url text,
  nombre_archivo text,
  mime text,
  tamano integer,
  token_publico text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint act_archivos_origen check (
    (tipo = 'carpeta' and bucket is null and path is null and url is null)
    or (tipo = 'archivo' and bucket is not null and path is not null and url is null)
    or (tipo = 'enlace' and url is not null and bucket is null and path is null)
  ),
  constraint act_archivos_bucket_visibilidad check (
    bucket is null
    or (visibilidad = 'privado' and bucket = 'act-archivos-privados')
    or (visibilidad = 'publico' and bucket = 'act-archivos-publicos')
  )
);

create unique index if not exists act_archivos_token_publico_uidx
  on public.act_archivos (token_publico)
  where token_publico is not null;

create index if not exists act_archivos_actividad_vis_idx
  on public.act_archivos (actividad_id, visibilidad);

create index if not exists act_archivos_parent_idx
  on public.act_archivos (parent_id);

alter table public.act_archivos enable row level security;

drop policy if exists act_archivos_autenticado on public.act_archivos;
create policy act_archivos_autenticado
  on public.act_archivos
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists act_archivos_publico_select on public.act_archivos;
create policy act_archivos_publico_select
  on public.act_archivos
  for select
  to anon, authenticated
  using (visibilidad = 'publico');

insert into storage.buckets (id, name, public, file_size_limit)
values ('act-archivos-privados', 'act-archivos-privados', false, 10485760)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('act-archivos-publicos', 'act-archivos-publicos', true, 10485760)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

drop policy if exists act_archivos_privados_autenticado on storage.objects;
create policy act_archivos_privados_autenticado
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'act-archivos-privados')
  with check (bucket_id = 'act-archivos-privados');

drop policy if exists act_archivos_publicos_lectura on storage.objects;
drop policy if exists act_archivos_publicos_autenticado on storage.objects;
drop policy if exists act_archivos_publicos_insert on storage.objects;
drop policy if exists act_archivos_publicos_update on storage.objects;
drop policy if exists act_archivos_publicos_delete on storage.objects;

create policy act_archivos_publicos_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'act-archivos-publicos');

create policy act_archivos_publicos_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'act-archivos-publicos')
  with check (bucket_id = 'act-archivos-publicos');

create policy act_archivos_publicos_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'act-archivos-publicos');
