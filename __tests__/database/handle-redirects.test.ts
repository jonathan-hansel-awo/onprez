import fs from 'node:fs'
import path from 'node:path'

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    'prisma/migrations/20260802000000_business_handle_redirects/migration.sql'
  ),
  'utf8'
)

describe('business handle redirect database contract', () => {
  it('keeps current and retired handles in one concurrency-safe namespace', () => {
    expect(migration).toContain('business_handle_namespace_key')
    expect(migration).toContain('pg_advisory_xact_lock')
    expect(migration).toContain('businesses_handle_namespace_guard')
    expect(migration).toContain('business_handle_redirects_namespace_guard')
  })

  it('stores a business relation instead of a redirect target that could form a chain', () => {
    expect(migration).toContain('"businessId" TEXT NOT NULL')
    expect(migration).toContain('"sourceHandle" TEXT NOT NULL')
    expect(migration).not.toContain('"targetHandle"')
    expect(migration).toContain('ON DELETE CASCADE')
  })
})
