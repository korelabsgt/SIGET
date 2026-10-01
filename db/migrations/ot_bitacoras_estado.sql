do $$
begin
  if not exists (select 1 from pg_type where typname = 'ot_estado_bitacora') then
    create type public.ot_estado_bitacora as enum ('PENDIENTE', 'CONFIRMADA');
  end if;
end
$$;

alter table public.ot_bitacoras
  add column if not exists estado public.ot_estado_bitacora not null default 'CONFIRMADA';

comment on column public.ot_bitacoras.estado is
  'PENDIENTE: registro abierto al iniciar misión; CONFIRMADA: bitácora cerrada con datos finales.';
