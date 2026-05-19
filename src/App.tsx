import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Home from './pages/Home'
import Persona from './pages/Persona'
import Contract from './pages/Contract'
import Todo from './pages/Todo'
import Layout from './components/Layout'
import { getCurrentModel, useSession, type ModelProfile } from './lib/session'
import { LocaleContext, LocaleSetterContext, detectBrowserLocale, nationalityToLocale, t as tStatic, type Locale } from './lib/i18n'

const LOCALE_KEY = 'portal_locale'

export default function App() {
  const { session, loading } = useSession()
  const [model, setModel] = useState<ModelProfile | null>(null)
  const [loadingModel, setLoadingModel] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()

  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(LOCALE_KEY) as Locale | null
    return stored || detectBrowserLocale()
  })

  const setLocale = (l: Locale) => {
    localStorage.setItem(LOCALE_KEY, l)
    setLocaleState(l)
  }

  useEffect(() => {
    if (!session) { setModel(null); return }
    setLoadingModel(true)
    getCurrentModel().then(m => {
      setModel(m)
      setLoadingModel(false)
      // Si la modèle n'a pas encore choisi de langue, dériver de la nationalité
      if (!localStorage.getItem(LOCALE_KEY) && m?.nationality) {
        setLocaleState(nationalityToLocale(m.nationality))
      }
    })
  }, [session?.user.id])

  let content: React.ReactNode

  if (loading) {
    content = <FullScreenLoader />
  } else if (!session) {
    if (loc.pathname === '/auth/callback') content = <AuthCallback />
    else if (loc.pathname !== '/login') content = <Navigate to="/login" replace />
    else content = <Login />
  } else if (loc.pathname === '/login') {
    content = <Navigate to="/" replace />
  } else if (loadingModel) {
    content = <FullScreenLoader />
  } else if (!model) {
    content = (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-text-primary font-bold text-lg mb-2">{tStatic('unlinked.title', locale)}</h2>
        <p className="text-text-secondary text-sm mb-6 max-w-xs">{tStatic('unlinked.body', locale)}</p>
        <button onClick={() => { import('./lib/session').then(s => s.signOut()).then(() => nav('/login', { replace: true })) }} className="btn-secondary">
          {tStatic('common.logout', locale)}
        </button>
      </div>
    )
  } else {
    content = (
      <Layout model={model}>
        <Routes>
          <Route path="/" element={<Home model={model} />} />
          <Route path="/contract" element={<Contract model={model} validatedAt={model.contract_validated_at} />} />
          <Route path="/persona" element={model.contract_validated_at ? <Persona model={model} /> : <ContractRequired locale={locale} />} />
          <Route path="/todo" element={model.contract_validated_at ? <Todo model={model} /> : <ContractRequired locale={locale} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    )
  }

  return (
    <LocaleSetterContext.Provider value={setLocale}>
      <LocaleContext.Provider value={locale}>
        {content}
      </LocaleContext.Provider>
    </LocaleSetterContext.Provider>
  )
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 size={28} className="text-accent-purple animate-spin" />
    </div>
  )
}

function ContractRequired({ locale }: { locale: any }) {
  const nav = useNavigate()
  return (
    <div className="pt-12 flex flex-col items-center text-center px-4 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-bg-hover flex items-center justify-center">
        <Lock size={28} className="text-text-muted" />
      </div>
      <h2 className="text-text-primary font-bold text-lg">{tStatic('locked.title', locale)}</h2>
      <p className="text-text-secondary text-sm max-w-xs leading-relaxed">{tStatic('locked.body', locale)}</p>
      <button onClick={() => nav('/contract')} className="btn-primary mt-2">
        {tStatic('locked.go_contract', locale)}
      </button>
    </div>
  )
}
