"use client"
import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/notifications/NotificationCenter"
import { getMockProfile } from "@/lib/mock-auth"

export default function Header() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string; roles?: { code: string; name: string } | { code: string; name: string }[] } | null>(null)

    useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabaseBrowser().auth.getUser()
        if (user && user.email) {
          setUser({ id: user.id, email: user.email })
          
          // Get user profile with role
          const { data: profile } = await supabaseBrowser()
            .from('profiles')
            .select('full_name, roles!inner(code, name)')
            .eq('id', user.id)
            .single()
          
          setProfile(profile)

          // Get notification count (example: pending shipments, maintenance alerts)
          await supabaseBrowser()
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        }
      } catch (error) {
        console.warn('Supabase failed, using mock data:', error)
        // Use mock data for demo
        const mockProfile = getMockProfile()
        setUser({ id: mockProfile.id, email: mockProfile.email })
        setProfile(mockProfile)
      }
    }
    getUser()
  }, [])

  const currentTime = new Date().toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <header className="h-16 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-yellow-500/30 px-6 flex items-center justify-between shadow-lg">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">PT. Infinity Trade Mineral</h1>
          <p className="text-xs text-yellow-400">{currentTime}</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <NotificationBell />

        {/* User Info */}
        <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-4 py-2 border border-yellow-500/20">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="text-xs text-yellow-400">
              {Array.isArray(profile?.roles) 
                ? (profile.roles[0]?.name || 'Staff')
                : (profile?.roles?.name || 'Staff')
              }
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-300 hover:text-yellow-400 transition-colors" title="Settings">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

