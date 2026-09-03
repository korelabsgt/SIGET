-- Histórico. Ya aplicado cuando la tabla se llamaba asist_actividades.
-- No ejecutar. El slug vive en act_actividades.

-- Slug legible en URL (ej. presentacion-de-avances-ot-agosto)

alter table public.asist_actividades
  add column if not exists slug text;

create unique index if not exists asist_actividades_slug_uidx
  on public.asist_actividades (slug)
  where slug is not null;
