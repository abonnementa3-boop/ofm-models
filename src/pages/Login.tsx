import { useState } from 'react'
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, useLocale, useSetLocale, type Locale } from '../lib/i18n'

const LANGS: { code: Locale; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

export default function Login() {
  const t = useT()
  const locale = useLocale()
  const setLocale = useSetLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) {
        setError(t('login.wrong_pwd'))
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm mx-auto w-full">
        {/* Sélecteur de langue */}
        <div className="flex justify-center gap-2 mb-8">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                locale === l.code
                  ? 'bg-accent-purple/20 border-accent-purple text-accent-purple-light'
                  : 'border-bg-border text-text-muted hover:border-text-muted hover:text-text-secondary'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
            <span className="text-white font-bold text-2xl">O</span>
          </div>
          <h1 className="text-text-primary font-bold text-2xl mb-1">{t('login.title')}</h1>
          <p className="text-text-secondary text-sm">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-text-secondary text-xs font-medium mb-2 block">
              {t('login.email_label')}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@..."
                className="input pl-11"
              />
            </div>
          </div>
          <div>
            <label className="text-text-secondary text-xs font-medium mb-2 block">
              {t('login.pwd_label')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-11"
              />
            </div>
          </div>
          {error && <p className="text-accent-red text-xs">{error}</p>}
          <button type="submit" disabled={loading || !email.trim() || !password} className="btn-primary w-full">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? '...' : t('login.pwd_cta')}
          </button>
        </form>
      </div>
    </div>
  )
}
