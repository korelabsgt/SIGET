alter table public.ot_bitacoras
  add column if not exists evidencia_url text[] not null default '{}'::text[];

comment on column public.ot_bitacoras.evidencia_url is
  'Rutas relativas en bucket storage vehiculos (carpeta recibos/). Una imagen por registro.';
