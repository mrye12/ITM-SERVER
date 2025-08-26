"use client"
import { useState, useEffect } from "react"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import MobileHeader from "@/components/layout/MobileHeader"
import { supabaseBrowser } from "@/lib/supabase/client"

interface MobileLayoutClientProps {
  children: React.ReactNode
}

export default function MobileLayoutClient({ children }: MobileLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string; roles?: { code: string; name: string } } | null>(null)

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
        }
      } catch (error) {
        console.error('Authentication failed:', error)
        setUser(null)
        setProfile(null)
      }
    }
    getUser()
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader 
        onMenuToggle={toggleMobileMenu}
        isMenuOpen={isMobileMenuOpen}
        user={user}
        profile={profile}
      />

      {/* Mobile Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        isMobile={true}
      />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 shadow-lg">
          <Sidebar />
        </aside>
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Desktop Header */}
          <div className="hidden lg:block">
            <Header />
          </div>
          
          {/* Main Content Area */}
          <main className="pt-16 lg:pt-0 p-4 lg:p-6 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
