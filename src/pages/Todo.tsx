import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Clock, Loader2, ExternalLink, FileText, Paperclip, Upload, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ModelProfile } from '../lib/session'
import { useT, useLocale } from '../lib/i18n'

const UPLOADABLE = new Set(['sm', 'instagram', 'x_twitter', 'sfs', 'mym', 'onlyfans', 'tiktok'])

const SECTION_ORDER = ['agency', 'sm', 'instagram', 'x_twitter', 'sfs', 'mym', 'onlyfans', 'tiktok', 'other']
type CatKey = 'todo.cat.agency' | 'todo.cat.sm' | 'todo.cat.instagram' | 'todo.cat.x_twitter' | 'todo.cat.sfs' | 'todo.cat.mym' | 'todo.cat.onlyfans' | 'todo.cat.tiktok' | 'todo.cat.other'
const CAT_LABEL: Record<string, CatKey> = {
  agency: 'todo.cat.agency', sm: 'todo.cat.sm', instagram: 'todo.cat.instagram',
  x_twitter: 'todo.cat.x_twitter', sfs: 'todo.cat.sfs', mym: 'todo.cat.mym',
  onlyfans: 'todo.cat.onlyfans', tiktok: 'todo.cat.tiktok', other: 'todo.cat.other',
}

type TaskStatus = 'todo' | 'in_progress' | 'pending_validation' | 'done' | 'validated'

interface Task {
  id: string
  title: string
  description: string | null
  category: string | null
  pdf_url: string | null
  reference_url: string | null
  status: TaskStatus
  done_at: string | null
}

interface UploadRow {
  id: string
  task_id: string
  label: string | null
  storage_path: string
  mime_type: string | null
  file_size: number | null
  uploaded_at: string
}


