import "./globals.css";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import PWAProvider from "@/components/PWAProvider";

export const metadata = { 
  title: "ITM Trading - Enterprise Mining System",
  description: "Enterprise-grade trading system for mining commodities with AI compliance engine",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ITM Trading"
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ITM Trading" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ITM Trading" />
        
        {/* PWA Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/sw.js" as="script" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="antialiased bg-gray-50">
        <PWAProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </PWAProvider>
      </body>
    </html>
  )
}