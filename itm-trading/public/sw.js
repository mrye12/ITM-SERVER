// ITM Trading Service Worker
// Enterprise PWA with offline capabilities

const CACHE_NAME = 'itm-trading-v1.0.0'
const STATIC_CACHE = 'itm-static-v1.0.0'
const DYNAMIC_CACHE = 'itm-dynamic-v1.0.0'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/analytics', 
  '/sales',
  '/finance',
  '/manifest.json',
  '/offline.html'
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Critical pages - Cache First
  pages: ['/dashboard', '/analytics', '/sales', '/finance'],
  
  // API endpoints - Network First with fallback
  api: ['/api/'],
  
  // Static assets - Cache First
  static: ['.js', '.css', '.png', '.jpg', '.svg', '.woff2'],
  
  // Dynamic content - Stale While Revalidate
  dynamic: ['/reports', '/files']
}

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Cache offline page
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.add('/offline.html')
      })
    ]).then(() => {
      console.log('[SW] Installation complete')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== CACHE_NAME
          )
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      console.log('[SW] Activation complete')
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip external requests
  if (!url.origin.includes(self.location.origin)) return
  
  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  try {
    // 1. Critical pages - Cache First
    if (CACHE_STRATEGIES.pages.some(page => pathname.startsWith(page))) {
      return await cacheFirst(request)
    }
    
    // 2. API endpoints - Network First
    if (CACHE_STRATEGIES.api.some(api => pathname.startsWith(api))) {
      return await networkFirst(request)
    }
    
    // 3. Static assets - Cache First
    if (CACHE_STRATEGIES.static.some(ext => pathname.includes(ext))) {
      return await cacheFirst(request)
    }
    
    // 4. Dynamic content - Stale While Revalidate
    if (CACHE_STRATEGIES.dynamic.some(path => pathname.startsWith(path))) {
      return await staleWhileRevalidate(request)
    }
    
    // 5. Default - Network First
    return await networkFirst(request)
    
  } catch (error) {
    console.error('[SW] Request failed:', error)
    return await getOfflineFallback(request)
  }
}

// Cache First strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  const cache = await caches.open(DYNAMIC_CACHE)
  cache.put(request, networkResponse.clone())
  return networkResponse
}

// Network First strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Update cache in background
  const networkResponsePromise = fetch(request).then(response => {
    cache.put(request, response.clone())
    return response
  })
  
  // Return cached version if available, otherwise wait for network
  return cachedResponse || await networkResponsePromise
}

// Offline fallback
async function getOfflineFallback(request) {
  const url = new URL(request.url)
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return await caches.match('/offline.html')
  }
  
  // Return cached version if available
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Return basic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  })
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions())
  }
})

async function syncOfflineActions() {
  try {
    // Get stored offline actions
    const offlineActions = await getStoredActions()
    
    for (const action of offlineActions) {
      try {
        // Retry the action
        await fetch(action.url, action.options)
        
        // Remove from storage on success
        await removeStoredAction(action.id)
        
        console.log('[SW] Synced offline action:', action.id)
      } catch (error) {
        console.error('[SW] Failed to sync action:', action.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from ITM Trading',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('ITM Trading', options)
  )
})

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/dashboard')
    )
  }
})

// Helper functions for IndexedDB operations
async function getStoredActions() {
  // Implementation would use IndexedDB to store offline actions
  return []
}

async function removeStoredAction(id) {
  // Implementation would remove action from IndexedDB
  console.log('Removing stored action:', id)
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateCriticalContent())
  }
})

async function updateCriticalContent() {
  try {
    // Update critical content like exchange rates, notifications
    const criticalEndpoints = [
      '/api/finance/exchange-rates',
      '/api/notifications',
      '/api/dashboard/stats'
    ]
    
    for (const endpoint of criticalEndpoints) {
      try {
        await fetch(endpoint)
        console.log('[SW] Updated:', endpoint)
      } catch (error) {
        console.error('[SW] Failed to update:', endpoint, error)
      }
    }
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error)
  }
}

console.log('[SW] Service Worker loaded')
