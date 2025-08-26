'use client'
import { createBrowserClient } from '@supabase/ssr'

// Browser-safe Supabase client for frontend
export const supabaseBrowser = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.itm_NEXT_PUBLIC_SUPABASE_URL ||
                     'https://jbhcrqtfbhzuwcljgxph.supabase.co'
                     
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                     process.env.itm_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaGNycXRmYmh6dXdjbGpneHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzI3MjQsImV4cCI6MjA3MTYwODcyNH0.nlxSNKYmJEWtnhBVbajCHjksyPpyhDJVkmgRBTjF4No'

  return createBrowserClient(supabaseUrl, supabaseKey)
}

