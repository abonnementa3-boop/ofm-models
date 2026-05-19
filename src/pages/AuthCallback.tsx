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
    // Detect error in URL hash (e.g. otp_expired)
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const desc = params.get('error_description')
      const code = params.get('error_code')
      if (code === 'otp_expired') {
        setError('Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien d\'accès.')
      } else {
        setError(desc || t('auth.invalid_link'))
      }
      return
    }

    let cancelled = false
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_IN' && session) nav('/', { replace: true })
    })

    // Fallback: check existing session after Supabase processes the hash
    const timeout = setTimeout(async () => {
      if (cancelled) return
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) nav('/', { replace: true })
      else setError(t('auth.invalid_link'))
    }, 1500)

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [nav, t])

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
