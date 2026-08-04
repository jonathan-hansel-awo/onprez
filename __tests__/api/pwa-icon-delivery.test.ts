import fs from 'fs'
import path from 'path'
import manifest from '@/app/manifest'

describe('PWA icon delivery boundary', () => {
  it('retires the dynamic icon API route in favour of static assets', () => {
    const legacyRoute = path.join(process.cwd(), 'src', 'app', 'api', 'pwa', 'icon', 'route.tsx')

    expect(fs.existsSync(legacyRoute)).toBe(false)
  })

  it('resolves every manifest launcher icon to a shipped PNG', () => {
    const icons = manifest().icons ?? []

    expect(icons).toHaveLength(3)

    for (const icon of icons) {
      expect(icon.src).toMatch(/^\/icons\/onprez-wordmark-.*\.png$/)
      expect(icon.src).not.toContain('/api/pwa/icon')

      const assetPath = path.join(process.cwd(), 'public', icon.src)

      expect(fs.existsSync(assetPath)).toBe(true)
      expect(fs.statSync(assetPath).size).toBeGreaterThan(1_000)
    }
  })
})
