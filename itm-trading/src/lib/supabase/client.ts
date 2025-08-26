'use client'
import { createBrowserClient } from '@supabase/ssr'

// Browser-safe Supabase client for frontend
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

