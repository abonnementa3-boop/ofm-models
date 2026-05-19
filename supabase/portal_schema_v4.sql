-- ===========================
-- Portail Modèles — Migration v4 (2026-05-18)
-- Validation admin + ville + traductions auto
-- ===========================

-- 1. Nouveaux statuts : pending_validation (modèle dit "fait") + validated (admin approuve)
ALTER TABLE model_portal_tasks
  DROP CONSTRAINT IF EXISTS model_portal_tasks_status_check;
ALTER TABLE model_portal_tasks
  ADD CONSTRAINT model_portal_tasks_status_check
  CHECK (status IN ('todo','in_progress','pending_validation','done','validated'));

-- 2. Champ ville (pour tâches SM, Reel, etc.)
ALTER TABLE model_portal_tasks ADD COLUMN IF NOT EXISTS city TEXT;

-- 3. Colonnes traduction (titre + description EN et ES stockés après l'appel Claude)
ALTER TABLE model_portal_tasks ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE model_portal_tasks ADD COLUMN IF NOT EXISTS title_es TEXT;
ALTER TABLE model_portal_tasks ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE model_portal_tasks ADD COLUMN IF NOT EXISTS description_es TEXT;

-- 4. Raison du rejet (quand admin rejette une tâche)
ALTER TABLE model_portal_tasks ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
