/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('P2-023 PII handling contract', () => {
  it('keeps a complete, owned and time-bounded machine-readable inventory', () => {
    const inventory = JSON.parse(read('docs/privacy/PII_INVENTORY.json')) as {
      nextReviewDue: string
      processingActivities: unknown[]
      fieldPolicies: Array<Record<string, unknown>>
    }

    expect(inventory.processingActivities).toHaveLength(5)
    expect(inventory.fieldPolicies.length).toBeGreaterThanOrEqual(20)
    expect(Date.parse(inventory.nextReviewDue)).toBeGreaterThan(Date.parse('2026-08-01'))
    expect(inventory.fieldPolicies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fields: expect.arrayContaining(['User.email']),
          deletionOwner: 'platform_privacy',
        }),
        expect.objectContaining({
          fields: expect.arrayContaining(['Appointment.customerEmail']),
          deletionOwner: 'business_controller',
        }),
      ])
    )
  })

  it('runs the audit in pull requests and on a recurring schedule', () => {
    const tests = read('.github/workflows/test.yml')
    const recurring = read('.github/workflows/privacy-audit.yml')

    expect(tests).toContain('npm run privacy:audit')
    expect(recurring).toContain('schedule:')
    expect(recurring).toContain('npm run privacy:audit')
  })

  it('keeps current customer lookup and MFA credentials out of URLs and browser token storage', () => {
    const successPage = read('src/app/(public)/[handle]/book/success/BookingSuccessClient.tsx')
    const login = read('src/app/(auth)/login/page.tsx')
    const challenge = read('src/app/(auth)/mfa/challenge/page.tsx')
    const challengeRoute = read('src/app/api/auth/mfa/challenge/route.ts')

    expect(successPage).not.toContain("searchParams.set('customerEmail'")
    expect(successPage).toContain("fetch('/api/bookings/payment-status', {")
    expect(login).not.toContain('/mfa/challenge?token=')
    expect(challenge).not.toContain("localStorage.setItem('accessToken'")
    expect(challengeRoute).toContain("response.cookies.set('accessToken'")
  })
})
