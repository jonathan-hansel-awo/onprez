import fs from 'node:fs'
import path from 'node:path'

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8')

describe('platform operations user-visible contract', () => {
  const page = read('src/app/admin/operations/page.tsx')
  const layout = read('src/app/admin/layout.tsx')

  it('makes the protected usage workspace discoverable from platform administration', () => {
    expect(layout).toContain('href="/admin/operations"')
    expect(layout).toContain('Usage &amp; overhead')
    expect(page).toContain('Usage and overhead')
    expect(page).toContain('Account usage')
  })

  it('labels estimates, thresholds, and missing provider measurements honestly', () => {
    expect(page).toContain('Estimated allocation')
    expect(page).toContain('Limits remain observational in P3-002')
    expect(page).toContain('CDN delivery and transformations: unavailable, not zero.')
    expect(page).toContain('No active cost rates are configured')
    expect(page).toContain('business.estimatedCosts.status')
  })
})
