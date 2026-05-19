-- Fix : RLS model_documents manquait la policy anon (admin CRM)
-- portal_schema_v2.sql activait le RLS mais ne donnait les droits qu'à authenticated

DROP POLICY IF EXISTS "admin rw model_documents" ON model_documents;
CREATE POLICY "admin rw model_documents" ON model_documents
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

GRANT ALL ON model_documents TO anon, authenticated;
