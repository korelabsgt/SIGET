-- Servicio por km: contar desde último servicio (odómetro de referencia), no desde cero absoluto.

ALTER TABLE ot_vehiculos
  ADD COLUMN IF NOT EXISTS km_referencia_servicio integer;

UPDATE ot_vehiculos
SET km_referencia_servicio = kilometraje_actual
WHERE km_referencia_servicio IS NULL;

ALTER TABLE ot_vehiculos
  ALTER COLUMN km_referencia_servicio SET DEFAULT 0;

UPDATE ot_vehiculos
SET km_referencia_servicio = 0
WHERE km_referencia_servicio IS NULL;

ALTER TABLE ot_vehiculos
  ALTER COLUMN km_referencia_servicio SET NOT NULL;

COMMENT ON COLUMN ot_vehiculos.km_referencia_servicio IS
  'Odómetro al último servicio solventado; próximo forzado = referencia + 5500 km (5000+500).';
