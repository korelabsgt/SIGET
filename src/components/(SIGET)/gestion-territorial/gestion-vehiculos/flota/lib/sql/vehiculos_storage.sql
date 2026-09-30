-- Bucket único de gestión vehicular. Carpetas por prefijo de ruta:
--   flota/{placa}/ — fotos de unidad y tarjeta de circulación por vehículo
--   fallas/{placa}/{YYYY-MM-DD}/ — evidencia de averías (mantenimiento)
--   recibos/{placa}/{YYYY-MM-DD}/ — recibo de combustible en bitácora
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehiculos', 'vehiculos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "vehiculos autenticado all" ON storage.objects;
CREATE POLICY "vehiculos autenticado all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'vehiculos')
  WITH CHECK (bucket_id = 'vehiculos');
