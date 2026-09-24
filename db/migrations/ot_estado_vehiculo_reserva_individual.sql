-- Añade RESERVA_INDIVIDUAL al ENUM estado_vehiculo (ot_vehiculos.estado). Idempotente.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'estado_vehiculo'
      AND e.enumlabel = 'RESERVA_INDIVIDUAL'
  ) THEN
    ALTER TYPE estado_vehiculo ADD VALUE 'RESERVA_INDIVIDUAL';
  END IF;
END $$;
