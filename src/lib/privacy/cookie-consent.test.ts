import {
  COOKIE_CONSENT_STORAGE_KEY,
  hasAnalyticsConsent,
  readCookieConsent,
  saveCookieConsent,
} from './cookie-consent'

function createStorage(initialValues: Record<string, string> = {}) {
  const values = new Map(Object.entries(initialValues))

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

describe('cookie consent helpers', () => {
  it('returns null before the visitor has made a choice', () => {
    expect(readCookieConsent(createStorage())).toBeNull()
  })

  it('stores an essential-only choice', () => {
    const storage = createStorage()

    const preference = saveCookieConsent(false, storage)

    expect(preference.analytics).toBe(false)
    expect(readCookieConsent(storage)).toEqual(preference)
    expect(hasAnalyticsConsent(storage)).toBe(false)
  })

  it('stores affirmative consent for optional analytics', () => {
    const storage = createStorage()

    saveCookieConsent(true, storage)

    expect(hasAnalyticsConsent(storage)).toBe(true)
  })

  it('removes malformed or outdated consent records', () => {
    const storage = createStorage({
      [COOKIE_CONSENT_STORAGE_KEY]: JSON.stringify({ version: 0, analytics: true }),
    })

    expect(readCookieConsent(storage)).toBeNull()
    expect(storage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBeNull()
  })
})
