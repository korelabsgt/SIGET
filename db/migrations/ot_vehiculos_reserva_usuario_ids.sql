-- Varios usuarios por vehículo en RESERVA_INDIVIDUAL (mín. 2 en aplicación). Idempotente.

ALTER TABLE ot_vehiculos
  ADD COLUMN IF NOT EXISTS reserva_usuario_ids uuid[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ot_vehiculos'
      AND column_name = 'reserva_usuario_id'
  ) THEN
    UPDATE ot_vehiculos
    SET reserva_usuario_ids = ARRAY[reserva_usuario_id]
    WHERE reserva_usuario_id IS NOT NULL
      AND cardinality(reserva_usuario_ids) = 0;
  END IF;
END $$;
