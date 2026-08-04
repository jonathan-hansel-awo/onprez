import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

describe('P3-002 usage tracking foundation contract', () => {
  it('adds plan attribution and durable media/rate sources through one ordered migration', () => {
    const schema = read('prisma/schema.prisma')
    const migration = read(
      'prisma/migrations/20260804090000_usage_tracking_foundation/migration.sql'
    )

    expect(schema).toContain('planTier                  PlanTier')
    expect(schema).toContain('model MediaAsset')
    expect(schema).toContain('model ProviderCostRate')
    expect(migration).toContain('CREATE TYPE "PlanTier"')
    expect(migration).toContain('CREATE TABLE "media_assets"')
    expect(migration).toContain('CREATE TABLE "provider_cost_rates"')
    expect(migration).toContain('P3-002')
  })

  it('keeps counters source-derived and records every business upload path', () => {
    const usage = read('src/lib/usage/business-usage.ts')
    const upload = read('src/app/api/upload/image/route.ts')
    const media = read('src/lib/usage/media-asset.ts')

    for (const source of [
      'prisma.page.groupBy',
      'prisma.service.groupBy',
      'prisma.appointment.groupBy',
      'prisma.mediaAsset.groupBy',
      'prisma.businessMember.groupBy',
      'prisma.emailDelivery.groupBy',
    ]) {
      expect(usage).toContain(source)
    }
    expect(upload.match(/recordBusinessMediaAsset/g)?.length).toBeGreaterThanOrEqual(4)
    expect(media).toContain('prisma.mediaAsset.upsert')
    expect(media).toContain('where: { publicId: image.public_id }')
  })

  it('provides a rerunnable historical backfill and explicit operator guidance', () => {
    const script = read('scripts/backfill-business-media-assets.ts')
    const docs = read('docs/admin/USAGE_AND_OVERHEAD.md')
    const packageJson = JSON.parse(read('package.json'))

    expect(script).toContain("prefix: 'onprez/businesses/'")
    expect(script).toContain('prisma.mediaAsset.upsert')
    expect(packageJson.scripts['usage:backfill-media']).toBe(
      'tsx scripts/backfill-business-media-assets.ts'
    )
    expect(docs).toContain('npm run usage:backfill-media')
    expect(docs).toContain('unavailable rather than zero')
  })

  it('keeps usage observational before explicit limit enforcement work', () => {
    const docs = read('docs/admin/USAGE_AND_OVERHEAD.md')
    const usage = read('src/lib/usage/business-usage.ts')

    expect(docs).toMatch(/does not block creation, hide existing data, or charge a\s+business/)
    expect(usage).not.toContain('throw new PlanLimit')
    expect(usage).not.toContain('deleteMany')
  })
})
