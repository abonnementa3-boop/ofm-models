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
    let cancelled = false
    const check = async () => {
      await new Promise(r => setTimeout(r, 400))
      const { data, error: e } = await supabase.auth.getSession()
      if (cancelled) return
      if (e) { setError(e.message); return }
      if (data.session) nav('/', { replace: true })
      else setError(t('auth.invalid_link'))
    }
    check()
    return () => { cancelled = true }
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
