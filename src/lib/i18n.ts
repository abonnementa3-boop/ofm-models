// Système i18n pour le portail — 3 langues (FR/EN/ES).
// La langue est dérivée de model.nationality après login, ou de navigator.language avant.

import { createContext, useContext } from 'react'

export type Locale = 'fr' | 'en' | 'es'

export const LOCALES: Locale[] = ['fr', 'en', 'es']
export const DEFAULT_LOCALE: Locale = 'fr'

export function nationalityToLocale(nat?: string | null): Locale {
  if (nat === 'US') return 'en'
  if (nat === 'ES') return 'es'
  return 'fr'
}

export function detectBrowserLocale(): Locale {
  const lang = (typeof navigator !== 'undefined' ? navigator.language : 'fr').toLowerCase()
  if (lang.startsWith('en')) return 'en'
  if (lang.startsWith('es')) return 'es'
  return 'fr'
}

export const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)
export const useLocale = (): Locale => useContext(LocaleContext)

export const LocaleSetterContext = createContext<(l: Locale) => void>(() => {})
export const useSetLocale = () => useContext(LocaleSetterContext)

// Type pour les textes multilingues
export type I18nText = Record<Locale, string>

// Helper pour récupérer un texte multilingue avec fallback FR
export function pickText(t: I18nText | string | undefined, locale: Locale): string {
  if (!t) return ''
  if (typeof t === 'string') return t
  return t[locale] || t.fr || ''
}

// ─────────────────────────────────────────────────────────────────────────────
// UI strings
// ─────────────────────────────────────────────────────────────────────────────