export default function Todo({ model }: { model: ModelProfile }) {
  const t = useT()
  const locale = useLocale()
  const [tasks, setTasks] = useState<Task[]>([])
  const [uploads, setUploads] = useState<UploadRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [tasksRes, uploadsRes] = await Promise.all([
      supabase
        .from('model_portal_tasks')
        .select('id, title, description, category, pdf_url, reference_url, status, done_at')
        .eq('model_id', model.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('model_portal_uploads')
        .select('id, task_id, label, storage_path, mime_type, file_size, uploaded_at')
        .eq('model_id', model.id)
        .order('uploaded_at', { ascending: false }),
    ])
    if (tasksRes.error) console.error(tasksRes.error)
    if (uploadsRes.error) console.error(uploadsRes.error)
    setTasks((tasksRes.data || []) as Task[])
    setUploads((uploadsRes.data || []) as UploadRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel(`tasks-${model.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'model_portal_tasks',
        filter: `model_id=eq.${model.id}`,
      }, () => { load() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [model.id])

  const markPendingValidation = async (task: Task) => {
    const now = new Date().toISOString()
    await supabase
      .from('model_portal_tasks')
      .update({ status: 'pending_validation', done_at: now, updated_at: now })
      .eq('id', task.id)
    setTasks(ts => ts.map(tt => tt.id === task.id
      ? { ...tt, status: 'pending_validation', done_at: now }
      : tt,
    ))
  }

  const handleUpload = async (task: Task, files: FileList) => {
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${model.id}/${task.category || 'other'}/${task.id}_${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage
        .from('portal-uploads')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (upErr) { console.error(upErr); continue }

      const { data: row, error: dbErr } = await supabase
        .from('model_portal_uploads')
        .insert({
          model_id: model.id,
          task_id: task.id,
          category: task.category || 'other',
          label: file.name,
          storage_path: path,
          mime_type: file.type,
          file_size: file.size,
        })
        .select()
        .single()
      if (dbErr) console.error(dbErr)
      else setUploads(us => [row as UploadRow, ...us])
    }
  }

  const handleDeleteUpload = async (u: UploadRow) => {
    await supabase.storage.from('portal-uploads').remove([u.storage_path])
    await supabase.from('model_portal_uploads').delete().eq('id', u.id)
    setUploads(us => us.filter(x => x.id !== u.id))
  }

  const openUpload = async (u: UploadRow) => {
    const { data, error } = await supabase.storage
      .from('portal-uploads')
      .createSignedUrl(u.storage_path, 3600, { download: u.label || 'file' })
    if (error) { console.error(error); return }
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (loading) {
    return <div className="pt-8 flex justify-center"><Loader2 className="animate-spin text-accent-purple" /></div>
  }

  const active = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress')
  const pending = tasks.filter(t => t.status === 'pending_validation')
  const done = tasks.filter(t => t.status === 'done' || t.status === 'validated')
  const total = tasks.length
  const doneCount = done.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="pt-4 space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-text-primary font-bold text-xl">{t('todo.title')}</h2>
        {total > 0 && (
          <span className="text-text-muted text-xs">{doneCount}/{total} · {pct}%</span>
        )}
      </div>

      {total > 0 && (
        <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-purple to-accent-green transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {total === 0 ? (
        <div className="card text-center py-10 space-y-2">
          <CheckCircle2 size={36} className="mx-auto text-text-muted/30" />
          <p className="text-text-muted text-sm">{t('todo.empty')}</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (() => {
            const sections = SECTION_ORDER
              .map(cat => ({ cat, tasks: active.filter(t => (t.category || 'other') === cat) }))
              .filter(s => s.tasks.length > 0)
            const uncategorized = active.filter(t => t.category && !CAT_LABEL[t.category])
            return (
              <div className="space-y-4">
                {sections.map(section => (
                  <div key={section.cat} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                        {t(CAT_LABEL[section.cat])}
                      </p>
                      <div className="flex-1 h-px bg-bg-border" />
                    </div>
                    {section.tasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        taskUploads={uploads.filter(u => u.task_id === task.id)}
                        locale={locale}
                        onMarkDone={() => markPendingValidation(task)}
                        onUpload={files => handleUpload(task, files)}
                        onDeleteUpload={handleDeleteUpload}
                        onOpenUpload={openUpload}
                      />
                    ))}
                  </div>
                ))}
                {uncategorized.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    taskUploads={uploads.filter(u => u.task_id === task.id)}
                    locale={locale}
                    onMarkDone={() => markPendingValidation(task)}
                    onUpload={files => handleUpload(task, files)}
                    onDeleteUpload={handleDeleteUpload}
                    onOpenUpload={openUpload}
                  />
                ))}
              </div>
            )
          })()}

          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-accent-orange text-[10px] font-semibold uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Clock size={10} className="animate-pulse" />
                {t('todo.pending_section')} ({pending.length})
              </p>
              {pending.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  taskUploads={uploads.filter(u => u.task_id === task.id)}
                  locale={locale}
                  onMarkDone={null}
                  onUpload={files => handleUpload(task, files)}
                  onDeleteUpload={handleDeleteUpload}
                  onOpenUpload={openUpload}
                />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider px-1">
                {t('todo.done_section')} ({done.length})
              </p>
              {done.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  taskUploads={uploads.filter(u => u.task_id === task.id)}
                  locale={locale}
                  onMarkDone={null}
                  onUpload={files => handleUpload(task, files)}
                  onDeleteUpload={handleDeleteUpload}
                  onOpenUpload={openUpload}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TaskCard({
  task, taskUploads, locale, onMarkDone, onUpload, onDeleteUpload, onOpenUpload,
}: {
  task: Task
  taskUploads: UploadRow[]
  locale: string
  onMarkDone: (() => void) | null
  onUpload: (files: FileList) => void
  onDeleteUpload: (u: UploadRow) => void
  onOpenUpload: (u: UploadRow) => void
}) {
  const t = useT()
  const isPending = task.status === 'pending_validation'
  const isDone = task.status === 'done' || task.status === 'validated'
  const dateLocale = locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR'
  const isUploadable = task.category ? UPLOADABLE.has(task.category) : false
  const [showUploads, setShowUploads] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    await onUpload(files)
    setUploading(false)
    setShowUploads(true)
  }

  return (
    <div className={`card transition-opacity ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isDone ? (
            <CheckCircle2 size={22} className="text-accent-green" />
          ) : isPending ? (
            <Clock size={22} className="text-accent-orange animate-pulse" />
          ) : (
            <button
              onClick={onMarkDone ?? undefined}
              className="active:scale-95 transition-transform"
              title={t('todo.mark_done')}
            >
              <Circle size={22} className="text-text-muted" />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">{task.description}</p>
              )}
              {isPending && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-accent-orange">
                  <Clock size={9} /> {t('todo.pending_badge')}
                </span>
              )}
              {isDone && task.done_at && (
                <p className="text-text-muted text-[10px] mt-1">
                  ✓ {new Date(task.done_at).toLocaleDateString(dateLocale)}
                </p>
              )}
            </div>
            {task.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-text-muted flex-shrink-0 mt-0.5">
                {task.category}
              </span>
            )}
          </div>

          {!isDone && !isPending && onMarkDone && (
            <div className="mt-2">
              <button
                onClick={onMarkDone}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green/20 transition-colors active:scale-95"
              >
                {t('todo.mark_done')}
              </button>
            </div>
          )}

          {(task.pdf_url || task.reference_url) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {task.pdf_url && (
                <a
                  href={task.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-bg-border text-text-secondary hover:border-accent-blue/40 hover:text-accent-blue"
                >
                  <FileText size={11} /> PDF
                </a>
              )}
              {task.reference_url && (
                <a
                  href={task.reference_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-bg-border text-text-secondary hover:border-accent-purple/40 hover:text-accent-purple-light"
                >
                  <ExternalLink size={11} /> {t('todo.reference')}
                </a>
              )}
            </div>
          )}

          {isUploadable && (
            <div className="mt-2 pt-2 border-t border-bg-border/50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowUploads(s => !s)}
                  className={`flex items-center gap-1.5 text-xs ${taskUploads.length > 0 ? 'text-accent-purple-light' : 'text-text-muted'} hover:text-text-secondary`}
                >
                  <Paperclip size={12} />
                  {taskUploads.length > 0
                    ? `${taskUploads.length} ${taskUploads.length > 1 ? t('todo.files_plural') : t('todo.file_singular')}`
                    : t('todo.no_files')
                  }
                </button>
                {!isDone && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
                    />
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-bg-border text-text-secondary hover:border-accent-purple/40 hover:bg-accent-purple/10 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading
                        ? <><Loader2 size={11} className="animate-spin" /> {t('todo.uploading')}</>
                        : <><Upload size={11} /> {t('todo.add_files')}</>
                      }
                    </span>
                  </label>
                )}
              </div>

              {showUploads && taskUploads.length > 0 && (
                <div className="mt-2 space-y-1">
                  {taskUploads.map(u => (
                    <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-bg-hover/60">
                      <Paperclip size={11} className="text-text-muted flex-shrink-0" />
                      <button
                        onClick={() => onOpenUpload(u)}
                        className="flex-1 min-w-0 text-left text-xs text-text-secondary hover:text-accent-purple-light truncate"
                      >
                        {u.label || 'fichier'}
                        {u.file_size != null && (
                          <span className="text-text-muted ml-1.5">
                            {u.file_size < 1024 * 1024
                              ? `${(u.file_size / 1024).toFixed(0)} Ko`
                              : `${(u.file_size / 1024 / 1024).toFixed(1)} Mo`
                            }
                          </span>
                        )}
                      </button>
                      {!isDone && (
                        <button
                          onClick={() => onDeleteUpload(u)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-accent-red/20 text-text-muted hover:text-accent-red flex-shrink-0"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
