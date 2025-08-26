'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from './server'

export type RoleCode = 'admin' | 'staff' | 'viewer'

export async function getServerSupabase() {
  // Server-side client berdasar cookie user (BUKAN service role)
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
  return supabase
}

export async function getSessionUser() {
  const supabase = await getServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getUserRole(): Promise<RoleCode | null> {
  const user = await getSessionUser()
  if (!user) return null

  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('profiles')
    .select('roles!inner(code)')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null
  // @ts-ignore
  return data.roles.code as RoleCode
}

export async function requireRole(allowed: RoleCode[]) {
  const role = await getUserRole()
  if (!role || !allowed.includes(role)) {
    return { ok: false as const, role }
  }
  return { ok: true as const, role }
}

export async function getUserProfile() {
  const user = await getSessionUser()
  if (!user) return null

  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('profiles')
    .select('*, roles!inner(code, name)')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return data
}

