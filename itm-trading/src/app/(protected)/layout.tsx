import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { ToastProvider } from "@/components/ui/Toast"
import { requireUser } from "@/lib/auth"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return (
    <ToastProvider>
      <div className="min-h-screen grid grid-cols-[260px_1fr]">
        <aside className="bg-white border-r"><Sidebar/></aside>
        <div className="flex flex-col">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}


