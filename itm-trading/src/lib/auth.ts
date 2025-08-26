import { getServerSupabase } from "./supabase/auth"
import { getMockUser } from "./mock-auth"

export async function requireUser() {
  try {
    const supabase = await getServerSupabase()
    const { data } = await supabase.auth.getUser()
    if (data.user) return data.user
  } catch (error) {
    console.warn('Supabase auth failed, using mock auth:', error)
  }
  
  // For demo purposes, return mock user
  const mockUser = getMockUser()
  console.log('Using mock user for demo:', mockUser)
  return mockUser
}
