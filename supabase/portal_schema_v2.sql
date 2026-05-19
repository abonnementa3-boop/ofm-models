-- ===========================
-- Portail Modèles — Migration v2 (2026-05-18)
-- À exécuter dans Supabase > SQL Editor
-- ===========================

-- 1. Validation admin du contrat signé (NULL = pas encore validé par l'agence)
ALTER TABLE models ADD COLUMN IF NOT EXISTS contract_validated_at TIMESTAMPTZ;
ALTER TABLE models ADD COLUMN IF NOT EXISTS contract_validated_by UUID REFERENCES profiles(id);

-- 2. RLS sur model_accounts : la modèle peut lire/écrire SES comptes (OF/MYM/Skrill)
ALTER TABLE model_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "model rw own accounts" ON model_accounts;
CREATE POLICY "model rw own accounts" ON model_accounts FOR ALL TO authenticated
  USING (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()))
  WITH CHECK (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()));

-- 3. RLS sur model_documents : la modèle peut lire SES documents (pour récupérer le contrat préparé)
ALTER TABLE model_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "model read own documents" ON model_documents;
CREATE POLICY "model read own documents" ON model_documents FOR SELECT TO authenticated
  USING (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()));

-- 4. Storage : la modèle peut LIRE le bucket model-documents pour télécharger son contrat préparé
DROP POLICY IF EXISTS "model read own model-documents" ON storage.objects;
CREATE POLICY "model read own model-documents" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'model-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM models WHERE auth_user_id = auth.uid()
    )
  );

-- Indices utiles
CREATE INDEX IF NOT EXISTS idx_models_contract_validated_at ON models(contract_validated_at);
