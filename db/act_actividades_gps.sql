alter table public.act_actividades
  add column if not exists latitud double precision,
  add column if not exists longitud double precision,
  add column if not exists gps_precision_m double precision,
  add column if not exists gps_captured_at timestamptz;

alter table public.act_actividades
  drop constraint if exists act_actividades_latitud_chk;
alter table public.act_actividades
  add constraint act_actividades_latitud_chk
  check (latitud is null or (latitud >= -90 and latitud <= 90));

alter table public.act_actividades
  drop constraint if exists act_actividades_longitud_chk;
alter table public.act_actividades
  add constraint act_actividades_longitud_chk
  check (longitud is null or (longitud >= -180 and longitud <= 180));
