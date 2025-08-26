"use client"
import { useEffect } from "react"
import { initializePWA, isPWAInstalled, getPWACapabilities } from "@/lib/pwa"

interface PWAProviderProps {
  children: React.ReactNode
}

export default function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Initialize PWA functionality
    initializePWA()
    
    // Log PWA status
    console.log('[PWA] Status:', {
      installed: isPWAInstalled(),
      capabilities: getPWACapabilities()
    })
    
    // Add PWA-specific styling for standalone mode
    if (isPWAInstalled()) {
      document.body.classList.add('pwa-installed')
      
      // Add safe area insets for iOS
      const style = document.createElement('style')
      style.textContent = `
        .pwa-installed {
          --safe-area-inset-top: env(safe-area-inset-top);
          --safe-area-inset-bottom: env(safe-area-inset-bottom);
          --safe-area-inset-left: env(safe-area-inset-left);
          --safe-area-inset-right: env(safe-area-inset-right);
        }
        
        .pwa-installed .mobile-header {
          padding-top: max(1rem, env(safe-area-inset-top));
        }
        
        .pwa-installed .mobile-content {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `
      document.head.appendChild(style)
    }
    
    // Handle app state changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[PWA] App became visible')
        // Sync data when app becomes visible
        syncAppData()
      } else {
        console.log('[PWA] App became hidden')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Handle online/offline events
    const handleOnline = () => {
      console.log('[PWA] App came online')
      showConnectionStatus('online')
      syncOfflineActions()
    }
    
    const handleOffline = () => {
      console.log('[PWA] App went offline')
      showConnectionStatus('offline')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return <>{children}</>
}

// Sync app data
async function syncAppData() {
  try {
    // Sync critical data like notifications, exchange rates
    const endpoints = [
      '/api/notifications/unread-count',
      '/api/finance/exchange-rates',
      '/api/dashboard/quick-stats'
    ]
    
    for (const endpoint of endpoints) {
      try {
        await fetch(endpoint, { cache: 'no-cache' })
      } catch (error) {
        console.warn('[PWA] Failed to sync:', endpoint, error)
      }
    }
  } catch (error) {
    console.error('[PWA] Sync failed:', error)
  }
}

// Sync offline actions
async function syncOfflineActions() {
  try {
    // Trigger background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('sync-offline-actions')
      console.log('[PWA] Background sync triggered')
    }
  } catch (error) {
    console.error('[PWA] Background sync failed:', error)
  }
}

// Show connection status
function showConnectionStatus(status: 'online' | 'offline') {
  const existingStatus = document.getElementById('connection-status')
  if (existingStatus) {
    existingStatus.remove()
  }
  
  const statusElement = document.createElement('div')
  statusElement.id = 'connection-status'
  statusElement.innerHTML = `
    <div style="
      position: fixed;
      top: ${isPWAInstalled() ? 'max(20px, env(safe-area-inset-top))' : '20px'};
      left: 50%;
      transform: translateX(-50%);
      background: ${status === 'online' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      animation: slideDown 0.3s ease-out;
    ">
      ${status === 'online' ? '🟢 Connected' : '🔴 Offline'}
    </div>
  `
  
  // Add animation
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `
  document.head.appendChild(style)
  
  document.body.appendChild(statusElement)
  
  // Auto remove after 3 seconds for online, keep offline status
  if (status === 'online') {
    setTimeout(() => {
      statusElement.style.animation = 'slideDown 0.3s ease-out reverse'
      setTimeout(() => {
        statusElement.remove()
        style.remove()
      }, 300)
    }, 3000)
  }
}
