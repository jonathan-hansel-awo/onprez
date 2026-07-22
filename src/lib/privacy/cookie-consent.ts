export const COOKIE_CONSENT_STORAGE_KEY = 'onprez:cookie-consent:v1'
export const COOKIE_CONSENT_CHANGED_EVENT = 'onprez:cookie-consent-changed'
export const OPEN_COOKIE_PREFERENCES_EVENT = 'onprez:open-cookie-preferences'

const CONSENT_VERSION = 1 as const

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface CookieConsentPreference {
  version: typeof CONSENT_VERSION
  analytics: boolean
  updatedAt: string
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isCookieConsentPreference(value: unknown): value is CookieConsentPreference {
  if (!value || typeof value !== 'object') return false

  const preference = value as Record<string, unknown>

  return (
    preference.version === CONSENT_VERSION &&
    typeof preference.analytics === 'boolean' &&
    typeof preference.updatedAt === 'string'
  )
}

export function readCookieConsent(
  storage: StorageLike | null = getBrowserStorage()
): CookieConsentPreference | null {
  if (!storage) return null

  try {
    const storedValue = storage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    if (!storedValue) return null

    const parsedValue: unknown = JSON.parse(storedValue)
    if (!isCookieConsentPreference(parsedValue)) {
      storage.removeItem(COOKIE_CONSENT_STORAGE_KEY)
      return null
    }

    return parsedValue
  } catch {
    storage.removeItem(COOKIE_CONSENT_STORAGE_KEY)
    return null
  }
}

function clearAnalyticsCookies() {
  if (typeof document === 'undefined') return

  const analyticsCookiePrefixes = ['_ga', '_gid', '_gat', '_gcl_au']
  const hostnameParts = window.location.hostname.split('.')
  const candidateDomains = ['', window.location.hostname]

  if (hostnameParts.length > 1) {
    candidateDomains.push(`.${hostnameParts.slice(-2).join('.')}`)
  }

  document.cookie.split(';').forEach(cookie => {
    const cookieName = cookie.split('=')[0]?.trim()
    if (!cookieName || !analyticsCookiePrefixes.some(prefix => cookieName.startsWith(prefix))) {
      return
    }

    candidateDomains.forEach(domain => {
      const domainAttribute = domain ? `; domain=${domain}` : ''
      document.cookie = `${cookieName}=; Max-Age=0; path=/${domainAttribute}; SameSite=Lax`
    })
  })
}

export function saveCookieConsent(
  analytics: boolean,
  storage: StorageLike | null = getBrowserStorage()
): CookieConsentPreference {
  const preference: CookieConsentPreference = {
    version: CONSENT_VERSION,
    analytics,
    updatedAt: new Date().toISOString(),
  }

  storage?.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(preference))

  if (!analytics) {
    clearAnalyticsCookies()
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<CookieConsentPreference>(COOKIE_CONSENT_CHANGED_EVENT, {
        detail: preference,
      })
    )
  }

  return preference
}

export function hasAnalyticsConsent(storage?: StorageLike | null): boolean {
  return readCookieConsent(storage)?.analytics === true
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))
}
