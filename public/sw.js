/* global self, caches, fetch */

const CACHE_NAME = 'onprez-offline-v2'
const OFFLINE_URL = '/offline.html'
const OFFLINE_ASSETS = [
  OFFLINE_URL,
  '/favicon.svg',
  '/icon-192.png',
  '/onprez-wordmark.svg',
]

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('onprez-offline-'))
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event

  if (request.method !== 'GET' || request.mode !== 'navigate') return

  event.respondWith(
    fetch(request).catch(async () => {
      const offlineResponse = await caches.match(OFFLINE_URL)
      return offlineResponse || Response.error()
    })
  )
})

function notificationUrl(value) {
  try {
    const url = new URL(value || '/dashboard/bookings', self.location.origin)

    const isDashboardUrl = url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/')

    if (url.origin !== self.location.origin || !isDashboardUrl) {
      return '/dashboard/bookings'
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/dashboard/bookings'
  }
}

self.addEventListener('push', event => {
  let payload = {}

  try {
    payload = event.data?.json() || {}
  } catch {
    payload = {}
  }

  const title =
    typeof payload.title === 'string' ? payload.title.slice(0, 80) : 'OnPrez booking update'
  const body =
    typeof payload.body === 'string'
      ? payload.body.slice(0, 240)
      : 'Open OnPrez to view the latest booking update.'
  const url = notificationUrl(payload.url)
  const tag = typeof payload.tag === 'string' ? payload.tag.slice(0, 120) : 'onprez-booking-update'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const url = notificationUrl(event.notification.data?.url)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const dashboardClient = clients.find(client => {
        try {
          return new URL(client.url).origin === self.location.origin
        } catch {
          return false
        }
      })

      if (dashboardClient) {
        return dashboardClient.navigate(url).then(client => client?.focus())
      }

      return self.clients.openWindow(url)
    })
  )
})
