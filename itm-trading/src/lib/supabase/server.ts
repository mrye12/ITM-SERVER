import { createClient } from '@supabase/supabase-js'

// Server-only admin client with service role key
export const supabaseAdmin = () => {
  const supabaseUrl = process.env.ITM_SUPABASE_URL || 
                     process.env.itm_NEXT_PUBLIC_SUPABASE_URL ||
                     process.env.NEXT_PUBLIC_SUPABASE_URL ||
                     'https://jbhcrqtfbhzuwcljgxph.supabase.co'
                     
  const serviceKey = process.env.ITM_SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.itm_SUPABASE_SERVICE_ROLE_KEY ||
                    process.env.SUPABASE_SERVICE_ROLE_KEY ||
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaGNycXRmYmh6dXdjbGpneHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjAzMjcyNCwiZXhwIjoyMDcxNjA4NzI0fQ.1nAZNJECo9tC4FDvlFQ0gWQiSLjbZoCPNzl0RdLZvyw'

  return createClient(supabaseUrl, serviceKey, { 
    auth: { 
      autoRefreshToken: false, 
      persistSession: false 
    } 
  })
}


