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
        expect.objectContaining({ sizes: '192x192' }),
        expect.objectContaining({ sizes: '512x512' }),
        expect.objectContaining({ purpose: 'maskable' }),
      ])
    )
  })

  it('uses a network-first navigation fallback without caching private responses', () => {
    expect(serviceWorker).toContain("request.mode !== 'navigate'")
    expect(serviceWorker).toContain('fetch(request).catch')
    expect(serviceWorker).toContain('caches.match(OFFLINE_URL)')
    expect(serviceWorker).toContain("const CACHE_NAME = 'onprez-offline-v2'")
    expect(serviceWorker).toContain("'/onprez-wordmark.svg'")
    expect(serviceWorker).not.toContain('cache.put')
    expect(serviceWorker).not.toContain("'/api/")
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
    expect(serviceWorker).not.toContain('event.data.text()')
    expect(serviceWorker).not.toContain('cache.put')
  })
})
