import "./globals.css";
import { RealtimeProvider } from "@/contexts/RealtimeContext";

export const metadata = { title: "ITM Trading" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <RealtimeProvider>
          {children}
        </RealtimeProvider>
      </body>
    </html>
  )
}