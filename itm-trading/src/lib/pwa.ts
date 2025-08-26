// PWA utility functions for ITM Trading

export interface PWAInstallPrompt {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event & PWAInstallPrompt
  }
}

let deferredPrompt: PWAInstallPrompt | null = null

// PWA installation
export function initializePWA() {
  if (typeof window === 'undefined') return

  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt available')
    e.preventDefault()
    deferredPrompt = e as PWAInstallPrompt
    
    // Show custom install button
    showInstallButton()
  })

  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully')
    hideInstallButton()
    deferredPrompt = null
    
    // Track installation
    trackPWAInstall()
  })

  // Register service worker
  registerServiceWorker()
}

// Register service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('[PWA] Service Worker registered:', registration.scope)
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('[PWA] Update found')
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available')
              showUpdateNotification()
            }
          })
        }
      })
      
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error)
    }
  }
}

// Show install button
function showInstallButton() {
  const installButton = document.getElementById('pwa-install-button')
  if (installButton) {
    installButton.style.display = 'block'
  }
  
  // Create floating install prompt if button doesn't exist
  if (!installButton) {
    createFloatingInstallPrompt()
  }
}

// Hide install button
function hideInstallButton() {
  const installButton = document.getElementById('pwa-install-button')
  if (installButton) {
    installButton.style.display = 'none'
  }
  
  const floatingPrompt = document.getElementById('floating-install-prompt')
  if (floatingPrompt) {
    floatingPrompt.remove()
  }
}

// Create floating install prompt
function createFloatingInstallPrompt() {
  const prompt = document.createElement('div')
  prompt.id = 'floating-install-prompt'
  prompt.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      max-width: 300px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    " onclick="installPWA()">
      <span style="font-size: 18px;">📱</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 2px;">Install ITM Trading</div>
        <div style="font-size: 12px; opacity: 0.9;">Add to home screen for quick access</div>
      </div>
      <button onclick="event.stopPropagation(); hideInstallPrompt()" style="
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        opacity: 0.7;
        padding: 4px;
      ">✕</button>
    </div>
  `
  
  document.body.appendChild(prompt)
  
  // Add hover effect
  prompt.addEventListener('mouseenter', () => {
    prompt.style.transform = 'translateY(-2px)'
    prompt.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1)'
  })
  
  prompt.addEventListener('mouseleave', () => {
    prompt.style.transform = 'translateY(0)'
    prompt.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  })
}

// Install PWA
export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available')
    return false
  }
  
  try {
    // Show install prompt
    await deferredPrompt.prompt()
    
    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice
    
    console.log('[PWA] User choice:', outcome)
    
    if (outcome === 'accepted') {
      trackPWAInstall()
      return true
    }
    
    return false
  } catch (error) {
    console.error('[PWA] Install failed:', error)
    return false
  } finally {
    deferredPrompt = null
    hideInstallButton()
  }
}

// Hide install prompt
export function hideInstallPrompt() {
  const floatingPrompt = document.getElementById('floating-install-prompt')
  if (floatingPrompt) {
    floatingPrompt.remove()
  }
  deferredPrompt = null
}

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement('div')
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 350px;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 18px;">🆕</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">Update Available</div>
          <div style="font-size: 12px; opacity: 0.9;">A new version of ITM Trading is ready!</div>
        </div>
        <button onclick="window.location.reload()" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        ">Update</button>
      </div>
    </div>
  `
  
  document.body.appendChild(notification)
  
  // Auto remove after 10 seconds
  setTimeout(() => {
    notification.remove()
  }, 10000)
}

// Check if PWA is installed
export function isPWAInstalled(): boolean {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  
  // Check for iOS PWA
  if ((window.navigator as any).standalone === true) {
    return true
  }
  
  return false
}

// Get PWA capabilities
export function getPWACapabilities() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    notifications: 'Notification' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    pushMessaging: 'serviceWorker' in navigator && 'PushManager' in window,
    installPrompt: 'BeforeInstallPromptEvent' in window,
    periodicSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
    share: 'share' in navigator,
    clipboard: 'clipboard' in navigator,
    wakeLock: 'wakeLock' in navigator,
    deviceMotion: 'DeviceMotionEvent' in window,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    storage: 'storage' in navigator && 'estimate' in navigator.storage,
    connectivity: 'connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator
  }
}

// Track PWA installation
function trackPWAInstall() {
  try {
    // Send analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'ITM Trading'
      })
    }
    
    // Log to server
    fetch('/api/analytics/pwa-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      })
    }).catch(error => {
      console.error('[PWA] Failed to track install:', error)
    })
  } catch (error) {
    console.error('[PWA] Track install failed:', error)
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported')
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  if (Notification.permission === 'denied') {
    return false
  }
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Show local notification
export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      ...options
    })
  }
}

// Enable wake lock (keep screen on)
export async function enableWakeLock(): Promise<WakeLockSentinel | null> {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await navigator.wakeLock.request('screen')
      console.log('[PWA] Wake lock enabled')
      return wakeLock
    } catch (error) {
      console.error('[PWA] Wake lock failed:', error)
      return null
    }
  }
  return null
}

// Make functions globally available
if (typeof window !== 'undefined') {
  (window as any).installPWA = installPWA
  (window as any).hideInstallPrompt = hideInstallPrompt
}
