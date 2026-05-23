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
  persona_validated_at?: string | null
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
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) return null

  const { data, error } = await supabase
    .from('models')
    .select('id, name, first_name, last_name, nationality, auth_user_id, contract_validated_at, persona_validated_at')
    .eq('auth_user_id', u.user.id)
    .maybeSingle()
  if (error) { console.error('getCurrentModel', error); return null }
  if (data) return data as ModelProfile

  // Première connexion : lier via email
  const { error: rpcErr } = await supabase.rpc('link_model_to_auth_user')
  if (rpcErr) { console.error('link_model_to_auth_user', rpcErr); return null }

  const { data: linked } = await supabase
    .from('models')
    .select('id, name, first_name, last_name, nationality, auth_user_id, contract_validated_at, persona_validated_at')
    .eq('auth_user_id', u.user.id)
    .maybeSingle()
  return linked as ModelProfile | null
}

export interface ManagerProfile {
  id: string          // = auth_user_id (profiles.id)
  name: string        // profiles.full_name
  role: string        // profiles.role
}

export async function getCurrentManager(): Promise<ManagerProfile | null> {
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) return null
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', u.user.id)
    .in('role', ['manager', 'admin', 'agency'])
    .maybeSingle()
  if (!data) return null
  return { id: data.id, name: data.full_name, role: data.role }
}

export async function signOut() {
  await supabase.auth.signOut()
}
