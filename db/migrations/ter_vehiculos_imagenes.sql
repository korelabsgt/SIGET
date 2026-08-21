alter table public.ter_vehiculos
  add column if not exists imagenes jsonb not null default '[]'::jsonb;

update public.ter_vehiculos
set imagenes = jsonb_build_array(imagen_url)
where imagen_url is not null
  and btrim(imagen_url) <> ''
  and (imagenes = '[]'::jsonb or jsonb_array_length(imagenes) = 0);
