// ============================================================
// MARA IA — Service Worker (PWA)
// Cache offline para app mobile do Dr. Mauro
// ============================================================

const CACHE_NAME = 'mara-ia-v2'
const ASSETS_CACHE = 'mara-assets-v2'

const SHELL_ASSETS = ['/mara-app', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (event) => {
  console.log('[SW] MARA IA v2 — Install')
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(SHELL_ASSETS).catch(err => console.warn('[SW] Cache parcial:', err))
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== ASSETS_CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API — sempre network-first (dados em tempo real)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline', ativo: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Assets estáticos — cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?)$/) || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached
          return fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone())
            return res
          })
        })
      )
    )
    return
  }

  // Navegação — network-first com fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/mara-app').then(r => r || new Response('<h1>MARA IA offline</h1>', { headers: { 'Content-Type': 'text/html' } }))
      )
    )
    return
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'MARA IA', {
      body: data.body || 'Nova notificacao',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'mara-ia',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/mara-app' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/mara-app'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
