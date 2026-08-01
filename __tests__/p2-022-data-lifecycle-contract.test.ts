/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('P2-022 data lifecycle contract', () => {
  it('keeps exports private and excludes authentication secrets', () => {
    const source = read('src/lib/data-lifecycle/export.ts')

    expect(source).toContain("'Cache-Control': 'private, no-store, max-age=0'")
    expect(source).toContain("'Content-Disposition': `attachment;")
    expect(source).toContain("'password hashes'")
    expect(source).not.toContain('passwordHash: true')
    expect(source).not.toContain('refreshToken: true')
    expect(source).not.toContain('encryptedSecret: true')
    expect(source).not.toContain('hashedCode: true')
  })

  it('requires ownership and current-password verification for a whole-business export', () => {
    const source = read('src/app/api/business/[businessId]/data-export/route.ts')
    const ownerCheck = source.indexOf('await requireBusinessRole(user.id, businessId, [])')
    const passwordCheck = source.indexOf('await verifyLifecyclePassword')
    const exportBuild = source.indexOf('await buildBusinessExport')

    expect(ownerCheck).toBeGreaterThan(-1)
    expect(passwordCheck).toBeGreaterThan(ownerCheck)
    expect(exportBuild).toBeGreaterThan(passwordCheck)
  })

  it('uses a durable staged deletion request instead of cascading account data immediately', () => {
    const route = read('src/app/api/account/deletion-request/route.ts')
    const migration = read(
      'prisma/migrations/20260801150000_data_lifecycle_workflows/migration.sql'
    )

    expect(route).toContain('scheduledFor.setUTCDate(scheduledFor.getUTCDate() + 14)')
    expect(route).toContain('DataLifecycleRequestStatus.REVIEW_REQUIRED')
    expect(route).toContain('retainedPaymentCount')
    expect(route).not.toContain('prisma.user.delete')
    expect(migration).toContain('data_lifecycle_requests_one_active_account_deletion_idx')
    expect(migration).toContain('ON DELETE SET NULL')
  })

  it('documents retained booking facts and terminal-processing safeguards', () => {
    const documentation = read('docs/product/DATA_EXPORT_AND_DELETION_WORKFLOWS.md')

    expect(documentation).toContain('Retains appointment timing, service, status')
    expect(documentation).toContain('Never cascade-delete an owned')
    expect(documentation).toContain('Automated terminal deletion is intentionally not enabled')
    expect(documentation).toContain('must never contain passwords')
  })
})
