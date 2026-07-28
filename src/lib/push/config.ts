interface VapidDetails {
  subject: string
  publicKey: string
  privateKey: string
}

function readEnvironmentValue(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

function isBase64UrlKey(value: string | undefined, expectedBytes: number): value is string {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) return false

  try {
    return Buffer.from(value, 'base64url').length === expectedBytes
  } catch {
    return false
  }
}

function isValidSubject(value: string | undefined): value is string {
  if (!value) return false

  if (value.startsWith('mailto:')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.slice('mailto:'.length))
  }

  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function getPushConfigurationStatus() {
  const publicKey = readEnvironmentValue('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
  const privateKey = readEnvironmentValue('VAPID_PRIVATE_KEY')
  const subject = readEnvironmentValue('VAPID_SUBJECT')

  return {
    publicKeyConfigured: isBase64UrlKey(publicKey, 65),
    privateKeyConfigured: isBase64UrlKey(privateKey, 32),
    subjectConfigured: isValidSubject(subject),
  }
}

export function isPushConfigured(): boolean {
  const status = getPushConfigurationStatus()
  return status.publicKeyConfigured && status.privateKeyConfigured && status.subjectConfigured
}

export function getPublicVapidKey(): string | null {
  if (!isPushConfigured()) return null
  return readEnvironmentValue('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || null
}

export function getVapidDetails(): VapidDetails {
  if (!isPushConfigured()) {
    throw new Error(
      'Web Push is not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.'
    )
  }

  return {
    subject: readEnvironmentValue('VAPID_SUBJECT')!,
    publicKey: readEnvironmentValue('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!,
    privateKey: readEnvironmentValue('VAPID_PRIVATE_KEY')!,
  }
}
