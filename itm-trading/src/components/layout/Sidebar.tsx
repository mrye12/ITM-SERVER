"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

export default function Sidebar({ isOpen = true, onClose, isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabaseBrowser().auth.getUser()
        if (user) {
          const { data: profile } = await supabaseBrowser()
            .from('profiles')
            .select('roles!inner(code, name)')
            .eq('id', user.id)
            .single()
          
          if (profile?.roles && 'code' in profile.roles) {
            setUserRole((profile.roles as { code: string }).code)
          }
        }
      } catch (error) {
        console.error('Authentication failed:', error)
        setUserRole('')
      }
    }
    getUser()
  }, [])

  const logout = async () => {
    // Log logout action for audit trail
    try {
      await fetch('/api/audit', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }) 
      })
    } catch (error) {
      console.warn('Audit log failed:', error)
    }

    await supabaseBrowser().auth.signOut()
    window.location.href = "/login"
  }

  const isActive = (path: string) => pathname === path

  const menuSections = [
    {
      title: "📊 Dashboard & Overview",
      items: [
        { href: "/dashboard", label: "Main Dashboard", icon: "🏠", roles: ["admin", "manager", "staff"] },
        { href: "/executive-dashboard", label: "Executive Dashboard", icon: "📈", roles: ["admin", "manager"] },
        { href: "/nickel", label: "Nickel Price Monitor", icon: "💎", roles: ["admin", "manager", "staff"] },
      ]
    },
    {
      title: "💼 Core Trading Business",
      items: [
        { href: "/purchase", label: "Purchase from IUP", icon: "🛒", roles: ["admin", "manager", "staff"] },
        { href: "/smelter-sales", label: "Sales to Smelter", icon: "🏭", roles: ["admin", "manager", "staff"] },
        { href: "/commodity-trading", label: "Commodity Trading", icon: "📈", roles: ["admin", "manager", "staff"] },
        { href: "/sales", label: "Sales Management", icon: "💼", roles: ["admin", "manager", "staff"] },
        { href: "/orders", label: "Order Management", icon: "📋", roles: ["admin", "manager", "staff"] },
      ]
    },
    {
      title: "🏗️ Operations & Logistics",
      items: [
        { href: "/stock", label: "Inventory Management", icon: "📦", roles: ["admin", "manager", "staff"] },
        { href: "/shipment", label: "Logistics & Shipping", icon: "🚢", roles: ["admin", "manager", "staff"] },
        { href: "/mining-ops", label: "Mining Operations", icon: "⛏️", roles: ["admin", "manager", "staff"] },
        { href: "/equipment", label: "Equipment Management", icon: "🔧", roles: ["admin", "manager", "staff"] },
        { href: "/fuel", label: "Fuel Operations", icon: "⛽", roles: ["admin", "manager", "staff"] },
      ]
    },
    {
      title: "📈 Analytics & Intelligence",
      items: [
        { href: "/analytics", label: "Business Intelligence", icon: "📈", roles: ["admin", "manager"] },
        { href: "/executive-dashboard", label: "Executive Dashboard", icon: "📊", roles: ["admin", "manager"] },
        { href: "/nickel", label: "Nickel Price Monitor", icon: "💎", roles: ["admin", "manager", "staff"] },
      ]
    },
    {
      title: "💰 Financial Management",
      items: [
        { href: "/finance", label: "Financial Overview", icon: "💰", roles: ["admin", "manager"] },
        { href: "/finance/accounting", label: "Accounting", icon: "📚", roles: ["admin", "finance_manager", "accountant"] },
        { href: "/finance/budget", label: "Budget & Planning", icon: "📋", roles: ["admin", "finance_manager"] },
        { href: "/finance/banking", label: "Banking & Payments", icon: "🏦", roles: ["admin", "finance_manager"] },
        { href: "/finance/taxes", label: "Tax Management", icon: "📄", roles: ["admin", "finance_manager", "accountant"] },
      ]
    },
    {
      title: "🔒 Security & Compliance",
      items: [
        { href: "/security/overview", label: "Security Overview", icon: "🔒", roles: ["admin", "security_admin"] },
        { href: "/security/sessions", label: "Session Management", icon: "🔑", roles: ["admin", "security_admin"] },
        { href: "/compliance", label: "AI Compliance", icon: "🛡️", roles: ["admin", "manager", "staff"] },
        { href: "/compliance/audit", label: "Audit Trail", icon: "📋", roles: ["admin", "compliance_officer", "auditor"] },
        { href: "/reports", label: "Analytics & Reports", icon: "📊", roles: ["admin", "manager"] },
      ]
    },
    {
      title: "👥 Human Resources",
      items: [
        { href: "/hr", label: "Human Resources", icon: "👥", roles: ["admin", "manager"] },
      ]
    },
    {
      title: "📁 Documents & Admin",
      items: [
        { href: "/files", label: "Document Center", icon: "📁", roles: ["admin", "manager", "staff"] },
        { href: "/admin", label: "System Administration", icon: "⚙️", roles: ["admin"] },
      ]
    }
  ]

  // Mobile overlay backdrop
  if (isMobile && !isOpen) return null

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? 'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out' 
          : 'h-screen'
        }
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col shadow-2xl
      `}>
        {/* Header Logo */}
        <div className="p-6 border-b border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-black font-bold text-xl">ITM</span>
              </div>
              <div>
                <div className="font-bold text-xl text-white">Infinity Trade</div>
                <div className="text-sm text-yellow-400 font-medium">Mineral Trading</div>
              </div>
            </div>
            
            {/* Close button for mobile */}
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {menuSections.map((section, sectionIndex) => {
          // Filter items by user role
          const visibleItems = section.items.filter(item => 
            item.roles.includes(userRole) || userRole === 'admin'
          )
          
          // Don't show section if no visible items
          if (visibleItems.length === 0) return null
          
          return (
            <div key={sectionIndex} className="space-y-2">
              {/* Section Header */}
              <div className="px-3 py-2 text-xs font-bold text-yellow-400 uppercase tracking-wider border-b border-gray-700/50 bg-gray-800/30 rounded-lg">
                {section.title}
              </div>
              
              {/* Section Items */}
              <div className="space-y-1 pl-2">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold shadow-lg transform scale-105'
                        : 'text-gray-300 hover:bg-gray-800/60 hover:text-yellow-400 hover:transform hover:scale-102'
                    }`}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive(item.href) && (
                      <div className="ml-auto w-2 h-2 bg-black rounded-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-yellow-500/30 bg-gray-900/50">
        <div className="mb-3 text-xs text-gray-400">
          Role: <span className="text-yellow-400 font-semibold capitalize bg-yellow-400/10 px-2 py-1 rounded-full">{userRole}</span>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-all duration-200 group"
        >
          <span className="group-hover:scale-110 transition-transform">🚪</span>
          <span>Logout</span>
        </button>
      </div>
      </div>
    </>
  )
}
