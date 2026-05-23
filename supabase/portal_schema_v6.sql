-- ===========================
-- Manager access via profiles — Migration v6 (2026-05-20)
-- Utilise la table profiles existante (role IN manager/admin/agency)
-- ===========================

-- 1. Permettre aux managers de lire la liste des modèles (dropdown)
DROP POLICY IF EXISTS "managers_select_all_models" ON models;
CREATE POLICY "managers_select_all_models" ON models
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('manager', 'admin', 'agency')
    )
  );

-- 2. GRANT profiles en lecture pour le rôle authenticated (portail mobile)
GRANT SELECT ON profiles TO authenticated;

-- 3. metachange_jobs : les managers voient tous les jobs
DROP POLICY IF EXISTS "models_select_own_jobs" ON metachange_jobs;
CREATE POLICY "models_select_own_jobs" ON metachange_jobs
  FOR SELECT USING (
    model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid())
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('manager', 'admin', 'agency')
    )
  );

-- 4. metachange_jobs : les managers peuvent insérer pour n'importe quelle modèle
DROP POLICY IF EXISTS "models_insert_own_jobs" ON metachange_jobs;
CREATE POLICY "models_or_managers_insert_jobs" ON metachange_jobs
  FOR INSERT WITH CHECK (
    model_id IN (SELECT id FROM models WHERE auth_user_id = auth.uid())
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('manager', 'admin', 'agency')
    )
  );
