import fs from 'fs'
import path from 'path'
import manifest from '@/app/manifest'

describe('Installable PWA foundation', () => {
  const serviceWorkerPath = path.join(process.cwd(), 'public', 'sw.js')
  const serviceWorker = fs.readFileSync(serviceWorkerPath, 'utf8')
  const offlinePage = fs.readFileSync(path.join(process.cwd(), 'public', 'offline.html'), 'utf8')
  const navigationLogo = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'navigation', 'logo.tsx'),
    'utf8'
  )
  it('launches the installed app at the authenticated dashboard', () => {
    const appManifest = manifest()

    expect(appManifest.id).toBe('/dashboard')
    expect(appManifest.start_url).toBe('/dashboard')
    expect(appManifest.display).toBe('standalone')
    expect(appManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/icons/onprez-wordmark-192.png',
          sizes: '192x192',
        }),
        expect.objectContaining({
          src: '/icons/onprez-wordmark-512.png',
          sizes: '512x512',
        }),
        expect.objectContaining({
          src: '/icons/onprez-wordmark-512-maskable.png',
          purpose: 'maskable',
        }),
      ])
    )
    expect(appManifest.icons).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'image/svg+xml' })])
    )
  })

  it('ships rasterised wordmark icons for launcher compatibility', () => {
    const iconNames = [
      'onprez-wordmark-180.png',
      'onprez-wordmark-192.png',
      'onprez-wordmark-512.png',
      'onprez-wordmark-512-maskable.png',
    ]

    for (const iconName of iconNames) {
      const iconPath = path.join(process.cwd(), 'public', 'icons', iconName)

      expect(fs.existsSync(iconPath)).toBe(true)
      expect(fs.statSync(iconPath).size).toBeGreaterThan(1_000)
    }
  })

  it('uses a network-first navigation fallback without caching private responses', () => {
    expect(serviceWorker).toContain("request.mode !== 'navigate'")
    expect(serviceWorker).toContain('fetch(request).catch')
    expect(serviceWorker).toContain('caches.match(OFFLINE_URL)')
    expect(serviceWorker).toContain("const CACHE_NAME = 'onprez-offline-v3'")
    expect(serviceWorker).toContain("const PWA_ICON_URL = '/icons/onprez-wordmark-192.png'")
    expect(serviceWorker).toContain("'/onprez-wordmark.svg'")
    expect(serviceWorker).not.toContain('cache.put')
    expect(serviceWorker).not.toContain("'/api/dashboard")
    expect(serviceWorker).not.toContain("'/api/bookings")
  })

  it('uses the supplied wordmark for general OnPrez branding', () => {
    expect(navigationLogo).toContain('src="/onprez-wordmark.svg"')
    expect(navigationLogo).toContain('width={616}')
    expect(navigationLogo).toContain('height={176}')
  })

  it('uses the OnPrez wordmark on the offline experience', () => {
    const normalisedOfflinePage = offlinePage.replace(/\s+/g, ' ')

    expect(normalisedOfflinePage).toContain('You’re currently offline')
    expect(normalisedOfflinePage).toContain('src="/onprez-wordmark.svg"')
    expect(normalisedOfflinePage).toContain('alt="OnPrez"')
    expect(normalisedOfflinePage).not.toContain('class="open-o"')
    expect(normalisedOfflinePage).toContain(
      'No private dashboard data has been stored for offline use.'
    )
    expect(offlinePage).not.toContain('booking reference')
    expect(offlinePage).not.toContain('@example.com')
  })

  it('handles push payloads without caching private notification data', () => {
    expect(serviceWorker).toContain("self.addEventListener('push'")
    expect(serviceWorker).toContain('self.registration.showNotification')
    expect(serviceWorker).toContain("self.addEventListener('notificationclick'")
    expect(serviceWorker).toContain('url.origin !== self.location.origin')
    expect(serviceWorker).toContain("url.pathname === '/dashboard'")
    expect(serviceWorker).toContain("url.pathname.startsWith('/dashboard/')")
    expect(serviceWorker).toContain('icon: PWA_ICON_URL')
    expect(serviceWorker).not.toContain('event.data.text()')
    expect(serviceWorker).not.toContain('cache.put')
  })
})
