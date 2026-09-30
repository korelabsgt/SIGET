-- Diagnóstico: flota EN_MANTENIMIENTO vs averías (SQL Editor Supabase)

SELECT COUNT(*) AS total_ot_fallas FROM ot_fallas_mantenimiento;

SELECT id, placa, estado
FROM ot_vehiculos
WHERE estado = 'EN_MANTENIMIENTO'
ORDER BY placa;

SELECT f.id, f.estado, f.severidad, f.created_at::date AS dia, v.placa
FROM ot_fallas_mantenimiento f
JOIN ot_vehiculos v ON v.id = f.vehiculo_id
WHERE f.estado IN ('PENDIENTE', 'EN_REPARACION')
ORDER BY f.created_at DESC;

SELECT v.placa, v.estado
FROM ot_vehiculos v
WHERE v.estado = 'EN_MANTENIMIENTO'
  AND NOT EXISTS (
    SELECT 1
    FROM ot_fallas_mantenimiento f
    WHERE f.vehiculo_id = v.id
      AND f.estado IN ('PENDIENTE', 'EN_REPARACION')
  );

-- Si aún existe ter_fallas_mantenimiento con datos y ot_ vacío, migrar:
-- INSERT INTO ot_fallas_mantenimiento SELECT * FROM ter_fallas_mantenimiento ON CONFLICT DO NOTHING;
