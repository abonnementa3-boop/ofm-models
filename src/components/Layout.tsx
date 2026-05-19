import { NavLink, useNavigate } from 'react-router-dom'
import { Home, FileText, ClipboardList, User, LogOut, Lock } from 'lucide-react'
import { signOut } from '../lib/session'
import type { ModelProfile } from '../lib/session'
import { useT, useLocale, useSetLocale, type Locale } from '../lib/i18n'

function LangPicker() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  return (
    <div className="flex gap-1">
      {(['fr', 'en', 'es'] as Locale[]).map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
            locale === l
              ? 'border-accent-purple/60 text-accent-purple-light bg-accent-purple/10'
              : 'border-bg-border text-text-muted hover:border-text-muted'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export default function Layout({ model, children }: { model: ModelProfile | null; children: React.ReactNode }) {
  const t = useT()
  const nav = useNavigate()
  const handleLogout = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  const firstName = model?.first_name || model?.name?.split(' ')[0] || ''
  const contractValidated = !!model?.contract_validated_at

  const NAV = [
    { to: '/', label: t('nav.home'), icon: Home, end: true, locked: false },
    { to: '/contract', label: t('nav.contract'), icon: FileText, end: false, locked: false },
    { to: '/persona', label: t('nav.persona'), icon: User, end: false, locked: !contractValidated },
    { to: '/todo', label: t('nav.tasks'), icon: ClipboardList, end: false, locked: !contractValidated },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-bg-body/95 backdrop-blur z-10">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wider">{t('header.my_space')}</p>
          <h1 className="text-text-primary font-bold text-lg">
            {firstName ? `${t('header.hello')} ${firstName} 👋` : t('header.my_space')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <LangPicker />
          <button onClick={handleLogout} className="w-10 h-10 rounded-xl border border-bg-border flex items-center justify-center text-text-muted active:scale-95">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur border-t border-bg-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          {NAV.map(item => item.locked ? (
            <div
              key={item.to}
              className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-text-muted/40 relative"
              title={t('locked.title')}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              <Lock size={9} className="absolute top-2.5 right-[calc(50%-12px)]" />
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                  isActive ? 'text-accent-purple-light' : 'text-text-muted'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
