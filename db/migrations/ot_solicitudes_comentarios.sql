alter table public.ot_solicitudes
  add column if not exists comentarios text;

comment on column public.ot_solicitudes.comentarios is
  'Motivo u observaciones al rechazar la solicitud (estado RECHAZADA).';
