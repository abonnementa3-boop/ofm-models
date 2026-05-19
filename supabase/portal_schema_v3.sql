-- ===========================
-- Portail Modèles — Migration v3 (2026-05-18)
-- Auto-link : quand une modèle se logge pour la première fois,
-- on rattache automatiquement son auth_user_id à la row models
-- où personal_email ou portal_email correspond à son email Supabase Auth.
-- ===========================

-- Fonction RPC appelée par le portail après connexion
-- SECURITY DEFINER = s'exécute avec les droits du propriétaire (postgres),
-- contournant le RLS pour pouvoir écrire auth_user_id même si la modèle
-- n'est pas encore liée à la row.
CREATE OR REPLACE FUNCTION link_model_to_auth_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_model_id uuid;
BEGIN
  -- Récupérer l'email du user connecté
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- Chercher une row models non encore liée avec cet email
  SELECT id INTO v_model_id
  FROM models
  WHERE auth_user_id IS NULL
    AND (
      portal_email = v_user_email
      OR personal_email = v_user_email
    )
  LIMIT 1;

  IF v_model_id IS NULL THEN
    -- Pas de modèle à lier (déjà liée, ou email inconnu)
    RETURN json_build_object('ok', false, 'error', 'no_model_found');
  END IF;

  -- Lier
  UPDATE models
  SET auth_user_id = auth.uid(), updated_at = NOW()
  WHERE id = v_model_id;

  RETURN json_build_object('ok', true, 'model_id', v_model_id);
END;
$$;

GRANT EXECUTE ON FUNCTION link_model_to_auth_user TO authenticated;

-- Index sur portal_email pour les lookups rapides
CREATE INDEX IF NOT EXISTS idx_models_portal_email ON models(portal_email);
