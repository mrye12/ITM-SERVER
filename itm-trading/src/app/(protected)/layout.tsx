import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { ToastProvider } from "@/components/ui/Toast"
import { requireUser } from "@/lib/auth"

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
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg">
            <Sidebar />
          </aside>
          
          {/* Main Content */}
          <div className="flex-1 ml-64">
            <Header />
            <main className="p-6 min-h-screen">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}


