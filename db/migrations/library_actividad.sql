alter table public.library_documents
  add column if not exists actividad jsonb not null default '[]'::jsonb;

update public.library_documents d
set actividad = jsonb_build_array(
  jsonb_build_object(
    'accion', 'creacion',
    'user_id', d.created_by,
    'nombre', coalesce((select p.nombre from public.profiles p where p.id = d.created_by), ''),
    'at', d.created_at
  )
)
where d.actividad = '[]'::jsonb;
