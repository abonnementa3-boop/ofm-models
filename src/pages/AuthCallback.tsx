import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

export default function AuthCallback() {
  const t = useT()
  const nav = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    const params = new URLSearchParams(hash)

    // Erreur renvoyée par Supabase
    if (params.get('error')) {
      const code = params.get('error_code')
      if (code === 'otp_expired') {
        setError('Ce lien a déjà été utilisé ou a expiré. Génère un nouveau lien depuis le CRM.')
      } else {
        setError(params.get('error_description') || t('auth.invalid_link'))
      }
      return
    }

    // Session directement dans le hash (implicit flow)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error: e }) => {
          if (e) { setError(e.message); return }
          nav('/', { replace: true })
        })
      return
    }

    // PKCE flow : code dans les query params
    const search = new URLSearchParams(window.location.search)
    const code = search.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error: e }) => {
          if (e) { setError(e.message); return }
          nav('/', { replace: true })
        })
      return
    }

    // Aucun token trouvé
    setError(t('auth.invalid_link'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {error ? (
        <>
          <AlertCircle size={32} className="text-accent-red mb-3" />
          <p className="text-text-primary text-sm mb-4">{error}</p>
          <button onClick={() => nav('/login', { replace: true })} className="btn-secondary">
            {t('auth.back_to_login')}
          </button>
        </>
      ) : (
        <>
          <Loader2 size={28} className="text-accent-purple animate-spin mb-3" />
          <p className="text-text-secondary text-sm">{t('auth.connecting')}</p>
        </>
      )}
    </div>
  )
}
