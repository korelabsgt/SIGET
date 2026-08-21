INSERT INTO storage.buckets (id, name, public)
VALUES ('vehiculos', 'vehiculos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "vehiculos autenticado all" ON storage.objects;
CREATE POLICY "vehiculos autenticado all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'vehiculos')
  WITH CHECK (bucket_id = 'vehiculos');
