-- Slug legible en URL para asist_actividades (ej. presentacion-de-avances-ot-agosto)

alter table public.asist_actividades
  add column if not exists slug text;

create unique index if not exists asist_actividades_slug_uidx
  on public.asist_actividades (slug)
  where slug is not null;
