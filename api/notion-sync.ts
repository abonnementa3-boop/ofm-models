/**
 * API Route — POST /api/notion-sync
 * Crée ou met à jour une page Notion pour la fiche persona d'une modèle.
 *
 * Body JSON :
 *   { modelId, modelName, responses }
 *
 * Env vars requises (Vercel) :
 *   NOTION_TOKEN          → ntn_xxxxxx   (Internal Integration Secret)
 *   NOTION_PARENT_PAGE_ID → 6fe995b7...  (ID de la page parente dans Notion)
 *   SUPABASE_URL          → https://...  (pour sauvegarder le notion_page_id)
 *   SUPABASE_SERVICE_KEY  → eyJ...       (service role key, bypass RLS)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

// ─── Sections de la persona (doit rester en sync avec personaQuestions.ts) ───
const SECTION_LABELS: Record<string, string> = {
  personal_info:     '👤 Infos personnelles',
  platform_access:   '🔐 Accès plateformes',
  identity_physical: '💄 Identité & physique',
  preferences:       '❤️ Goûts & préférences',
  personal_details:  '🧩 En savoir plus',
  sexuality:         '🔥 Sexualité & contenu',
}

// Clés à ne pas afficher dans Notion (internes)
const SKIP_KEYS = new Set(['__notion_page_id'])

// ─── Helper Notion API ─────────────────────────────────────────────────────────
async function notionFetch(path: string, method: string, body?: object) {
  const token = process.env.NOTION_TOKEN
  if (!token) throw new Error('NOTION_TOKEN manquant')

  const res = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API ${method} ${path} → ${res.status}: ${err}`)
  }
  return res.json()
}

// ─── Construit les blocs Notion depuis les réponses ───────────────────────────
function buildBlocks(responses: Record<string, any>): object[] {
  const blocks: object[] = []

  // Regrouper les clés par section
  const sectionKeys: Record<string, string[]> = {
    personal_info:     ['info_first_name','info_last_name','info_phone','info_email','info_birthday'],
    platform_access:   ['cred_of_login','cred_of_password','cred_mym_login','cred_mym_password','cred_skrill_email','cred_skrill_password'],
    identity_physical: ['origin','age','birth_date','zodiac','marital_status','has_children','height','weight','measurements','bra_size','pants_size','tshirt_size','shoe_size','natural_hair_color','eye_color','sport','sexual_orientation'],
    preferences:       ['favorite_book','favorite_movie','favorite_color','favorite_dish','favorite_car','favorite_music','best_trip','favorite_brand'],
    personal_details:  ['drinks_alcohol','smokes','parties','ideal_man_age','plays_instrument','dream_destination','ideal_date','hobbies','sports_liked','has_pet','siblings','dream','has_driving_license','current_car','current_phone','worst_flaw','best_quality','professional_project','fun_fact'],
    sexuality:         ['anal_sex','video_girl_girl','video_girl_boy','video_calls','sells_underwear','cums','group_sex_stories','unique_places','girl_girl_experience','biggest_fantasy','fetishes','bed_characteristics','perfect_dick','perfect_sex'],
  }

  // Label lisible pour chaque clé
  const keyLabels: Record<string, string> = {
    info_first_name: 'Prénom', info_last_name: 'Nom', info_phone: 'Téléphone', info_email: 'Email', info_birthday: 'Date de naissance',
    cred_of_login: 'OnlyFans — identifiant', cred_of_password: 'OnlyFans — mot de passe', cred_mym_login: 'MYM — identifiant', cred_mym_password: 'MYM — mot de passe', cred_skrill_email: 'Skrill — email', cred_skrill_password: 'Skrill — mot de passe',
    origin: 'Origine', age: 'Âge', birth_date: 'Date de naissance', zodiac: 'Signe astro', marital_status: 'Statut', has_children: 'Enfants', height: 'Taille', weight: 'Poids', measurements: 'Mensurations', bra_size: 'Soutien-gorge', pants_size: 'Pantalon', tshirt_size: 'T-shirt', shoe_size: 'Pointure', natural_hair_color: 'Cheveux (naturel)', eye_color: 'Yeux', sport: 'Sport', sexual_orientation: 'Orientation sexuelle',
    favorite_book: 'Livre', favorite_movie: 'Film', favorite_color: 'Couleur', favorite_dish: 'Plat', favorite_car: 'Voiture', favorite_music: 'Musique', best_trip: 'Meilleur voyage', favorite_brand: 'Marque',
    drinks_alcohol: 'Alcool', smokes: 'Fume', parties: 'Fait la fête', ideal_man_age: 'Âge idéal d\'un homme', plays_instrument: 'Instrument', dream_destination: 'Destination rêvée', ideal_date: 'Date idéal', hobbies: 'Hobbies', sports_liked: 'Sports aimés', has_pet: 'Animal', siblings: 'Frères/sœurs', dream: 'Rêve', has_driving_license: 'Permis de conduire', current_car: 'Voiture actuelle', current_phone: 'Téléphone actuel', worst_flaw: 'Pire défaut', best_quality: 'Meilleure qualité', professional_project: 'Projet pro', fun_fact: 'Fun fact',
    anal_sex: 'Sexe anal', video_girl_girl: 'Vidéo fille+fille', video_girl_boy: 'Vidéo fille+garçon', video_calls: 'Appels vidéo fans', sells_underwear: 'Vend lingerie', cums: 'Jouit facilement', group_sex_stories: 'Expérience groupe', unique_places: 'Lieux insolites', girl_girl_experience: 'Expérience fille+fille', biggest_fantasy: 'Plus grand fantasme', fetishes: 'Fétiches', bed_characteristics: 'Au lit', perfect_dick: 'Pénis parfait', perfect_sex: 'Sexe parfait',
  }

  for (const [sectionKey, keys] of Object.entries(sectionKeys)) {
    const label = SECTION_LABELS[sectionKey] || sectionKey
    const answered = keys.filter(k => responses[k] !== undefined && responses[k] !== null && String(responses[k]).trim() !== '')

    if (answered.length === 0) continue

    // Heading 2 pour chaque section
    blocks.push({
      object: 'block', type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: label } }] },
    })

    // Une ligne par question répondue
    for (const k of answered) {
      if (SKIP_KEYS.has(k)) continue
      const fieldLabel = keyLabels[k] || k
      const rawVal = responses[k]
      const val = rawVal === 'yes' ? '✅ Oui' : rawVal === 'no' ? '❌ Non' : String(rawVal)
      // Tronquer à 2000 chars (limite Notion)
      const displayVal = val.length > 2000 ? val.slice(0, 1997) + '…' : val

      blocks.push({
        object: 'block', type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: `${fieldLabel} : ` }, annotations: { bold: true } },
            { type: 'text', text: { content: displayVal } },
          ],
        },
      })
    }

    // Séparateur entre sections
    blocks.push({ object: 'block', type: 'divider', divider: {} })
  }

  return blocks
}

// ─── Supprimer tous les blocs d'une page (pour la mise à jour) ────────────────
async function clearPageBlocks(pageId: string) {
  const { results } = await notionFetch(`/blocks/${pageId}/children`, 'GET')
  for (const block of results || []) {
    await notionFetch(`/blocks/${block.id}`, 'DELETE')
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { modelId, modelName, responses } = req.body as {
    modelId: string
    modelName: string
    responses: Record<string, any>
  }

  if (!modelId || !responses) return res.status(400).json({ error: 'modelId et responses requis' })

  const parentPageId = process.env.NOTION_PARENT_PAGE_ID
  if (!parentPageId) return res.status(500).json({ error: 'NOTION_PARENT_PAGE_ID manquant' })

  try {
    const displayName = modelName || modelId
    const blocks = buildBlocks(responses)
    let notionPageId: string = responses.__notion_page_id || ''

    if (notionPageId) {
      // ── Mise à jour : vider les anciens blocs + réappliquer ──────────────
      await clearPageBlocks(notionPageId)

      // Mettre à jour le titre de la page
      await notionFetch(`/pages/${notionPageId}`, 'PATCH', {
        properties: {
          title: { title: [{ type: 'text', text: { content: `${displayName} — Persona` } }] },
        },
      })
    } else {
      // ── Création : nouvelle page enfant sous le parent ────────────────────
      const created = await notionFetch('/pages', 'POST', {
        parent: { type: 'page_id', page_id: parentPageId },
        properties: {
          title: { title: [{ type: 'text', text: { content: `${displayName} — Persona` } }] },
        },
      }) as any
      notionPageId = created.id

      // Sauvegarder le notion_page_id dans Supabase pour les futures mises à jour
      const supabaseUrl  = process.env.SUPABASE_URL
      const supabaseKey  = process.env.SUPABASE_SERVICE_KEY
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/model_persona_responses?model_id=eq.${modelId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            responses: { ...responses, __notion_page_id: notionPageId },
          }),
        })
      }
    }

    // Ajouter les blocs de contenu (par chunks de 100 — limite Notion)
    const CHUNK = 100
    for (let i = 0; i < blocks.length; i += CHUNK) {
      await notionFetch(`/blocks/${notionPageId}/children`, 'PATCH', {
        children: blocks.slice(i, i + CHUNK),
      })
    }

    return res.status(200).json({
      ok: true,
      notionPageId,
      url: `https://notion.so/${notionPageId.replace(/-/g, '')}`,
    })
  } catch (err: any) {
    console.error('notion-sync error:', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}
