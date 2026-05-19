import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

export interface ModelProfile {
  id: string
  name: string
  first_name?: string | null
  last_name?: string | null
  nationality?: string | null
  auth_user_id?: string | null
  contract_validated_at?: string | null
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, loading }
}

export async function getCurrentModel(): Promise<ModelProfile | null> {
  const { data: u, error: userErr } = await supabase.auth.getUser()
  console.log('[getCurrentModel] getUser:', u?.user?.id, u?.user?.email, userErr?.message)
  if (!u.user) return null

  const { data, error } = await supabase
    .from('models')
    .select('id, name, first_name, last_name, nationality, auth_user_id, contract_validated_at')
    .eq('auth_user_id', u.user.id)
    .maybeSingle()
  console.log('[getCurrentModel] by auth_user_id:', data?.name, error?.message)
  if (error) { console.error('getCurrentModel select error:', error); return null }
  if (data) return data as ModelProfile

  // Première connexion : lier via email
  const { data: rpcData, error: rpcErr } = await supabase.rpc('link_model_to_auth_user')
  console.log('[getCurrentModel] rpc result:', JSON.stringify(rpcData), rpcErr?.message)
  if (rpcErr) { console.error('link_model_to_auth_user error:', rpcErr); return null }

  const { data: linked, error: linkedErr } = await supabase
    .from('models')
    .select('id, name, first_name, last_name, nationality, auth_user_id, contract_validated_at')
    .eq('auth_user_id', u.user.id)
    .maybeSingle()
  console.log('[getCurrentModel] after link:', linked?.name, linkedErr?.message)
  return linked as ModelProfile | null
}

export async function signOut() {
  await supabase.auth.signOut()
}
