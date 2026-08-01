import {
  clearMfaChallenge,
  clearPendingVerificationEmail,
  getMfaChallenge,
  getPendingVerificationEmail,
  saveMfaChallenge,
  savePendingVerificationEmail,
} from './client-sensitive-state'

function createStorage() {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

describe('client sensitive state', () => {
  it('keeps a pending verification email in tab storage instead of a URL', () => {
    const storage = createStorage()

    savePendingVerificationEmail(' Ada@Example.com ', storage)

    expect(getPendingVerificationEmail(storage)).toBe('ada@example.com')
    clearPendingVerificationEmail(storage)
    expect(getPendingVerificationEmail(storage)).toBeNull()
  })

  it('keeps an MFA challenge out of the URL and restricts its redirect', () => {
    const storage = createStorage()

    saveMfaChallenge('temporary-secret', '/dashboard/bookings?view=week', storage)
    expect(getMfaChallenge(storage)).toEqual({
      tempToken: 'temporary-secret',
      redirectTo: '/dashboard/bookings?view=week',
    })

    saveMfaChallenge('temporary-secret', 'https://attacker.test', storage)
    expect(getMfaChallenge(storage)?.redirectTo).toBe('/dashboard')

    clearMfaChallenge(storage)
    expect(getMfaChallenge(storage)).toBeNull()
  })
})
