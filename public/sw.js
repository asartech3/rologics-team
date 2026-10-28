// Rolo Team service worker — minimal
// - serves /rolo-icon.svg and offline shell basics
// - receives messages from the page to SHOW app notifications
// Proper background web-push will be enabled after HTTPS deployment (needs VAPID keys).
const CACHE = 'rolo-static-v2'
const ASSETS = ['/rolo-icon.svg', '/rolo-icon-maskable.svg', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

// Never intercept data/API traffic — pass through untouched.
self.addEventListener('fetch', () => {})

// Page-triggered notifications (titled alerts while app is open)
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'notify') {
    self.registration.showNotification(e.data.title || 'Rolo Team', {
      body: e.data.body || '',
      icon: '/rolo-icon-maskable.svg',
      badge: '/rolo-icon-maskable.svg',
      data: { url: '/dashboard' },
    })
  }
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/dashboard'))
})
