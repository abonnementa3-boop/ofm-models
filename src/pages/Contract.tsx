import { useEffect, useState } from 'react'
import { Download, Upload, CheckCircle2, Clock, FileText, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ModelProfile } from '../lib/session'
import { useLocale, useT } from '../lib/i18n'

interface ContractDoc {
  id: string
  label: string | null
  storage_path: string | null
  drive_url: string | null
  uploaded_at: string
}

interface ContractSignature {
  id: string
  storage_path: string
  signed_at: string
}

export default function Contract({ model, validatedAt }: { model: ModelProfile; validatedAt?: string | null }) {
  const t = useT()
  const locale = useLocale()
  const dateLocale = locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR'
  const [doc, setDoc] = useState<ContractDoc | null>(null)
  const [signature, setSignature] = useState<ContractSignature | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const [docRes, sigRes] = await Promise.all([
      supabase
        .from('model_documents')
        .select('id, label, storage_path, drive_url, uploaded_at')
        .eq('model_id', model.id)
        .eq('doc_type', 'contract_to_sign')
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('model_contract_signatures')
        .select('id, storage_path, signed_at')
        .eq('model_id', model.id)
        .maybeSingle(),
    ])
    if (docRes.data) setDoc(docRes.data as ContractDoc)
    if (sigRes.data) setSignature(sigRes.data as ContractSignature)
    setLoading(false)
  }

  useEffect(() => { load() }, [model.id])

  const handleDownload = async () => {
    if (!doc) return
    setError('')
    try {
      if (doc.drive_url) {
        window.open(doc.drive_url, '_blank')
        return
      }
      if (doc.storage_path) {
        const { data, error } = await supabase.storage
          .from('model-documents')
          .createSignedUrl(doc.storage_path, 3600, { download: doc.label || 'contrat.pdf' })
        if (error) throw error
        if (data?.signedUrl) window.open(data.signedUrl, '_blank')
      }
    } catch (e: any) {
      setError('Impossible de télécharger : ' + e.message)
    }
  }

  const handleUpload = async (file: File) => {
    setError('')
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      const path = `${model.id}/contract_signed/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('portal-uploads')
        .upload(path, file, { upsert: false, contentType: file.type || 'application/pdf' })
      if (upErr) throw upErr

      const payload = {
        model_id: model.id,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type || 'application/pdf',
        signed_at: new Date().toISOString(),
      }
      const { error: dbErr } = await supabase
        .from('model_contract_signatures')
        .upsert(payload, { onConflict: 'model_id' })
      if (dbErr) throw dbErr

      await load()
    } catch (e: any) {
      setError('Erreur upload : ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="pt-8 flex justify-center"><Loader2 className="animate-spin text-accent-purple" /></div>
  }

  return (
    <div className="pt-4 space-y-4">
      <div>
        <h2 className="text-text-primary font-bold text-xl mb-1">{t('contract.title')}</h2>
        <p className="text-text-secondary text-xs leading-relaxed">
          {t('contract.subtitle')} <strong className="text-text-primary">Markup</strong> {t('contract.markup_tool')}
        </p>
      </div>

      {/* Section 1 — Contrat à signer */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-accent-blue" />
          <h3 className="text-text-primary font-semibold text-sm">{t('contract.section_download')}</h3>
        </div>
        {doc ? (
          <>
            <p className="text-text-secondary text-xs">
              {doc.label || 'Contract'} · {t('contract.added_on')} {new Date(doc.uploaded_at).toLocaleDateString(dateLocale)}
            </p>
            <button onClick={handleDownload} className="btn-primary w-full">
              {doc.drive_url ? <ExternalLink size={14} /> : <Download size={14} />}
              {doc.drive_url ? t('contract.open_drive') : t('contract.download_pdf')}
            </button>
            <details className="text-text-muted text-xs leading-relaxed">
              <summary className="cursor-pointer text-text-secondary mb-1">{t('contract.how_to_sign')}</summary>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>{t('contract.howto.1')}</li>
                <li>{t('contract.howto.2')}</li>
                <li>{t('contract.howto.3')}</li>
                <li>{t('contract.howto.4')}</li>
                <li>{t('contract.howto.5')}</li>
                <li>{t('contract.howto.6')}</li>
              </ol>
            </details>
          </>
        ) : (
          <div className="flex items-start gap-2 text-text-muted text-xs bg-bg-hover rounded-xl p-3">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-accent-orange" />
            <span>{t('contract.preparing')}</span>
          </div>
        )}
      </div>

      {/* Section 2 — Upload du contrat signé */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Upload size={18} className="text-accent-pink" />
          <h3 className="text-text-primary font-semibold text-sm">{t('contract.section_upload')}</h3>
        </div>

        {validatedAt ? (
          <div className="flex items-start gap-2 text-accent-green text-xs bg-accent-green/10 border border-accent-green/30 rounded-xl p-3">
            <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>{t('contract.validated_title')}</strong> {t('contract.validated_body')} {new Date(validatedAt).toLocaleDateString(dateLocale)}.
              <br />{t('contract.unlocks_access')}
            </span>
          </div>
        ) : signature ? (
          <div className="flex items-start gap-2 text-accent-orange text-xs bg-accent-orange/10 border border-accent-orange/30 rounded-xl p-3">
            <Clock size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>{t('contract.waiting_validation')}</strong> ({t('contract.sent_on')} {new Date(signature.signed_at).toLocaleDateString(dateLocale)}).
              <br />{t('contract.resend')}
            </span>
          </div>
        ) : null}

        <label className="block">
          <input
            type="file"
            accept="application/pdf,image/*"
            disabled={uploading || !doc}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleUpload(f)
              e.target.value = ''
            }}
            className="hidden"
          />
          <span className={`btn-secondary w-full cursor-pointer ${uploading || !doc ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? t('contract.uploading') : signature ? t('contract.resend_new') : t('contract.choose_pdf')}
          </span>
        </label>
        {!doc && <p className="text-text-muted text-xs">{t('contract.no_doc_yet')}</p>}
        {error && <p className="text-accent-red text-xs">{error}</p>}
      </div>
    </div>
  )
}
