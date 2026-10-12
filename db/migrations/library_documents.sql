-- Repositorio Digital / Módulo de Conocimiento
-- Pegar en el SQL Editor de Supabase.

create extension if not exists unaccent;

do $$ begin
  create type public.document_status as enum (
    'borrador',
    'en_revision',
    'aprobado',
    'rechazado'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.document_channel as enum (
    'noticia',
    'cientifico',
    'educativo',
    'normativo_interno'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.document_type_enum as enum (
    'nota',
    'comunicado',
    'articulo',
    'informe',
    'estudio',
    'manual',
    'guia',
    'infografia',
    'presentacion',
    'normativa',
    'procedimiento',
    'otro'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.country_scope_enum as enum (
    'trinacional',
    'guatemala',
    'el_salvador',
    'honduras'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.program_enum as enum (
    'desarrollo_social_economico',
    'genero_juventud_pueblos_originarios',
    'cambio_climatico_gestion_ambiental',
    'gobernanza_institucionalidad'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.access_level_enum as enum (
    'public',
    'interno'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.library_file_kind as enum (
    'adjunto',
    'imagen'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists tags_slug_uidx on public.tags (slug);
create unique index if not exists tags_name_uidx on public.tags (name);

insert into public.tags (name, slug)
values
  ('Café', 'cafe'),
  ('Agroecología', 'agroecologia'),
  ('Seguridad Alimentaria', 'seguridad-alimentaria'),
  ('Cambio Climático', 'cambio-climatico'),
  ('Recursos Hídricos', 'recursos-hidricos'),
  ('Género e Inclusión', 'genero-e-inclusion'),
  ('Gobernanza', 'gobernanza'),
  ('Juventud', 'juventud'),
  ('Trazabilidad', 'trazabilidad'),
  ('Cartografía', 'cartografia')
on conflict (slug) do nothing;

create table if not exists public.library_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  summary text not null default '',
  content text not null default '',
  channel public.document_channel not null,
  document_type public.document_type_enum not null,
  country_scope public.country_scope_enum not null default 'trinacional',
  program public.program_enum,
  access_level public.access_level_enum not null default 'public',
  publishing_status public.document_status not null default 'borrador',
  author text not null default '',
  cooperante text not null default '',
  publication_date date not null default current_date,
  version text not null default '1',
  download_count integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  rejection_reason text,
  search_vector tsvector not null default ''::tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists library_documents_slug_uidx
  on public.library_documents (slug);

create index if not exists library_documents_status_idx
  on public.library_documents (publishing_status);

create index if not exists library_documents_channel_idx
  on public.library_documents (channel);

create index if not exists library_documents_pub_date_idx
  on public.library_documents (publication_date desc);

create index if not exists library_documents_created_by_idx
  on public.library_documents (created_by);

create index if not exists library_documents_search_idx
  on public.library_documents using gin (search_vector);

create table if not exists public.document_tags (
  document_id uuid not null references public.library_documents (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (document_id, tag_id)
);

create index if not exists document_tags_tag_idx
  on public.document_tags (tag_id);

create table if not exists public.library_document_files (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.library_documents (id) on delete cascade,
  slug text not null,
  kind public.library_file_kind not null default 'adjunto',
  file_path text not null,
  original_name text not null,
  mime_type text not null,
  file_size_bytes integer not null default 0,
  download_count integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists library_document_files_slug_uidx
  on public.library_document_files (slug);

create index if not exists library_document_files_document_idx
  on public.library_document_files (document_id, sort_order);

create or replace function public.library_slugify(raw text)
returns text
language plpgsql
stable
as $$
declare
  s text;
begin
  s := lower(unaccent(coalesce(raw, '')));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  if s is null or s = '' then
    s := 'documento';
  end if;
  return left(s, 80);
end;
$$;

create or replace function public.library_unique_document_slug(
  base text,
  exclude_id uuid default null
)
returns text
language plpgsql
as $$
declare
  candidate text;
  n integer := 1;
begin
  candidate := base;
  loop
    if not exists (
      select 1
      from public.library_documents d
      where d.slug = candidate
        and (exclude_id is null or d.id <> exclude_id)
    ) then
      return candidate;
    end if;
    n := n + 1;
    candidate := base || '-' || n::text;
  end loop;
end;
$$;

create or replace function public.library_unique_file_slug(
  base text,
  exclude_id uuid default null
)
returns text
language plpgsql
as $$
declare
  candidate text;
  n integer := 1;
begin
  candidate := base;
  loop
    if not exists (
      select 1
      from public.library_document_files f
      where f.slug = candidate
        and (exclude_id is null or f.id <> exclude_id)
    ) then
      return candidate;
    end if;
    n := n + 1;
    candidate := base || '-' || n::text;
  end loop;
end;
$$;

create or replace function public.library_documents_set_slug()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT'
    or new.title is distinct from old.title
    or new.slug is null
    or btrim(new.slug) = ''
  then
    new.slug := public.library_unique_document_slug(
      public.library_slugify(new.title),
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists library_documents_set_slug on public.library_documents;
create trigger library_documents_set_slug
  before insert or update of title, slug
  on public.library_documents
  for each row
  execute function public.library_documents_set_slug();

create or replace function public.library_document_files_set_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
begin
  if tg_op = 'INSERT'
    or new.original_name is distinct from old.original_name
    or new.slug is null
    or btrim(new.slug) = ''
  then
    base := public.library_slugify(
      regexp_replace(coalesce(new.original_name, 'archivo'), '\.[^.]+$', '')
    );
    new.slug := public.library_unique_file_slug(base, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists library_document_files_set_slug on public.library_document_files;
create trigger library_document_files_set_slug
  before insert or update of original_name, slug
  on public.library_document_files
  for each row
  execute function public.library_document_files_set_slug();

create or replace function public.library_rebuild_search_vector(doc_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tag_text text;
begin
  select coalesce(string_agg(t.name, ' '), '')
  into tag_text
  from public.document_tags dt
  join public.tags t on t.id = dt.tag_id
  where dt.document_id = doc_id;

  update public.library_documents d
  set search_vector =
    setweight(to_tsvector('spanish', coalesce(d.title, '')), 'A')
    || setweight(to_tsvector('spanish', coalesce(d.summary, '')), 'B')
    || setweight(to_tsvector('spanish', coalesce(tag_text, '')), 'C')
  where d.id = doc_id;
end;
$$;

create or replace function public.library_documents_set_search_vector()
returns trigger
language plpgsql
as $$
declare
  tag_text text;
begin
  select coalesce(string_agg(t.name, ' '), '')
  into tag_text
  from public.document_tags dt
  join public.tags t on t.id = dt.tag_id
  where dt.document_id = new.id;

  new.search_vector :=
    setweight(to_tsvector('spanish', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('spanish', coalesce(new.summary, '')), 'B')
    || setweight(to_tsvector('spanish', coalesce(tag_text, '')), 'C');
  return new;
end;
$$;

drop trigger if exists library_documents_set_search_vector on public.library_documents;
create trigger library_documents_set_search_vector
  before insert or update of title, summary
  on public.library_documents
  for each row
  execute function public.library_documents_set_search_vector();

create or replace function public.library_document_tags_refresh_parent()
returns trigger
language plpgsql
as $$
begin
  perform public.library_rebuild_search_vector(
    coalesce(new.document_id, old.document_id)
  );
  return null;
end;
$$;

drop trigger if exists library_document_tags_refresh_parent on public.document_tags;
create trigger library_document_tags_refresh_parent
  after insert or update or delete
  on public.document_tags
  for each row
  execute function public.library_document_tags_refresh_parent();

create or replace function public.library_documents_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists library_documents_set_updated_at on public.library_documents;
create trigger library_documents_set_updated_at
  before update on public.library_documents
  for each row
  execute function public.library_documents_set_updated_at();

create or replace function public.is_library_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(btrim(coalesce(p.rol, ''))) in ('admin', 'super')
  )
$$;

create or replace function public.library_document_is_public(doc public.library_documents)
returns boolean
language sql
immutable
as $$
  select
    doc.publishing_status = 'aprobado'
    and doc.access_level = 'public'
    and doc.channel <> 'normativo_interno'
$$;

create or replace function public.search_library_documents(
  p_query text default null,
  p_channel public.document_channel default null,
  p_tag_slugs text[] default null,
  p_country public.country_scope_enum default null,
  p_program public.program_enum default null,
  p_sort text default 'fecha_desc',
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  summary text,
  channel public.document_channel,
  document_type public.document_type_enum,
  country_scope public.country_scope_enum,
  program public.program_enum,
  author text,
  cooperante text,
  publication_date date,
  download_count integer,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  q tsquery;
  lim integer;
  off integer;
begin
  lim := greatest(1, least(coalesce(p_limit, 12), 50));
  off := greatest(0, coalesce(p_offset, 0));
  if p_query is not null and btrim(p_query) <> '' then
    q := plainto_tsquery('spanish', p_query);
  else
    q := null;
  end if;

  return query
  with filtered as (
    select d.*
    from public.library_documents d
    where (p_channel is null or d.channel = p_channel)
      and (p_country is null or d.country_scope = p_country)
      and (p_program is null or d.program = p_program)
      and (
        q is null
        or d.search_vector @@ q
      )
      and (
        p_tag_slugs is null
        or cardinality(p_tag_slugs) = 0
        or exists (
          select 1
          from public.document_tags dt
          join public.tags t on t.id = dt.tag_id
          where dt.document_id = d.id
            and t.slug = any (p_tag_slugs)
        )
      )
  )
  select
    f.id,
    f.slug,
    f.title,
    f.summary,
    f.channel,
    f.document_type,
    f.country_scope,
    f.program,
    f.author,
    f.cooperante,
    f.publication_date,
    f.download_count,
    f.created_at,
    count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'fecha_desc' then f.publication_date end desc nulls last,
    case when p_sort = 'fecha_asc' then f.publication_date end asc nulls last,
    case when p_sort = 'titulo_asc' then f.title end asc,
    case when p_sort = 'titulo_desc' then f.title end desc,
    case when p_sort = 'autor_asc' then f.author end asc,
    case when p_sort = 'cooperante_asc' then f.cooperante end asc,
    case when p_sort = 'descargas_desc' then f.download_count end desc,
    f.publication_date desc,
    f.title asc
  limit lim
  offset off;
end;
$$;

create or replace function public.register_library_download(file_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  file_row public.library_document_files%rowtype;
  doc public.library_documents%rowtype;
begin
  select *
  into file_row
  from public.library_document_files f
  where f.slug = file_slug;

  if not found then
    return;
  end if;

  select *
  into doc
  from public.library_documents d
  where d.id = file_row.document_id;

  if not found then
    return;
  end if;

  if not (
    (
      doc.publishing_status = 'aprobado'
      and doc.access_level = 'public'
      and doc.channel <> 'normativo_interno'
    )
    or doc.created_by = auth.uid()
    or public.is_library_admin()
  ) then
    return;
  end if;

  update public.library_document_files
  set download_count = download_count + 1
  where id = file_row.id;

  update public.library_documents
  set download_count = download_count + 1
  where id = doc.id;
end;
$$;

grant execute on function public.search_library_documents(
  text,
  public.document_channel,
  text[],
  public.country_scope_enum,
  public.program_enum,
  text,
  integer,
  integer
) to anon, authenticated;

grant execute on function public.register_library_download(text) to anon, authenticated;

alter table public.tags enable row level security;
alter table public.library_documents enable row level security;
alter table public.document_tags enable row level security;
alter table public.library_document_files enable row level security;

drop policy if exists tags_select_all on public.tags;
create policy tags_select_all
  on public.tags
  for select
  to anon, authenticated
  using (true);

drop policy if exists tags_insert_admin on public.tags;
create policy tags_insert_admin
  on public.tags
  for insert
  to authenticated
  with check (public.is_library_admin());

drop policy if exists library_documents_select_public on public.library_documents;
create policy library_documents_select_public
  on public.library_documents
  for select
  to anon, authenticated
  using (
    publishing_status = 'aprobado'
    and access_level = 'public'
    and channel <> 'normativo_interno'
  );

drop policy if exists library_documents_select_own on public.library_documents;
create policy library_documents_select_own
  on public.library_documents
  for select
  to authenticated
  using (created_by = auth.uid() or public.is_library_admin());

drop policy if exists library_documents_insert_auth on public.library_documents;
create policy library_documents_insert_auth
  on public.library_documents
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and publishing_status in ('borrador', 'en_revision')
  );

drop policy if exists library_documents_update_own on public.library_documents;
create policy library_documents_update_own
  on public.library_documents
  for update
  to authenticated
  using (
    created_by = auth.uid()
    and publishing_status in ('borrador', 'rechazado', 'en_revision')
  )
  with check (
    created_by = auth.uid()
    and publishing_status in ('borrador', 'en_revision')
  );

drop policy if exists library_documents_update_admin on public.library_documents;
create policy library_documents_update_admin
  on public.library_documents
  for update
  to authenticated
  using (public.is_library_admin())
  with check (public.is_library_admin());

drop policy if exists library_documents_delete_own on public.library_documents;
create policy library_documents_delete_own
  on public.library_documents
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    and publishing_status <> 'aprobado'
  );

drop policy if exists library_documents_delete_admin on public.library_documents;
create policy library_documents_delete_admin
  on public.library_documents
  for delete
  to authenticated
  using (public.is_library_admin());

drop policy if exists document_tags_select on public.document_tags;
create policy document_tags_select
  on public.document_tags
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.library_documents d
      where d.id = document_id
    )
  );

drop policy if exists document_tags_mutate_own on public.document_tags;
create policy document_tags_mutate_own
  on public.document_tags
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.library_documents d
      where d.id = document_id
        and (
          public.is_library_admin()
          or (
            d.created_by = auth.uid()
            and d.publishing_status in ('borrador', 'rechazado', 'en_revision')
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.library_documents d
      where d.id = document_id
        and (
          public.is_library_admin()
          or (
            d.created_by = auth.uid()
            and d.publishing_status in ('borrador', 'rechazado', 'en_revision')
          )
        )
    )
  );

drop policy if exists library_document_files_select on public.library_document_files;
create policy library_document_files_select
  on public.library_document_files
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.library_documents d
      where d.id = document_id
    )
  );

drop policy if exists library_document_files_mutate_own on public.library_document_files;
create policy library_document_files_mutate_own
  on public.library_document_files
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.library_documents d
      where d.id = document_id
        and (
          public.is_library_admin()
          or (
            d.created_by = auth.uid()
            and d.publishing_status in ('borrador', 'rechazado', 'en_revision')
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.library_documents d
      where d.id = document_id
        and (
          public.is_library_admin()
          or (
            d.created_by = auth.uid()
            and d.publishing_status in ('borrador', 'rechazado', 'en_revision')
          )
        )
    )
  );

insert into storage.buckets (id, name, public, file_size_limit)
values ('repositorio-documentos', 'repositorio-documentos', false, 26214400)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

drop policy if exists repositorio_documentos_select on storage.objects;
create policy repositorio_documentos_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'repositorio-documentos'
    and (
      public.is_library_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists repositorio_documentos_insert on storage.objects;
create policy repositorio_documentos_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'repositorio-documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists repositorio_documentos_update on storage.objects;
create policy repositorio_documentos_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'repositorio-documentos'
    and (
      public.is_library_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'repositorio-documentos'
    and (
      public.is_library_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists repositorio_documentos_delete on storage.objects;
create policy repositorio_documentos_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'repositorio-documentos'
    and (
      public.is_library_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
