'use client'
import { useState, Suspense } from 'react'

import { supabaseBrowser } from '@/lib/supabase/client'

function LoginForm() {
  const supabase = supabaseBrowser()
  // const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        // Check if it's a demo login
        if (email === 'admin@itmtrading.com' && password === 'admin123') {
          console.log('Using demo login fallback')
          setLoading(false)
          // Force redirect to dashboard (use window.location for reliable redirect)
          window.location.href = '/dashboard'
          return
        }
        
        setErr(error.message)
        setLoading(false)
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

    } catch (networkError) {
      console.warn('Supabase connection failed, checking demo credentials:', networkError)
      
      // Fallback for demo credentials when Supabase is unavailable
      if (email === 'admin@itmtrading.com' && password === 'admin123') {
        console.log('Using demo login (Supabase unavailable)')
        setLoading(false)
        window.location.href = '/dashboard'
        return
      }
      
      setErr('Connection failed. Use demo credentials: admin@itmtrading.com / admin123')
      setLoading(false)
      return
    }

    setLoading(false)
    // Force redirect to dashboard (use window.location for reliable redirect)
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <form onSubmit={onLogin} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">ITM</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ITM Trading</h1>
            <p className="text-gray-600">Enterprise Mining System</p>
                          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Enterprise Security
              </div>
              
              {/* Demo Credentials */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
                <div className="text-green-800 font-medium mb-1">Demo Login:</div>
                <div className="text-green-700">
                  📧 admin@itmtrading.com<br/>
                  🔑 admin123
                </div>
              </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input 
                type="email"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white" 
                placeholder="Enter your email address"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white" 
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
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In to Enterprise System'
              )}
            </button>
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Enterprise Security • Role-Based Access Control
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span>🔒 Secure Authentication</span>
              <span>•</span>
              <span>📊 Real-time Monitoring</span>
              <span>•</span>
              <span>🛡️ Audit Trail</span>
            </div>
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
