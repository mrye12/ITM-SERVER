import "./globals.css";
import { RealtimeProvider } from "@/contexts/RealtimeContext";

export const metadata = { title: "ITM Trading" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased bg-gray-50">
        <RealtimeProvider>
          {children}
        </RealtimeProvider>
      </body>
    </html>
  )
}