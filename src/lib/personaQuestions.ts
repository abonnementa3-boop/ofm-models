// Questions du formulaire persona — multilingues (FR/EN/ES).
// Les réponses sont stockées dans model_persona_responses.responses (JSONB) avec la clé `key`.

import type { I18nText, Locale } from './i18n'

export type QuestionType =
  | 'text'        // input court
  | 'textarea'    // input long
  | 'number'      // numérique
  | 'yes_no'      // oui / non (stocké en 'yes' / 'no')
  | 'select'      // dropdown

export interface PersonaQuestion {
  key: string
  label: I18nText
  type: QuestionType
  options?: I18nText[]      // pour select : options localisées
  placeholder?: I18nText
}

export interface PersonaSection {
  key: string
  title: I18nText
  description?: I18nText
  questions: PersonaQuestion[]
}

// Raccourci pour écrire des I18nText (rend le code lisible)
const i = (fr: string, en: string, es: string): I18nText => ({ fr, en, es })

export const PERSONA_SECTIONS: PersonaSection[] = [
  // ── 0. Infos personnelles ─────────────────────────────────────────────────
  {
    key: 'personal_info',
    title: i('Mes infos perso', 'My personal info', 'Mis datos personales'),
    description: i('Prénom, nom, contact — uniquement visible par l\'agence', 'First name, last name, contact — visible to the agency only', 'Nombre, apellido, contacto — visible solo para la agencia'),
    questions: [
      { key: 'info_first_name', label: i('Prénom', 'First name', 'Nombre'), type: 'text' },
      { key: 'info_last_name',  label: i('Nom de famille', 'Last name', 'Apellido'), type: 'text' },
      { key: 'info_phone',      label: i('Téléphone (WhatsApp)', 'Phone (WhatsApp)', 'Teléfono (WhatsApp)'), type: 'text',
        placeholder: i('+33 6 00 00 00 00', '+33 6 00 00 00 00', '+34 6 00 00 00 00') },
      { key: 'info_email',      label: i('Email personnel', 'Personal email', 'Email personal'), type: 'text',
        placeholder: i('ton-email@exemple.com', 'your-email@example.com', 'tu-email@ejemplo.com') },
      { key: 'info_birthday',   label: i('Date de naissance', 'Date of birth', 'Fecha de nacimiento'), type: 'text',
        placeholder: i('JJ/MM/AAAA', 'DD/MM/YYYY', 'DD/MM/AAAA') },
    ],
  },

  // ── 0b. Accès plateformes ─────────────────────────────────────────────────
  {
    key: 'platform_access',
    title: i('Mes accès plateformes', 'My platform accesses', 'Mis accesos a plataformas'),
    description: i('Identifiants OnlyFans, MYM, Skrill — stockés de façon sécurisée', 'OnlyFans, MYM, Skrill credentials — stored securely', 'Credenciales OnlyFans, MYM, Skrill — almacenados de forma segura'),
    questions: [
      { key: 'cred_of_login',      label: i('OnlyFans — identifiant (email ou @)', 'OnlyFans — login (email or @)', 'OnlyFans — login (email o @)'), type: 'text' },
      { key: 'cred_of_password',   label: i('OnlyFans — mot de passe', 'OnlyFans — password', 'OnlyFans — contraseña'), type: 'text' },
      { key: 'cred_mym_login',     label: i('MYM — identifiant (email)', 'MYM — login (email)', 'MYM — login (email)'), type: 'text' },
      { key: 'cred_mym_password',  label: i('MYM — mot de passe', 'MYM — password', 'MYM — contraseña'), type: 'text' },
      { key: 'cred_skrill_email',  label: i('Skrill — email du compte', 'Skrill — account email', 'Skrill — email de la cuenta'), type: 'text' },
      { key: 'cred_skrill_password', label: i('Skrill — mot de passe', 'Skrill — password', 'Skrill — contraseña'), type: 'text' },
    ],
  },

  // ── 1. Identité & physique ────────────────────────────────────────────────
  {
    key: 'identity_physical',
    title: i('Identité & physique', 'Identity & physique', 'Identidad & físico'),
    description: i('Les bases — pour bien te connaître', 'The basics — to get to know you', 'Lo básico — para conocerte bien'),
    questions: [
      { key: 'origin',              label: i('Origine / nationalité', 'Origin / nationality', 'Origen / nacionalidad'), type: 'text' },
      { key: 'age',                 label: i('Âge', 'Age', 'Edad'), type: 'number' },
      { key: 'birth_date',          label: i('Date de naissance', 'Date of birth', 'Fecha de nacimiento'), type: 'text',
        placeholder: i('JJ/MM/AAAA', 'DD/MM/YYYY', 'DD/MM/AAAA') },
      { key: 'zodiac',              label: i('Signe astrologique', 'Zodiac sign', 'Signo zodiacal'), type: 'select',
        options: [
          i('Bélier','Aries','Aries'),       i('Taureau','Taurus','Tauro'),
          i('Gémeaux','Gemini','Géminis'),   i('Cancer','Cancer','Cáncer'),
          i('Lion','Leo','Leo'),             i('Vierge','Virgo','Virgo'),
          i('Balance','Libra','Libra'),      i('Scorpion','Scorpio','Escorpio'),
          i('Sagittaire','Sagittarius','Sagitario'),
          i('Capricorne','Capricorn','Capricornio'),
          i('Verseau','Aquarius','Acuario'), i('Poissons','Pisces','Piscis'),
        ] },
      { key: 'marital_status',      label: i('Statut amoureux', 'Relationship status', 'Estado civil'), type: 'select',
        options: [
          i('Célibataire','Single','Soltera'),
          i('En couple','In a relationship','En pareja'),
          i('Mariée','Married','Casada'),
          i('Divorcée','Divorced','Divorciada'),
          i('Compliqué','It\'s complicated','Es complicado'),
        ] },
      { key: 'has_children',        label: i('As-tu des enfants ?', 'Do you have children?', '¿Tienes hijos?'), type: 'yes_no' },
      { key: 'height',              label: i('Taille (cm)', 'Height (cm)', 'Altura (cm)'), type: 'number' },
      { key: 'weight',              label: i('Poids (kg)', 'Weight (kg)', 'Peso (kg)'), type: 'number' },
      { key: 'measurements',        label: i('Mensurations (poitrine - taille - hanches)', 'Measurements (bust - waist - hips)', 'Medidas (busto - cintura - caderas)'),
        type: 'text', placeholder: i('ex: 90-60-90', 'e.g. 90-60-90', 'ej: 90-60-90') },
      { key: 'bra_size',            label: i('Taille de soutien-gorge', 'Bra size', 'Talla de sujetador'), type: 'text' },
      { key: 'pants_size',          label: i('Taille pantalon', 'Pants size', 'Talla de pantalones'), type: 'text' },
      { key: 'tshirt_size',         label: i('Taille t-shirt / haut', 'T-shirt / top size', 'Talla de camisetas'), type: 'text' },
      { key: 'shoe_size',           label: i('Pointure', 'Shoe size', 'Talla de calzado'), type: 'text' },
      { key: 'natural_hair_color',  label: i('Couleur de cheveux naturelle', 'Natural hair color', 'Color natural del pelo'), type: 'text' },
      { key: 'eye_color',           label: i('Couleur des yeux', 'Eye color', 'Color de ojos'), type: 'text' },
      { key: 'sport',               label: i('Sport pratiqué', 'Sport you practice', 'Deporte que practicas'), type: 'text' },
      { key: 'sexual_orientation',  label: i('Orientation / préférences sexuelles', 'Sexual orientation / preferences', 'Orientación / preferencias sexuales'), type: 'text' },
    ],
  },

  // ── 2. Préférences ────────────────────────────────────────────────────────
  {
    key: 'preferences',
    title: i('Tes goûts', 'Your tastes', 'Tus gustos'),
    description: i('Ce que tu aimes au quotidien', 'What you love daily', 'Lo que te gusta a diario'),
    questions: [
      { key: 'favorite_book',   label: i('Livre préféré', 'Favorite book', 'Libro favorito'), type: 'text' },
      { key: 'favorite_movie',  label: i('Film préféré', 'Favorite movie', 'Película favorita'), type: 'text' },
      { key: 'favorite_color',  label: i('Couleur préférée', 'Favorite color', 'Color favorito'), type: 'text' },
      { key: 'favorite_dish',   label: i('Plat préféré', 'Favorite dish', 'Plato favorito'), type: 'text' },
      { key: 'favorite_car',    label: i('Voiture préférée', 'Favorite car', 'Coche favorito'), type: 'text' },
      { key: 'favorite_music',  label: i('Musique préférée / artistes', 'Favorite music / artists', 'Música favorita / artistas'), type: 'textarea' },
      { key: 'best_trip',       label: i('Ton meilleur voyage', 'Your best trip', 'Tu mejor viaje'), type: 'textarea' },
      { key: 'favorite_brand',  label: i('Marque préférée', 'Favorite brand', 'Marca favorita'), type: 'text' },
    ],
  },

  // ── 3. Détails personnels ─────────────────────────────────────────────────
  {
    key: 'personal_details',
    title: i('En savoir + sur toi', 'More about you', 'Saber + sobre ti'),
    description: i('Pour que ton univers soit cohérent et authentique', 'So your universe is coherent and authentic', 'Para que tu universo sea coherente y auténtico'),
    questions: [
      { key: 'drinks_alcohol',     label: i('Tu bois (alcool) ?', 'Do you drink (alcohol)?', '¿Bebes (alcohol)?'), type: 'yes_no' },
      { key: 'smokes',             label: i('Tu fumes ?', 'Do you smoke?', '¿Fumas?'), type: 'yes_no' },
      { key: 'parties',            label: i('Tu aimes faire la fête ?', 'Do you like to party?', '¿Te gusta salir de fiesta?'), type: 'yes_no' },
      { key: 'ideal_man_age',      label: i('Âge idéal d\'un homme à tes yeux', 'Ideal age for a man', 'Edad ideal de un hombre para ti'), type: 'text' },
      { key: 'plays_instrument',   label: i('Tu joues d\'un instrument ?', 'Do you play an instrument?', '¿Tocas algún instrumento?'),
        type: 'text', placeholder: i('Lequel, ou "non"', 'Which one, or "no"', 'Cuál, o "no"') },
      { key: 'dream_destination',  label: i('Si tu pouvais voyager n\'importe où, où irais-tu ?', 'If you could travel anywhere, where would you go?', 'Si pudieras viajar a cualquier lugar, ¿adónde irías?'), type: 'textarea' },
      { key: 'ideal_date',         label: i('Rendez-vous galant idéal', 'Ideal date', 'Cita ideal'), type: 'textarea' },
      { key: 'hobbies',            label: i('Tes hobbies (hors OnlyFans)', 'Your hobbies (outside OnlyFans)', 'Aficiones (fuera de OnlyFans)'), type: 'textarea' },
      { key: 'sports_liked',       label: i('Sports que tu aimes regarder ou pratiquer', 'Sports you like to watch or play', 'Deportes que te gustan'), type: 'textarea' },
      { key: 'has_pet',            label: i('Tu as un animal de compagnie ?', 'Do you have a pet?', '¿Tienes mascota?'),
        type: 'text', placeholder: i('Lequel, ou "non"', 'Which one, or "no"', 'Cuál, o "no"') },
      { key: 'siblings',           label: i('Frères et sœurs ?', 'Brothers and sisters?', '¿Tienes hermanos?'), type: 'text' },
      { key: 'dream',              label: i('Ton rêve', 'Your dream', 'Tu sueño'), type: 'textarea' },
      { key: 'has_driving_license',label: i('Tu as le permis de conduire ?', 'Do you have a driving license?', '¿Tienes carné de conducir?'), type: 'yes_no' },
      { key: 'current_car',        label: i('Ta voiture actuelle', 'Your current car', 'El coche que tienes'),
        type: 'text', placeholder: i('Si tu en as une', 'If you have one', 'Si tienes uno') },
      { key: 'current_phone',      label: i('Ton téléphone actuel', 'Your current phone', 'El teléfono que tienes'),
        type: 'text', placeholder: i('iPhone 15, Samsung S24...', 'iPhone 15, Samsung S24…', 'iPhone 15, Samsung S24…') },
      { key: 'worst_flaw',         label: i('Ton pire défaut', 'Your worst flaw', 'Tu peor defecto'), type: 'textarea' },
      { key: 'best_quality',       label: i('Ta meilleure qualité', 'Your best quality', 'Tu mejor cualidad'), type: 'textarea' },
      { key: 'professional_project', label: i('Ton projet pro long terme', 'Your long-term professional project', 'Tu proyecto profesional a largo plazo'), type: 'textarea' },
      { key: 'fun_fact',           label: i('Un truc surprenant sur toi', 'A fun fact about you', 'Un dato curioso sobre ti'), type: 'textarea' },
    ],
  },

  // ── 4. Sexualité ──────────────────────────────────────────────────────────
  {
    key: 'sexuality',
    title: i('Sexualité & contenu', 'Sexuality & content', 'Sexualidad & contenido'),
    description: i('Pour cadrer ce que tu veux faire et ne pas faire — pas de jugement, on s\'adapte à toi',
      'To define what you want or don\'t want to do — no judgment, we adapt to you',
      'Para definir lo que quieres y lo que no — sin juicio, nos adaptamos a ti'),
    questions: [
      { key: 'anal_sex',           label: i('Tu pratiques le sexe anal ?', 'Do you practice anal sex?', '¿Practicas sexo anal?'), type: 'yes_no' },
      { key: 'video_girl_girl',    label: i('Tu ferais une vidéo de sexe fille + fille ?', 'Would you film a girl + girl scene?', '¿Harías un vídeo chica + chica?'), type: 'yes_no' },
      { key: 'video_girl_boy',     label: i('Tu ferais une vidéo de sexe fille + garçon ?', 'Would you film a girl + boy scene?', '¿Harías un vídeo chica + chico?'), type: 'yes_no' },
      { key: 'video_calls',        label: i('Tu accepterais des appels vidéo avec des fans ?', 'Would you accept video calls with fans?', '¿Harías videollamadas con clientes?'), type: 'yes_no' },
      { key: 'sells_underwear',    label: i('Tu vendrais ta lingerie portée ?', 'Would you sell your worn underwear?', '¿Venderías tu ropa interior?'), type: 'yes_no' },
      { key: 'cums',               label: i('Tu jouis facilement ?', 'Do you orgasm easily?', '¿Te corres fácilmente?'), type: 'yes_no' },
      { key: 'group_sex_stories',  label: i('Tu as déjà eu une expérience de sexe en groupe ? Raconte.',
        'Have you ever had a group sex experience? Tell us.',
        '¿Has tenido una experiencia de sexo en grupo? Cuéntala.'), type: 'textarea' },
      { key: 'unique_places',      label: i('Lieux insolites où tu as fait l\'amour',
        'Unique places where you\'ve had sex',
        'Lugares únicos donde has tenido sexo'), type: 'textarea' },
      { key: 'girl_girl_experience', label: i('Fille + fille : déjà eu une expérience ? Raconte. Sinon, c\'est quoi ton fantasme ?',
        'Girl + girl: ever had one? Tell us. If not, what\'s your fantasy?',
        'Chica + chica: ¿alguna vez? Cuéntala. Si no, ¿cuál es tu fantasía?'), type: 'textarea' },
      { key: 'biggest_fantasy',    label: i('Ton plus grand fantasme sexuel', 'Your biggest sexual fantasy', 'Tu mayor fantasía sexual'), type: 'textarea' },
      { key: 'fetishes',           label: i('Tes fétiches', 'Your fetishes', 'Tus fetiches'), type: 'textarea' },
      { key: 'bed_characteristics', label: i('Ce qui te définit au lit (3-5 caractéristiques)',
        'What defines you in bed (3-5 traits)',
        'Lo que te define en la cama (3-5 características)'), type: 'textarea' },
      { key: 'perfect_dick',       label: i('Pour toi, c\'est quoi le pénis parfait ?', 'What\'s the perfect penis for you?', '¿Cómo es el pene perfecto para ti?'), type: 'textarea' },
      { key: 'perfect_sex',        label: i('Pour toi, c\'est quoi le sexe parfait ?', 'What\'s perfect sex for you?', '¿Cuál sería el sexo perfecto para ti?'), type: 'textarea' },
    ],
  },
]

export function countAnswered(responses: Record<string, any>): { total: number; answered: number } {
  let total = 0
  let answered = 0
  for (const section of PERSONA_SECTIONS) {
    for (const q of section.questions) {
      total += 1
      const v = responses[q.key]
      if (v !== undefined && v !== null && String(v).trim() !== '') answered += 1
    }
  }
  return { total, answered }
}

// Helper pour piocher le texte localisé d'une option
export function localizeOption(opt: I18nText, locale: Locale): string {
  return opt[locale] || opt.fr || ''
}
