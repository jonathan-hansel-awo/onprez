import fs from 'fs'
import path from 'path'
import manifest from '@/app/manifest'

describe('Installable PWA foundation', () => {
  const serviceWorkerPath = path.join(process.cwd(), 'public', 'sw.js')
  const serviceWorker = fs.readFileSync(serviceWorkerPath, 'utf8')
  const offlinePage = fs.readFileSync(path.join(process.cwd(), 'public', 'offline.html'), 'utf8')

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
    expect(serviceWorker).not.toContain('cache.put')
    expect(serviceWorker).not.toContain("'/dashboard'")
    expect(serviceWorker).not.toContain("'/api/")
  })

  it('explains that private dashboard data is unavailable offline', () => {
    const normalisedOfflinePage = offlinePage.replace(/\s+/g, ' ')

    expect(normalisedOfflinePage).toContain('You’re currently offline')
    expect(normalisedOfflinePage).toContain(
      'No private dashboard data has been stored for offline use.'
    )
    expect(offlinePage).not.toContain('booking reference')
    expect(offlinePage).not.toContain('@example.com')
  })
})