const UI = {
  // Login
  'login.title':        { fr: 'Mon espace OFM',        en: 'My OFM space',          es: 'Mi espacio OFM' },
  'login.subtitle':     { fr: 'Ton agence à portée de doigt', en: 'Your agency at your fingertips', es: 'Tu agencia al alcance de la mano' },
  'login.email_label':  { fr: "Ton email (celui que ton agence t'a indiqué)", en: 'Your email (the one your agency told you)', es: 'Tu email (el que te indicó tu agencia)' },
  'login.cta':          { fr: 'Recevoir mon lien',     en: 'Send me the link',       es: 'Recibir mi enlace' },
  'login.sending':      { fr: 'Envoi en cours...',     en: 'Sending...',             es: 'Enviando...' },
  'login.no_password':  { fr: "Pas de mot de passe à retenir. On t'envoie un lien sécurisé par email, tu cliques, tu es connectée.",
                          en: "No password to remember. We send you a secure link by email, you click, you're in.",
                          es: 'Sin contraseña que recordar. Te enviamos un enlace seguro por email, haces clic y entras.' },
  'login.sent.title':   { fr: 'Lien envoyé !',         en: 'Link sent!',             es: '¡Enlace enviado!' },
  'login.sent.body':    { fr: "Ouvre ta boîte mail et clique sur le bouton — tu es directement connectée.",
                          en: "Open your inbox and click the button — you're directly logged in.",
                          es: 'Abre tu bandeja y haz clic en el botón — entras directamente.' },
  'login.try_another':  { fr: 'Essayer avec un autre email', en: 'Try with another email', es: 'Probar con otro email' },

  // Auth callback
  'auth.connecting':    { fr: 'Connexion en cours...', en: 'Signing in...',          es: 'Conectando...' },
  'auth.invalid_link':  { fr: "Lien invalide ou expiré. Demande un nouveau lien depuis l'écran de connexion.",
                          en: 'Invalid or expired link. Ask for a new one from the login screen.',
                          es: 'Enlace inválido o expirado. Pide uno nuevo desde la pantalla de inicio.' },
  'auth.back_to_login': { fr: 'Retour à la connexion', en: 'Back to login',          es: 'Volver al inicio de sesión' },

  // Compte non lié
  'unlinked.title':     { fr: 'Compte non lié',        en: 'Account not linked',     es: 'Cuenta no vinculada' },
  'unlinked.body':      { fr: "Ton agence n'a pas encore lié ton email à ton profil. Contacte-la pour qu'elle finalise ton accès.",
                          en: 'Your agency has not linked your email to your profile yet. Contact them to finalize your access.',
                          es: 'Tu agencia aún no ha vinculado tu email a tu perfil. Contáctala para finalizar tu acceso.' },
  'common.logout':      { fr: 'Se déconnecter',        en: 'Sign out',               es: 'Cerrar sesión' },

  // Layout / Nav
  'nav.home':           { fr: 'Accueil',                en: 'Home',                  es: 'Inicio' },
  'nav.contract':       { fr: 'Contrat',                en: 'Contract',              es: 'Contrato' },
  'nav.persona':        { fr: 'Persona',                en: 'Persona',               es: 'Persona' },
  'nav.tasks':          { fr: 'Tâches',                 en: 'Tasks',                 es: 'Tareas' },

  // Header
  'header.hello':       { fr: 'Salut',                  en: 'Hi',                    es: 'Hola' },
  'header.my_space':    { fr: 'Mon espace',             en: 'My space',              es: 'Mi espacio' },

  // Home cards
  'home.contract.title':         { fr: 'Contrat',                 en: 'Contract',                es: 'Contrato' },
  'home.contract.done':          { fr: 'Signé et reçu ✓',         en: 'Signed and received ✓',   es: 'Firmado y recibido ✓' },
  'home.contract.todo':          { fr: 'À signer',                en: 'To sign',                 es: 'Por firmar' },
  'home.persona.title':          { fr: 'Fiche persona',           en: 'Persona sheet',           es: 'Ficha persona' },
  'home.persona.done':           { fr: 'Complétée ✓',             en: 'Completed ✓',             es: 'Completada ✓' },
  'home.persona.in_progress':    { fr: 'En cours — à finir',      en: 'In progress — to finish', es: 'En curso — por terminar' },
  'home.persona.todo':           { fr: 'À remplir',               en: 'To fill in',              es: 'Por completar' },
  'home.tasks.title':            { fr: 'Mes tâches',              en: 'My tasks',                es: 'Mis tareas' },
  'home.tasks.empty':            { fr: 'Aucune tâche assignée pour le moment', en: 'No tasks assigned yet', es: 'Sin tareas asignadas por ahora' },

  // Persona page
  'persona.title':               { fr: 'Ma fiche persona',        en: 'My persona sheet',        es: 'Mi ficha persona' },
  'persona.subtitle':            { fr: "Remplis tranquille, c'est sauvegardé automatiquement à chaque champ. Plus c'est précis, plus on peut bosser qualitatif sur ton profil.",
                                   en: "Take your time, each field auto-saves. The more precise, the better we can craft your profile.",
                                   es: 'Tómate tu tiempo, cada campo se guarda automáticamente. Cuanto más preciso, mejor para tu perfil.' },
  'persona.progress':            { fr: 'Progression',             en: 'Progress',                es: 'Progreso' },
  'persona.questions_count':     { fr: 'questions',               en: 'questions',               es: 'preguntas' },
  'persona.completed_on':        { fr: 'Marquée comme terminée le', en: 'Marked as completed on', es: 'Marcada como terminada el' },
  'persona.mark_complete':       { fr: "J'ai fini, valider ma fiche", en: 'Done, validate my sheet', es: 'He terminado, validar mi ficha' },
  'persona.update':              { fr: 'Mettre à jour',           en: 'Update',                  es: 'Actualizar' },
  'persona.min_60':              { fr: 'Remplis au moins 60% des questions pour valider', en: 'Fill at least 60% of questions to validate', es: 'Completa al menos el 60% de las preguntas para validar' },

  // Contract page
  'contract.title':              { fr: 'Mon contrat',             en: 'My contract',             es: 'Mi contrato' },
  'contract.subtitle':           { fr: 'Télécharge ton contrat, signe-le sur ton téléphone avec',
                                   en: 'Download your contract, sign it on your phone with',
                                   es: 'Descarga tu contrato, fírmalo en tu teléfono con' },
  'contract.markup_tool':        { fr: "(l'outil natif d'Apple), puis renvoie le PDF signé ici.",
                                   en: "(Apple's native tool), then send the signed PDF back here.",
                                   es: '(la herramienta nativa de Apple), luego reenvía el PDF firmado aquí.' },
  'contract.section_download':   { fr: '1. Télécharger ton contrat', en: '1. Download your contract', es: '1. Descargar tu contrato' },
  'contract.added_on':           { fr: 'ajouté le',                en: 'added on',                 es: 'añadido el' },
  'contract.open_drive':         { fr: 'Ouvrir dans Drive',        en: 'Open in Drive',            es: 'Abrir en Drive' },
  'contract.download_pdf':       { fr: 'Télécharger le PDF',       en: 'Download PDF',             es: 'Descargar PDF' },
  'contract.how_to_sign':        { fr: 'Comment le signer ?',      en: 'How to sign it?',          es: '¿Cómo firmarlo?' },
  'contract.howto.1':            { fr: "Télécharge le PDF (s'enregistre dans Files)", en: 'Download the PDF (it saves to Files)', es: 'Descarga el PDF (se guarda en Archivos)' },
  'contract.howto.2':            { fr: "Ouvre-le, appuie sur l'icône stylo Markup en haut à droite", en: 'Open it, tap the Markup pen icon top right', es: 'Ábrelo, toca el icono de lápiz Markup arriba a la derecha' },
  'contract.howto.3':            { fr: 'Choisis "Signature" → dessine ou utilise une existante', en: 'Choose "Signature" → draw or use an existing one', es: 'Elige "Firma" → dibuja o usa una existente' },
  'contract.howto.4':            { fr: 'Place-la, ajoute la date à la main si besoin', en: 'Place it, add the date by hand if needed', es: 'Colócala, añade la fecha a mano si hace falta' },
  'contract.howto.5':            { fr: 'Appuie sur "Terminé" → enregistre', en: 'Tap "Done" → save', es: 'Toca "Listo" → guarda' },
  'contract.howto.6':            { fr: 'Reviens ici et renvoie le PDF signé ci-dessous', en: 'Come back here and send the signed PDF below', es: 'Vuelve aquí y envía el PDF firmado abajo' },
  'contract.preparing':          { fr: 'L\'agence prépare ton contrat personnalisé. On te prévient ici dès qu\'il est disponible.',
                                   en: 'The agency is preparing your customized contract. We\'ll notify you here once available.',
                                   es: 'La agencia está preparando tu contrato personalizado. Te avisamos aquí cuando esté listo.' },
  'contract.section_upload':     { fr: '2. Renvoyer le PDF signé', en: '2. Send back the signed PDF', es: '2. Reenviar el PDF firmado' },
  'contract.validated_title':    { fr: 'Contrat validé',           en: 'Contract validated',       es: 'Contrato validado' },
  'contract.validated_body':     { fr: 'par l\'agence le',         en: 'by the agency on',         es: 'por la agencia el' },
  'contract.unlocks_access':     { fr: 'Tu peux maintenant remplir tes accès dans l\'onglet "Mes accès".',
                                   en: 'You can now fill your accesses in the "My accesses" tab.',
                                   es: 'Ya puedes rellenar tus accesos en la pestaña "Mis accesos".' },
  'contract.waiting_validation': { fr: 'Reçu, en attente de validation', en: 'Received, awaiting validation', es: 'Recibido, esperando validación' },
  'contract.sent_on':            { fr: 'envoyé le',                en: 'sent on',                  es: 'enviado el' },
  'contract.resend':             { fr: 'Tu peux renvoyer un nouveau PDF si tu veux le corriger.',
                                   en: 'You can resend a new PDF if you want to correct it.',
                                   es: 'Puedes reenviar un nuevo PDF si quieres corregirlo.' },
  'contract.choose_pdf':         { fr: 'Choisir le PDF signé',     en: 'Choose signed PDF',        es: 'Elegir el PDF firmado' },
  'contract.resend_new':         { fr: 'Renvoyer un nouveau PDF',  en: 'Resend a new PDF',         es: 'Reenviar un nuevo PDF' },
  'contract.uploading':          { fr: 'Upload en cours...',       en: 'Uploading...',             es: 'Subiendo...' },
  'contract.no_doc_yet':         { fr: 'Tu pourras uploader ton contrat signé une fois que l\'agence aura mis ton contrat à dispo.',
                                   en: 'You\'ll be able to upload your signed contract once the agency provides one.',
                                   es: 'Podrás subir tu contrato firmado una vez que la agencia lo proporcione.' },

  // Locked state (contrat requis)
  'locked.title':                { fr: 'Section verrouillée',      en: 'Section locked',           es: 'Sección bloqueada' },
  'locked.body':                 { fr: "Signe et renvoie ton contrat pour débloquer cette section.",
                                   en: 'Sign and return your contract to unlock this section.',
                                   es: 'Firma y devuelve tu contrato para desbloquear esta sección.' },
  'locked.go_contract':         { fr: 'Aller au contrat',          en: 'Go to contract',           es: 'Ir al contrato' },
  'home.locked':                 { fr: 'Contrat requis',           en: 'Contract required',        es: 'Contrato requerido' },

  // Yes/No buttons
  'common.yes':                  { fr: '✓ Oui',                    en: '✓ Yes',                    es: '✓ Sí' },
  'common.no':                   { fr: '✗ Non',                    en: '✗ No',                     es: '✗ No' },
  'common.choose':               { fr: '— Choisir —',              en: '— Choose —',               es: '— Elegir —' },

  // Todo page
  'todo.title':                  { fr: 'Mes tâches',               en: 'My tasks',                 es: 'Mis tareas' },
  'todo.empty':                  { fr: "Aucune tâche assignée pour l'instant — ton agence te donnera des missions ici.",
                                   en: 'No tasks assigned yet — your agency will give you missions here.',
                                   es: 'Sin tareas asignadas por ahora — tu agencia te dará misiones aquí.' },
  'todo.done_section':           { fr: 'Terminées',                en: 'Done',                     es: 'Completadas' },
  'todo.pending_section':        { fr: 'En attente de validation', en: 'Awaiting validation',      es: 'Esperando validación' },
  'todo.pending_badge':          { fr: 'En vérification',          en: 'Under review',             es: 'En verificación' },
  'todo.mark_done':              { fr: "C'est fait ✓",             en: 'Done ✓',                   es: 'Hecho ✓' },
  'todo.reference':              { fr: 'Référence',                en: 'Reference',                es: 'Referencia' },
  'todo.no_files':               { fr: 'Aucun fichier',            en: 'No files',                 es: 'Sin archivos' },
  'todo.file_singular':          { fr: 'fichier',                  en: 'file',                     es: 'archivo' },
  'todo.files_plural':           { fr: 'fichiers',                 en: 'files',                    es: 'archivos' },
  'todo.add_files':              { fr: 'Ajouter',                  en: 'Add files',                es: 'Añadir' },
  'todo.uploading':              { fr: 'Upload...',                en: 'Uploading...',              es: 'Subiendo...' },

  // Catégories de tâches (titres de sections)
  'todo.cat.agency':             { fr: 'Agence — Chatting',        en: 'Agency — Chatting',         es: 'Agencia — Chatting' },
  'todo.cat.sm':                 { fr: 'SM (Sexemodel)',            en: 'SM (Sexemodel)',            es: 'SM (Sexemodel)' },
  'todo.cat.instagram':          { fr: 'Instagram',                 en: 'Instagram',                 es: 'Instagram' },
  'todo.cat.x_twitter':          { fr: 'X / Twitter',              en: 'X / Twitter',               es: 'X / Twitter' },
  'todo.cat.sfs':                { fr: 'SFS',                       en: 'SFS',                       es: 'SFS' },
  'todo.cat.mym':                { fr: 'MYM',                       en: 'MYM',                       es: 'MYM' },
  'todo.cat.onlyfans':           { fr: 'OnlyFans',                  en: 'OnlyFans',                  es: 'OnlyFans' },
  'todo.cat.tiktok':             { fr: 'TikTok',                    en: 'TikTok',                    es: 'TikTok' },
  'todo.cat.other':              { fr: 'Autre',                     en: 'Other',                     es: 'Otro' },

  // Placeholder pages
  'placeholder.tasks.title':     { fr: 'Mes tâches',               en: 'My tasks',                 es: 'Mis tareas' },
  'placeholder.tasks.body':      { fr: "Bientôt — ta to-do list assignée par l'agence : SM par ville, reels, photos X...",
                                   en: 'Coming soon — your to-do list assigned by the agency: SM by city, reels, X photos…',
                                   es: 'Próximamente — tu lista de tareas asignada por la agencia: SM por ciudad, reels, fotos X…' },
} satisfies Record<string, I18nText>

export type UIKey = keyof typeof UI

export function t(key: UIKey, locale: Locale): string {
  return UI[key][locale] || UI[key].fr || key
}

export function useT() {
  const locale = useLocale()
  return (key: UIKey): string => t(key, locale)
}
