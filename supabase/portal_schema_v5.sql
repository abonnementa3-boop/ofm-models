-- ===========================
-- MetaChange remote job queue — Migration v5 (2026-05-20)
-- Table metachange_jobs + RLS pour le portail modèles
-- ===========================

-- 1. Table des jobs de traitement distant
CREATE TABLE IF NOT EXISTS metachange_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id    UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','processing','done','error')),
  input_url   TEXT NOT NULL,
  result_url  TEXT,
  config      JSONB DEFAULT '{}',
  count       INT  DEFAULT 1,
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour les requêtes temps-réel
CREATE INDEX IF NOT EXISTS metachange_jobs_status_idx    ON metachange_jobs (status);
CREATE INDEX IF NOT EXISTS metachange_jobs_model_id_idx  ON metachange_jobs (model_id);
CREATE INDEX IF NOT EXISTS metachange_jobs_created_idx   ON metachange_jobs (created_at DESC);

-- 3. RLS : les modèles voient et insèrent uniquement leurs propres jobs
ALTER TABLE metachange_jobs ENABLE ROW LEVEL SECURITY;

-- Le CRM (service role) bypass le RLS → peut tout faire.
-- Le portail modèles (anon/authenticated) suit les règles ci-dessous.

-- SELECT : une modèle voit ses propres jobs
DROP POLICY IF EXISTS "models_select_own_jobs" ON metachange_jobs;
CREATE POLICY "models_select_own_jobs" ON metachange_jobs
  FOR SELECT USING (
    model_id IN (
      SELECT id FROM models WHERE auth_user_id = auth.uid()
    )
  );

-- INSERT : une modèle peut créer un job en son nom
DROP POLICY IF EXISTS "models_insert_own_jobs" ON metachange_jobs;
CREATE POLICY "models_insert_own_jobs" ON metachange_jobs
  FOR INSERT WITH CHECK (
    model_id IN (
      SELECT id FROM models WHERE auth_user_id = auth.uid()
    )
  );

-- UPDATE : le portail modèle ne peut PAS modifier (seul le service role/CRM peut)
-- Pas de policy UPDATE pour authenticated → seul le service role met à jour status/result_url

-- 4. GRANT nécessaires pour le rôle anon/authenticated
GRANT SELECT, INSERT ON metachange_jobs TO anon, authenticated;

-- 5. Activer Realtime sur la table (pour que le CRM et le portail reçoivent les updates)
ALTER PUBLICATION supabase_realtime ADD TABLE metachange_jobs;

-- ===========================
-- Storage bucket "metachange" (si pas encore créé)
-- À faire dans Supabase Dashboard > Storage > New bucket :
--   Name: metachange
--   Public: YES (pour que les URLs publiques fonctionnent)
-- ===========================

-- Policies Storage (à exécuter après création du bucket via Dashboard) :
-- Politique 1 : les modèles authentifiées peuvent uploader dans uploads/{leur_model_id}/
INSERT INTO storage.policies (name, bucket_id, definition, operation)
SELECT
  'models_upload_own',
  id,
  '(bucket_id = ''metachange'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = ''uploads'' AND (storage.foldername(name))[2] IN (SELECT id::text FROM models WHERE auth_user_id = auth.uid()))',
  'INSERT'
FROM storage.buckets WHERE name = 'metachange'
ON CONFLICT DO NOTHING;

-- Politique 2 : lecture publique (bucket est public → pas besoin de policy explicite)
