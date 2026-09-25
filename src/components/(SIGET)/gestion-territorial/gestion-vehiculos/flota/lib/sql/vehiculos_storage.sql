-- Bucket único de gestión vehicular. Carpetas por prefijo de ruta:
--   flota/   — fotos de unidad y tarjeta de circulación
--   fallas/  — evidencia de averías (mantenimiento)
--   recibos/ — recibo o evidencia fotográfica de bitácora de viaje
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehiculos', 'vehiculos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "vehiculos autenticado all" ON storage.objects;
CREATE POLICY "vehiculos autenticado all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'vehiculos')
  WITH CHECK (bucket_id = 'vehiculos');
