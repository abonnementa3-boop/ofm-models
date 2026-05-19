# OFM Models — Portail Modèles

Portail web mobile-first pour les modèles de l'agence OFM. Chaque modèle se connecte avec son email (magic link), accède à son contrat, sa fiche persona et sa todolist.

Backend partagé avec le CRM admin V2 (`crm-ofm-v2`) via la même base Supabase.

## Démarrage local

```bash
npm install
cp .env.example .env.local
# Édite .env.local avec les credentials Supabase V2
npm run dev
# → http://localhost:5176
```

## Setup Supabase (à faire une fois)

1. Exécute `supabase/portal_schema.sql` dans le SQL Editor de la base V2 (en plus du schéma CRM)
2. Dans le dashboard Supabase → Authentication → Providers → **Email** :
   - Active "Email" si pas déjà fait
   - "Confirm email" : OFF (pour que le magic link logge direct)
3. Authentication → URL Configuration :
   - Site URL : `https://ofm-models.vercel.app` (en prod) ou `http://localhost:5176` (dev)
   - Redirect URLs : ajoute `http://localhost:5176/auth/callback` et `https://ofm-models.vercel.app/auth/callback`
4. Authentication → Email Templates → Magic Link : personnalise le mail si tu veux

## Liaison modèle ↔ user (workflow)

Côté CRM admin (V2) :
1. Tu renseignes `portal_email` sur la modèle
2. Tu cliques "Inviter au portail" (à implémenter en session +2)
3. Le CRM crée un user via service_role + UPDATE `models.auth_user_id`
4. La modèle reçoit le magic link et entre dans son espace

Tant que `auth_user_id` n'est pas posé, la modèle qui se connecte voit "Compte non lié".

## Architecture

- **Auth** : Supabase magic link (`supabase.auth.signInWithOtp`)
- **DB / Storage** : Supabase (mutualisé avec CRM)
- **RLS** : `anon` voit tout (admin CRM) — `authenticated` filtré par `auth_user_id` (modèle)
- **Storage path** : `portal-uploads/{model_id}/{category}/{filename}`

## Roadmap

- [x] Session 1 : SQL + init projet + Login + Home stub
- [ ] Session 2 : Page Contrat (download + upload signé)
- [ ] Session 3 : Page Persona (formulaire)
- [ ] Session 4 : Page Todolist + côté CRM (bouton "Inviter au portail" + badges)
- [ ] Session 5 : Uploads (reels Insta, photos X, contenu SM par ville)
