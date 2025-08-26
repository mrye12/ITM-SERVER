'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

function LoginForm() {
  const supabase = supabaseBrowser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    
    if (error) {
      setErr(error.message)
      return
    }

    // Log successful login
    try {
      await fetch('/api/audit', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login' }) 
      })
    } catch (auditError) {
      console.warn('Audit log failed:', auditError)
    }

    // Redirect to intended page or dashboard
    const destination = redirectedFrom || '/dashboard'
    router.push(destination)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <form onSubmit={onLogin} className="bg-white p-8 rounded-2xl shadow-lg border">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">ITM Trading</h1>
            <p className="text-gray-600 mt-2">Enterprise Security Login</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="email"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="ilhamyahyaaji@infinitytrademineral.id"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Enter your password"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            
            {err && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{err}</p>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading} 
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Enterprise Security • Role-Based Access Control
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
