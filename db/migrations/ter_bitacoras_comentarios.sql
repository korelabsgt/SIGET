-- Reemplaza checklist_pre / checklist_post por comentarios múltiples (jsonb).

alter table public.ot_bitacoras
  add column if not exists comentarios jsonb not null default '[]'::jsonb;

comment on column public.ot_bitacoras.comentarios is
  'Comentarios del viaje (jsonb). Autor implícito en conductor_id de la bitácora. Ej: [{"id":"uuid","texto":"...","fecha":"timestamptz"}]';

alter table public.ot_bitacoras
  drop column if exists checklist_pre,
  drop column if exists checklist_post;
