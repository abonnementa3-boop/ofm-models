-- ===========================
-- Portail Modèles — Schema SQL
-- À exécuter dans Supabase > SQL Editor de la base V2 (mutualisée avec le CRM)
-- ===========================
-- Architecture sécurité :
--   - Le CRM admin (Kylian) utilise la clé anon SANS auth → rôle `anon` → voit tout
--   - La modèle se logge via magic link → rôle `authenticated` → ne voit QUE ses données
--     via auth.uid() = models.auth_user_id
-- ===========================

-- 1. Liaison modèle ↔ user portail
ALTER TABLE models ADD COLUMN IF NOT EXISTS portal_email TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_models_auth_user_id ON models(auth_user_id);

-- 2. Tâches assignées à la modèle (sa todolist vue depuis le portail)
CREATE TABLE IF NOT EXISTS model_portal_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                -- 'sm_city', 'instagram_reel', 'photo_x', 'persona', 'contract', ...
  pdf_url TEXT,                 -- lien Drive du PDF associé (briefing SM par ex.)
  reference_url TEXT,           -- lien d'un reel à reproduire, etc.
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  done_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB,               -- city, @sexemodel handle, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portal_tasks_model ON model_portal_tasks(model_id);

-- 3. Réponses au formulaire persona
CREATE TABLE IF NOT EXISTS model_persona_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE UNIQUE,
  responses JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Signature de contrat (PDF signé uploadé via Markup iPhone)
CREATE TABLE IF NOT EXISTS model_contract_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE UNIQUE,
  storage_path TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  file_size INT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Uploads génériques liés aux tâches (reels Insta, photos X, contenu SM par ville…)
CREATE TABLE IF NOT EXISTS model_portal_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  task_id UUID REFERENCES model_portal_tasks(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  label TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size INT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portal_uploads_model ON model_portal_uploads(model_id);
CREATE INDEX IF NOT EXISTS idx_portal_uploads_task ON model_portal_uploads(task_id);

-- 6. Bucket Storage portail
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-uploads', 'portal-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- RLS
-- ===========================

ALTER TABLE model_portal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_persona_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_portal_uploads ENABLE ROW LEVEL SECURITY;

-- Admin (anon) : tout
DROP POLICY IF EXISTS "admin rw portal_tasks" ON model_portal_tasks;
DROP POLICY IF EXISTS "admin rw persona_resp" ON model_persona_responses;
DROP POLICY IF EXISTS "admin rw contract_sig" ON model_contract_signatures;
DROP POLICY IF EXISTS "admin rw portal_uploads" ON model_portal_uploads;

CREATE POLICY "admin rw portal_tasks"   ON model_portal_tasks         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "admin rw persona_resp"   ON model_persona_responses    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "admin rw contract_sig"   ON model_contract_signatures  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "admin rw portal_uploads" ON model_portal_uploads       FOR ALL TO anon USING (true) WITH CHECK (true);

-- Modèle (authenticated) : seulement ses lignes (model_id rattaché à son auth_user_id)
DROP POLICY IF EXISTS "model rw own portal_tasks" ON model_portal_tasks;
DROP POLICY IF EXISTS "model rw own persona_resp" ON model_persona_responses;
DROP POLICY IF EXISTS "model rw own contract_sig" ON model_contract_signatures;
DROP POLICY IF EXISTS "model rw own portal_uploads" ON model_portal_uploads;

CREATE POLICY "model rw own portal_tasks" ON model_portal_tasks FOR ALL TO authenticated
  USING (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()))
  WITH CHECK (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()));
CREATE POLICY "model rw own persona_resp" ON model_persona_responses FOR ALL TO authenticated
  USING (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()))
  WITH CHECK (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()));
CREATE POLICY "model rw own contract_sig" ON model_contract_signatures FOR ALL TO authenticated
  USING (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()))
  WITH CHECK (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()));
CREATE POLICY "model rw own portal_uploads" ON model_portal_uploads FOR ALL TO authenticated
  USING (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()))
  WITH CHECK (model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid()));

-- Sur la table models : la modèle peut lire SA fiche, pas la modifier
DROP POLICY IF EXISTS "model read own model" ON models;
CREATE POLICY "model read own model" ON models FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- ===========================
-- Storage bucket policy
-- ===========================
-- Le chemin d'un fichier portail est de la forme : {model_id}/{category}/{filename.ext}
-- → la modèle ne peut lire/écrire que dans son dossier {model_id}/

DROP POLICY IF EXISTS "anon rw portal-uploads" ON storage.objects;
DROP POLICY IF EXISTS "model rw own portal-uploads" ON storage.objects;

CREATE POLICY "anon rw portal-uploads" ON storage.objects FOR ALL TO anon
  USING (bucket_id = 'portal-uploads')
  WITH CHECK (bucket_id = 'portal-uploads');

CREATE POLICY "model rw own portal-uploads" ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'portal-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM models WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'portal-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM models WHERE auth_user_id = auth.uid()
    )
  );

-- ===========================
-- GRANT
-- ===========================
GRANT ALL ON model_portal_tasks       TO anon, authenticated;
GRANT ALL ON model_persona_responses  TO anon, authenticated;
GRANT ALL ON model_contract_signatures TO anon, authenticated;
GRANT ALL ON model_portal_uploads     TO anon, authenticated;
