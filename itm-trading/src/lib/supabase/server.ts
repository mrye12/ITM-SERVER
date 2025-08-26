import { createClient } from '@supabase/supabase-js'

// Server-only admin client with service role key
export const supabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, serviceKey, { 
    auth: { 
      autoRefreshToken: false, 
      persistSession: false 
    } 
  })
}


