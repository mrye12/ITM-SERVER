import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import MobileHeader from "@/components/layout/MobileHeader"
import { ToastProvider } from "@/components/ui/Toast"
import { requireUser } from "@/lib/auth"
import MobileLayoutClient from "@/components/layout/MobileLayoutClient"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireUser()
  } catch (error) {
    // If authentication fails, redirect to login
    console.error('Authentication failed:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting to Login...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }
  
  return (
    <ToastProvider>
      <MobileLayoutClient>
        {children}
      </MobileLayoutClient>
    </ToastProvider>
  )
}


