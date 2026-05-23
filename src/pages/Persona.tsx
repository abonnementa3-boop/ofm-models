import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Save, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PERSONA_SECTIONS, countAnswered, localizeOption, type PersonaQuestion } from '../lib/personaQuestions'
import type { ModelProfile } from '../lib/session'
import { pickText, useLocale, useT } from '../lib/i18n'

type Responses = Record<string, any>

export default function Persona({ model }: { model: ModelProfile }) {
  const t = useT()
  const locale = useLocale()
  const [responses, setResponses] = useState<Responses>({})
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string>('')
  const [openSection, setOpenSection] = useState<string>(PERSONA_SECTIONS[0].key)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('model_persona_responses')
        .select('responses, completed_at')
        .eq('model_id', model.id)
        .maybeSingle()
      if (error) console.error(error)
      if (data) {
        setResponses(data.responses || {})
        setCompletedAt(data.completed_at)
      }
      setLoading(false)
    })()
  }, [model.id])

  const progress = useMemo(() => countAnswered(responses), [responses])
  const pct = progress.total > 0 ? Math.round((progress.answered / progress.total) * 100) : 0

  const handleChange = (key: string, value: any) => {
    setResponses(r => ({ ...r, [key]: value }))
  }

  // Sync silencieuse vers Notion (ne bloque pas l'UI, erreurs ignorées)
  const syncToNotion = async (currentResponses: Responses) => {
    try {
      await fetch('/api/notion-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId:   model.id,
          modelName: model.name || model.first_name || model.id,
          responses: currentResponses,
        }),
      })
    } catch {
      // Silencieux — la sync Notion ne doit pas bloquer la sauvegarde
    }
  }

  const handleBlur = async (key: string) => {
    setSavingKey(key)
    try {
      // Upsert : si pas de row, on crée. Sinon on update les responses.
      const { error } = await supabase
        .from('model_persona_responses')
        .upsert(
          {
            model_id: model.id,
            responses,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'model_id' },
        )
      if (error) console.error(error)
      else syncToNotion(responses) // sync Notion en arrière-plan
    } finally {
      setTimeout(() => setSavingKey(''), 600)
    }
  }

  const handleMarkComplete = async () => {
    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('model_persona_responses')
        .upsert(
          {
            model_id: model.id,
            responses,
            completed_at: now,
            updated_at: now,
          },
          { onConflict: 'model_id' },
        )
      if (error) throw error
      setCompletedAt(now)
      syncToNotion(responses) // sync finale vers Notion
    } catch (e: any) {
      alert('Erreur : ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="pt-8 flex justify-center"><Loader2 className="animate-spin text-accent-purple" /></div>
  }

  return (
    <div className="pt-4 space-y-4 pb-4">
      <div>
        <h2 className="text-text-primary font-bold text-xl mb-1">{t('persona.title')}</h2>
        <p className="text-text-secondary text-xs leading-relaxed">{t('persona.subtitle')}</p>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-text-primary font-semibold text-sm">{t('persona.progress')}</p>
            <p className="text-text-muted text-xs">{progress.answered} / {progress.total} {t('persona.questions_count')}</p>
          </div>
          <span className="text-2xl font-bold text-accent-purple-light">{pct}%</span>
        </div>
        <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-purple to-accent-pink transition-all" style={{ width: `${pct}%` }} />
        </div>
        {completedAt && (
          <p className="text-accent-green text-xs flex items-center gap-1.5 mt-3">
            <CheckCircle2 size={13} /> {t('persona.completed_on')} {new Date(completedAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR')}
          </p>
        )}
      </div>

      {/* Sections accordéon */}
      {PERSONA_SECTIONS.map(section => {
        const sectionAnswers = section.questions.filter(q => {
          const v = responses[q.key]
          return v !== undefined && v !== null && String(v).trim() !== ''
        }).length
        const total = section.questions.length
        const isOpen = openSection === section.key
        const isDone = sectionAnswers === total
        return (
          <div key={section.key} className="card !p-0 overflow-hidden">
            <button
              onClick={() => setOpenSection(isOpen ? '' : section.key)}
              className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-bg-hover/40"
            >
              {isOpen ? <ChevronDown size={16} className="text-text-muted flex-shrink-0" /> : <ChevronRight size={16} className="text-text-muted flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm ${isDone ? 'text-accent-green' : 'text-text-primary'}`}>{pickText(section.title, locale)}</h3>
                {section.description && <p className="text-text-muted text-xs mt-0.5">{pickText(section.description, locale)}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isDone ? 'bg-accent-green/15 text-accent-green' : 'bg-bg-hover text-text-muted'}`}>
                {sectionAnswers}/{total}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-bg-border p-4 space-y-4">
                {section.questions.map(q => (
                  <QuestionField
                    key={q.key}
                    question={q}
                    value={responses[q.key]}
                    saving={savingKey === q.key}
                    onChange={v => handleChange(q.key, v)}
                    onBlur={() => handleBlur(q.key)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Bouton "J'ai fini" */}
      <button
        onClick={handleMarkComplete}
        disabled={submitting || pct < 60}
        className="btn-primary w-full"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        {completedAt ? t('persona.update') : t('persona.mark_complete')}
      </button>
      {pct < 60 && !completedAt && (
        <p className="text-text-muted text-xs text-center">{t('persona.min_60')} ({pct}%)</p>
      )}
    </div>
  )
}

function QuestionField({
  question, value, saving, onChange, onBlur,
}: {
  question: PersonaQuestion
  value: any
  saving: boolean
  onChange: (v: any) => void
  onBlur: () => void
}) {
  const t = useT()
  const locale = useLocale()
  const v = value ?? ''
  const placeholder = question.placeholder ? pickText(question.placeholder, locale) : undefined

  return (
    <div>
      <label className="text-text-secondary text-xs font-medium mb-1.5 block flex items-center gap-1.5">
        {pickText(question.label, locale)}
        {saving && <Save size={10} className="text-accent-purple animate-pulse" />}
        {!saving && v && <CheckCircle2 size={10} className="text-accent-green/80" />}
      </label>
      {question.type === 'textarea' ? (
        <textarea
          value={v}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="input resize-none min-h-[60px]"
        />
      ) : question.type === 'select' ? (
        <select value={v} onChange={e => { onChange(e.target.value); setTimeout(onBlur, 0) }} className="input">
          <option value="">{t('common.choose')}</option>
          {question.options?.map(o => {
            const label = localizeOption(o, locale)
            return <option key={label} value={label}>{label}</option>
          })}
        </select>
      ) : question.type === 'yes_no' ? (
        <div className="flex gap-2">
          {(['yes','no'] as const).map(opt => {
            const active = v === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setTimeout(onBlur, 0) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  active
                    ? opt === 'yes'
                      ? 'bg-accent-green/20 border-accent-green text-accent-green'
                      : 'bg-bg-hover border-bg-border text-text-secondary'
                    : 'border-bg-border text-text-muted'
                }`}
              >
                {opt === 'yes' ? t('common.yes') : t('common.no')}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          type={question.type === 'number' ? 'number' : 'text'}
          value={v}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="input"
        />
      )}
    </div>
  )
}
