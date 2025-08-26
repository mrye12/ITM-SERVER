/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    // Make sure these are available in build
    NEXT_PUBLIC_SUPABASE_URL: process.env.itm_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbhcrqtfbhzuwcljgxph.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.itm_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaGNycXRmYmh6dXdjbGpneHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzI3MjQsImV4cCI6MjA3MTYwODcyNH0.nlxSNKYmJEWtnhBVbajCHjksyPpyhDJVkmgRBTjF4No'
  }
}

export default nextConfig
