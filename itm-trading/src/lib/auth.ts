import { getServerSupabase } from "./supabase/auth"

export async function requireUser() {
  const supabase = await getServerSupabase()
  const { data } = await supabase.auth.getUser()
  
  if (!data.user) {
    throw new Error('User not authenticated')
  }
  
  return data.user
}
