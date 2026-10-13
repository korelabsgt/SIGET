-- Visitas del repositorio público (noticias, científico y educativo).
-- Las descargas ya viven en library_documents.download_count
-- y library_document_files.download_count (register_library_download).
-- Pegar en el SQL Editor de Supabase.

alter table public.library_documents
  add column if not exists view_count integer not null default 0;

drop function if exists public.search_library_documents(
  text,
  public.document_channel,
  text[],
  public.country_scope_enum,
  public.program_enum,
  text,
  integer,
  integer
);

create function public.search_library_documents(
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
  view_count integer,
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
    f.view_count,
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

create or replace function public.register_library_view(doc_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  update public.library_documents
  set view_count = view_count + 1
  where slug = btrim(doc_slug)
    and publishing_status = 'aprobado'
    and access_level = 'public'
    and channel in ('noticia', 'cientifico', 'educativo')
  returning view_count into next_count;

  return coalesce(next_count, 0);
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

grant execute on function public.register_library_view(text) to anon, authenticated;
