"use client"
import { useState } from "react"
import { Menu, X, Bell, User } from "lucide-react"
import { NotificationBell } from "@/components/notifications/NotificationCenter"

interface MobileHeaderProps {
  onMenuToggle: () => void
  isMenuOpen: boolean
  user?: { id: string; email: string } | null
  profile?: { full_name?: string; roles?: { code: string; name: string } } | null
}

export default function MobileHeader({ onMenuToggle, isMenuOpen, user, profile }: MobileHeaderProps) {
  const currentTime = new Date().toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <header className="lg:hidden h-16 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-yellow-500/30 px-4 flex items-center justify-between shadow-lg fixed top-0 left-0 right-0 z-50">
      {/* Left Section - Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg bg-gray-800/50 text-yellow-400 hover:bg-gray-700/50 transition-colors"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        
        <div>
          <h1 className="text-sm font-bold text-white">ITM Trading</h1>
          <p className="text-xs text-yellow-400">{currentTime}</p>
        </div>
      </div>

      {/* Right Section - User & Notifications */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1.5 border border-yellow-500/20">
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xs">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-white">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
