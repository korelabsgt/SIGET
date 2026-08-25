-- Reemplaza checklist_pre / checklist_post por comentarios múltiples (jsonb).

alter table public.ter_bitacoras
  add column if not exists comentarios jsonb not null default '[]'::jsonb;

comment on column public.ter_bitacoras.comentarios is
  'Comentarios del viaje (jsonb). Autor implícito en conductor_id de la bitácora. Ej: [{"id":"uuid","texto":"...","fecha":"timestamptz"}]';

alter table public.ter_bitacoras
  drop column if exists checklist_pre,
  drop column if exists checklist_post;
