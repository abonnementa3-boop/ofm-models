import { useState, useEffect, useRef } from 'react'
import { Film, Upload, Loader2, CheckCircle, AlertCircle, Download, RefreshCw, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { signOut } from '../lib/session'
import type { ManagerProfile } from '../lib/session'
import { useNavigate } from 'react-router-dom'

type JobStatus = 'idle' | 'uploading' | 'pending' | 'processing' | 'done' | 'error'

interface RemoteJob {
  id: string
  model_id: string
  status: string
  input_url: string
  result_url?: string
  error?: string
  count: number
  created_at: string
}

interface ModelOption {
  id: string
  name: string
  first_name?: string | null
}

const CITY_PRESETS = [
  { name: 'Paris',     lat: 48.8566, lon: 2.3522 },
  { name: 'Lyon',      lat: 45.7640, lon: 4.8357 },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
  { name: 'Nice',      lat: 43.7102, lon: 7.2620 },
  { name: 'Miami',     lat: 25.7617, lon: -80.1918 },
  { name: 'Dubai',     lat: 25.2048, lon: 55.2708 },
]

export default function MetaChangeManager({ manager }: { manager: ManagerProfile }) {
  const nav = useNavigate()
  const [models, setModels] = useState<ModelOption[]>([])
  const [selectedModelId, setSelectedModelId] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [count, setCount] = useState(10)
  const [cityIdx, setCityIdx] = useState(0)
  const [status, setStatus] = useState<JobStatus>('idle')
  const [error, setError] = useState('')
  const [currentJob, setCurrentJob] = useState<RemoteJob | null>(null)
  const [history, setHistory] = useState<RemoteJob[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // Charge la liste des modèles
  useEffect(() => {
    supabase.from('models')
      .select('id, name, first_name')
      .order('name')
      .then(({ data }) => { if (data) setModels(data) })
  }, [])

  // Charge l'historique de tous les jobs
  useEffect(() => {
    supabase.from('metachange_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setHistory(data) })
  }, [])

  // Realtime sur le job en cours
  useEffect(() => {
    if (!currentJob) return
    const jobId = currentJob.id
    const ch = supabase.channel(`mc_mgr_${jobId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'metachange_jobs', filter: `id=eq.${jobId}` }, payload => {
        const updated = (payload as any).new as RemoteJob
        setCurrentJob(updated)
        setHistory(prev => [updated, ...prev.filter(j => j.id !== jobId)])
        if (updated.status === 'done') setStatus('done')
        if (updated.status === 'error') { setStatus('error'); setError(updated.error || 'Erreur inconnue') }
        if (updated.status === 'processing') setStatus('processing')
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [currentJob?.id])

  const launch = async () => {
    if (!file || !selectedModelId) return
    setStatus('uploading')
    setError('')
    setCurrentJob(null)

    const jobId = crypto.randomUUID()
    const ext = file.name.split('.').pop() || 'mp4'
    const storagePath = `uploads/${selectedModelId}/${jobId}/input.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('metachange')
      .upload(storagePath, file, { contentType: file.type || 'video/mp4', upsert: false })
    if (uploadErr) { setStatus('error'); setError(uploadErr.message); return }

    const { data: pub } = supabase.storage.from('metachange').getPublicUrl(storagePath)
    const city = CITY_PRESETS[cityIdx]

    const { data: job, error: insertErr } = await supabase.from('metachange_jobs').insert({
      id: jobId,
      model_id: selectedModelId,
      status: 'pending',
      input_url: pub.publicUrl,
      count,
      config: {
        deviceModel: 'iPhone 17 Pro Max',
        iosVersion: '18.4',
        camera: 'rear',
        latitude: city.lat,
        longitude: city.lon,
        locationName: city.name,
        baseDate: Date.now(),
        trimMaxMs: 120,
        dateOffsetHours: 72,
      },
    }).select().single()

    if (insertErr || !job) { setStatus('error'); setError(insertErr?.message || 'Erreur insertion'); return }

    setCurrentJob(job)
    setStatus('pending')
    setHistory(prev => [job, ...prev.filter(j => j.id !== jobId)])
  }

  const reset = () => {
    setFile(null)
    setStatus('idle')
    setError('')
    setCurrentJob(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const modelLabel = (modelId: string) => {
    const m = models.find(x => x.id === modelId)
    return m ? (m.first_name || m.name) : modelId.slice(0, 8)
  }

  const statusLabel: Record<string, string> = {
    pending: 'En attente du PC…',
    processing: 'Traitement en cours…',
    done: 'Terminé',
    error: 'Erreur',
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-bg-body/95 backdrop-blur z-10">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wider">Espace manager</p>
          <h1 className="text-text-primary font-bold text-lg">Bonjour {manager.name} 👋</h1>
        </div>
        <button
          onClick={async () => { await signOut(); nav('/login', { replace: true }) }}
          className="w-10 h-10 rounded-xl border border-bg-border flex items-center justify-center text-text-muted active:scale-95"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main className="flex-1 px-5 pb-10 space-y-5">
        <div>
          <h2 className="text-text-primary font-bold text-lg">MetaChange</h2>
          <p className="text-text-secondary text-sm">Génère des copies uniques pour une modèle.</p>
        </div>

        {/* Sélection modèle */}
        <div>
          <p className="text-text-muted text-xs mb-1.5 font-medium">Modèle</p>
          {models.length === 0 ? (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Loader2 size={13} className="animate-spin" /> Chargement…
            </div>
          ) : (
            <select
              value={selectedModelId}
              onChange={e => setSelectedModelId(e.target.value)}
              className="w-full bg-bg-card border border-bg-border rounded-xl text-text-primary text-sm px-3 py-2.5"
            >
              <option value="">— Sélectionne une modèle —</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.first_name || m.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* File picker */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-8 cursor-pointer transition-colors ${
            file ? 'border-accent-purple/50 bg-accent-purple/5' : 'border-bg-border hover:border-text-muted'
          }`}
        >
          {file ? (
            <>
              <Film size={28} className="text-accent-purple-light" />
              <p className="text-text-primary text-sm font-semibold text-center px-4 break-all">{file.name}</p>
              <p className="text-text-muted text-xs">{(file.size / 1024 / 1024).toFixed(1)} Mo</p>
            </>
          ) : (
            <>
              <Upload size={28} className="text-text-muted" />
              <p className="text-text-secondary text-sm font-medium">Sélectionne une vidéo</p>
              <p className="text-text-muted text-xs">MP4, MOV…</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setStatus('idle'); setError('') } }} />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div>
            <p className="text-text-muted text-xs mb-1.5 font-medium">Nombre de copies</p>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 25, 50, 100].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
                    count === n ? 'bg-accent-purple/20 text-accent-purple-light border-accent-purple/40' : 'bg-bg-card border-bg-border text-text-secondary active:bg-bg-hover'
                  }`}>{n}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-text-muted text-xs mb-1.5 font-medium">Ville GPS</p>
            <div className="grid grid-cols-3 gap-2">
              {CITY_PRESETS.map((c, i) => (
                <button key={c.name} onClick={() => setCityIdx(i)}
                  className={`py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    cityIdx === i ? 'bg-accent-purple/20 text-accent-purple-light border-accent-purple/40' : 'bg-bg-card border-bg-border text-text-secondary active:bg-bg-hover'
                  }`}>{c.name}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Action */}
        {status === 'idle' || status === 'error' ? (
          <>
            <button
              onClick={launch}
              disabled={!file || !selectedModelId}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm bg-accent-purple disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Envoyer au PC — {count} copie{count > 1 ? 's' : ''}
            </button>
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {((_s: string) => (
            <div className={`px-4 py-4 rounded-2xl border flex flex-col gap-3 ${
              _s === 'done'  ? 'bg-green-500/8 border-green-500/20' :
              _s === 'error' ? 'bg-red-500/8 border-red-500/20'     :
                               'bg-accent-purple/5 border-accent-purple/20'
            }`}>
              <div className="flex items-center gap-3">
                {_s === 'done'  ? <CheckCircle size={20} className="text-green-400" /> :
                 _s === 'error' ? <AlertCircle  size={20} className="text-red-400" /> :
                                  <Loader2      size={20} className="animate-spin text-accent-purple-light" />}
                <div className="flex-1">
                  <p className={`text-sm font-bold ${_s === 'done' ? 'text-green-400' : _s === 'error' ? 'text-red-400' : 'text-accent-purple-light'}`}>
                    {statusLabel[status] || status}
                  </p>
                  <p className="text-text-muted text-xs">
                    {count} vidéo{count > 1 ? 's' : ''} · {CITY_PRESETS[cityIdx].name} · {modelLabel(selectedModelId)}
                  </p>
                </div>
              </div>

              {status === 'done' && currentJob?.result_url && (
                <a href={currentJob.result_url} target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold active:scale-[0.98] transition-transform">
                  <Download size={15} /> Télécharger le ZIP
                </a>
              )}

              {status === 'pending' && (
                <p className="text-text-muted text-xs text-center">Le CRM sur PC va détecter ce job et démarrer automatiquement.</p>
              )}
            </div>
            ))(status)}

            <button onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-bg-border text-text-muted text-sm active:bg-bg-hover transition-colors">
              <RefreshCw size={13} /> Nouveau job
            </button>
          </div>
        )}

        {/* Historique */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Historique</p>
            {history.map(j => (
              <div key={j.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-card border border-bg-border">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold flex-shrink-0 ${
                  j.status === 'done'       ? 'bg-green-500/15 text-green-400 border-green-500/25' :
                  j.status === 'processing' ? 'bg-accent-purple/15 text-accent-purple-light border-accent-purple/25' :
                  j.status === 'error'      ? 'bg-red-500/15 text-red-400 border-red-500/25' :
                                              'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
                }`}>{j.status}</span>
                <span className="text-xs text-text-secondary flex-1">{modelLabel(j.model_id)} · {j.count}×</span>
                <span className="text-[10px] text-text-muted flex-shrink-0">
                  {new Date(j.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
                {j.status === 'done' && j.result_url && (
                  <a href={j.result_url} target="_blank" rel="noreferrer" className="text-green-400 p-1">
                    <Download size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
