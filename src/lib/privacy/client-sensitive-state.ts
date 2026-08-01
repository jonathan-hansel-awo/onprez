type SessionStorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const PENDING_VERIFICATION_EMAIL_KEY = 'onprez:pending-verification-email'
const MFA_CHALLENGE_KEY = 'onprez:mfa-challenge'

type MfaChallengeState = {
  tempToken: string
  redirectTo: string
}

function getSessionStorage(): SessionStorageLike | null {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function safeRelativeRedirect(value: string | null | undefined): string {
  const candidate = value?.trim() || '/dashboard'

  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/dashboard'

  try {
    const parsed = new URL(candidate, 'https://onprez.invalid')
    return parsed.origin === 'https://onprez.invalid'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : '/dashboard'
  } catch {
    return '/dashboard'
  }
}

export function savePendingVerificationEmail(
  email: string,
  storage: SessionStorageLike | null = getSessionStorage()
): void {
  const normalizedEmail = email.trim().toLowerCase()
  if (!storage || !normalizedEmail) return

  try {
    storage.setItem(PENDING_VERIFICATION_EMAIL_KEY, normalizedEmail)
  } catch {
    // Storage restrictions must not turn a completed signup into a failure.
  }
}

export function getPendingVerificationEmail(
  storage: SessionStorageLike | null = getSessionStorage()
): string | null {
  if (!storage) return null

  try {
    return storage.getItem(PENDING_VERIFICATION_EMAIL_KEY)
  } catch {
    return null
  }
}

export function clearPendingVerificationEmail(
  storage: SessionStorageLike | null = getSessionStorage()
): void {
  try {
    storage?.removeItem(PENDING_VERIFICATION_EMAIL_KEY)
  } catch {
    // Best-effort cleanup only.
  }
}

export function saveMfaChallenge(
  tempToken: string,
  redirectTo: string | null | undefined,
  storage: SessionStorageLike | null = getSessionStorage()
): void {
  if (!storage || !tempToken.trim()) return

  try {
    storage.setItem(
      MFA_CHALLENGE_KEY,
      JSON.stringify({ tempToken: tempToken.trim(), redirectTo: safeRelativeRedirect(redirectTo) })
    )
  } catch {
    // The challenge page will fail closed and return the visitor to login.
  }
}

export function getMfaChallenge(
  storage: SessionStorageLike | null = getSessionStorage()
): MfaChallengeState | null {
  if (!storage) return null

  try {
    const raw = storage.getItem(MFA_CHALLENGE_KEY)
    if (!raw) return null

    const value = JSON.parse(raw) as Partial<MfaChallengeState>
    if (typeof value.tempToken !== 'string' || !value.tempToken.trim()) return null

    return {
      tempToken: value.tempToken,
      redirectTo: safeRelativeRedirect(value.redirectTo),
    }
  } catch {
    return null
  }
}

export function clearMfaChallenge(storage: SessionStorageLike | null = getSessionStorage()): void {
  try {
    storage?.removeItem(MFA_CHALLENGE_KEY)
  } catch {
    // Best-effort cleanup only.
  }
}
