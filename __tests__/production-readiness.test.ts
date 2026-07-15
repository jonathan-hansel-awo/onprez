import fs from 'fs'
import path from 'path'

describe('Production readiness gate', () => {
  const checklistPath = path.join(
    process.cwd(),
    'docs',
    'production',
    'PRODUCTION_READINESS_CHECKLIST.md'
  )
  const checklist = fs.readFileSync(checklistPath, 'utf8')

  it('states the current public-launch decision explicitly', () => {
    expect(checklist).toContain('Current status: NOT READY FOR PUBLIC ONBOARDING')
  })

  it('covers every required production risk area', () => {
    for (const heading of [
      'Authentication and Session Security',
      'Authorisation and Tenant Isolation',
      'Database, Migrations, and Recovery',
      'Secrets, Infrastructure, and Third Parties',
      'Observability and Incident Response',
      'Privacy, Legal, and User Rights',
      'Reliability, Performance, and Capacity',
      'Final Launch Approval',
    ]) {
      expect(checklist).toContain(heading)
    }
  })

  it('requires evidence, review history, and explicit approval', () => {
    expect(checklist).toContain('Evidence:')
    expect(checklist).toContain('# Exception Register')
    expect(checklist).toContain('# Review History')
    expect(checklist).toContain('Final decision:')
  })
})
