import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, User, ClipboardList, ChevronRight, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ModelProfile } from '../lib/session'
import { useT } from '../lib/i18n'

type Status = 'todo' | 'in_progress' | 'done'

interface SectionState {
  contract: Status
  persona: Status
  tasks: { total: number; done: number }
}

export default function Home({ model }: { model: ModelProfile }) {
  const t = useT()
  const nav = useNavigate()
  const [state, setState] = useState<SectionState>({
    contract: 'todo',
    persona: 'todo',
    tasks: { total: 0, done: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [contractRes, personaRes, tasksRes] = await Promise.all([
        supabase.from('model_contract_signatures').select('id').eq('model_id', model.id).maybeSingle(),
        supabase.from('model_persona_responses').select('completed_at').eq('model_id', model.id).maybeSingle(),
        supabase.from('model_portal_tasks').select('status').eq('model_id', model.id),
      ])
      const tasks = (tasksRes.data || []) as { status: Status }[]
      setState({
        contract: contractRes.data ? 'done' : 'todo',
        persona: personaRes.data?.completed_at ? 'done' : personaRes.data ? 'in_progress' : 'todo',
        tasks: { total: tasks.length, done: tasks.filter(t => t.status === 'done').length },
      })
      setLoading(false)
    })()
  }, [model.id])

  const contractValidated = !!model.contract_validated_at

  return (
    <div className="space-y-3 pt-2">
      <SectionCard
        icon={<FileText size={20} />}
        title={t('home.contract.title')}
        subtitle={state.contract === 'done' ? t('home.contract.done') : t('home.contract.todo')}
        status={state.contract}
        onClick={() => nav('/contract')}
        accent="text-accent-blue"
      />
      <SectionCard
        icon={<User size={20} />}
        title={t('home.persona.title')}
        subtitle={
          !contractValidated ? t('home.locked') :
          state.persona === 'done' ? t('home.persona.done') :
          state.persona === 'in_progress' ? t('home.persona.in_progress') :
          t('home.persona.todo')
        }
        status={state.persona}
        locked={!contractValidated}
        onClick={() => contractValidated ? nav('/persona') : nav('/contract')}
        accent="text-accent-pink"
      />
      <SectionCard
        icon={<ClipboardList size={20} />}
        title={t('home.tasks.title')}
        subtitle={
          !contractValidated ? t('home.locked') :
          loading ? '...' :
          state.tasks.total === 0 ? t('home.tasks.empty') :
          `${state.tasks.done} / ${state.tasks.total}`
        }
        status={loading ? 'todo' : state.tasks.total > 0 && state.tasks.done === state.tasks.total ? 'done' : state.tasks.done > 0 ? 'in_progress' : 'todo'}
        locked={!contractValidated}
        onClick={() => contractValidated ? nav('/todo') : nav('/contract')}
        accent="text-accent-purple-light"
      />
    </div>
  )
}

function SectionCard({
  icon, title, subtitle, status, locked, onClick, accent,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
  status: Status; locked?: boolean; onClick: () => void; accent: string
}) {
  const StatusIcon = locked ? Lock : status === 'done' ? CheckCircle : status === 'in_progress' ? Clock : AlertCircle
  const statusClass = locked ? 'text-text-muted/40' : status === 'done' ? 'text-accent-green' : status === 'in_progress' ? 'text-accent-orange' : 'text-text-muted'
  return (
    <button
      onClick={onClick}
      className={`card w-full flex items-center gap-4 active:scale-[0.99] transition-transform text-left ${locked ? 'opacity-50' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl bg-bg-hover flex items-center justify-center flex-shrink-0 ${locked ? 'text-text-muted/40' : accent}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-sm ${locked ? 'text-text-muted' : 'text-text-primary'}`}>{title}</h3>
        <p className="text-text-secondary text-xs mt-0.5">{subtitle}</p>
      </div>
      <StatusIcon size={18} className={statusClass} />
      {!locked && <ChevronRight size={16} className="text-text-muted" />}
    </button>
  )
}
