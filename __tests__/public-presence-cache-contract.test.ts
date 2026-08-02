/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('public presence cache architecture', () => {
  it('serves the public handle and metadata from the shared cache instead of direct Prisma reads', () => {
    const source = read('src/app/[handle]/page.tsx')

    expect(source).toContain('getCachedPublicPresenceResolution(handle)')
    expect(source).toContain('permanentRedirect(`/${resolution.canonicalHandle}`)')
    expect(source).toContain('export const revalidate = 300')
    expect(source).not.toContain("dynamic = 'force-dynamic'")
    expect(source).not.toContain("from '@/lib/prisma'")
  })

  it.each([
    'src/app/api/presence/pages/publish/route.ts',
    'src/app/api/admin/businesses/[businessId]/presence/route.ts',
    'src/app/api/admin/businesses/[businessId]/presence/publish/route.ts',
    'src/app/api/admin/businesses/[businessId]/route.ts',
    'src/app/api/business/settings/route.ts',
    'src/app/api/business/[businessId]/theme/route.ts',
    'src/app/api/business/handle/route.ts',
  ])('invalidates the handle cache from public-data mutation path %s', relativePath => {
    const source = read(relativePath)

    expect(source).toContain('invalidatePublicPresence')
  })

  it('keeps ordinary editor saves draft-only and avoids unnecessary public invalidation', () => {
    const source = read('src/app/api/presence/pages/route.ts')

    expect(source).not.toContain('invalidatePublicPresence')
    expect(source).toContain('data: { content: contentJson }')
  })
})
