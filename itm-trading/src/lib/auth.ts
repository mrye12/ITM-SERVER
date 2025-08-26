import { redirect } from "next/navigation"
import { getServerSupabase } from "./supabase/auth"

export async function requireUser() {
  const supabase = await getServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login")
  return data.user
}
