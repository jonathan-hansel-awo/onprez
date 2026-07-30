import { createECDH, timingSafeEqual } from 'crypto'

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

function isMatchingKeyPair(publicKey: string | undefined, privateKey: string | undefined): boolean {
  if (!isBase64UrlKey(publicKey, 65) || !isBase64UrlKey(privateKey, 32)) return false

  try {
    const ecdh = createECDH('prime256v1')
    ecdh.setPrivateKey(Buffer.from(privateKey, 'base64url'))
    const configuredPublicKey = Buffer.from(publicKey, 'base64url')
    const derivedPublicKey = ecdh.getPublicKey(undefined, 'uncompressed')

    return (
      configuredPublicKey.length === derivedPublicKey.length &&
      timingSafeEqual(configuredPublicKey, derivedPublicKey)
    )
  } catch {
    return false
  }
}

export function getPushConfigurationStatus() {
  const publicKey = readEnvironmentValue('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
  const privateKey = readEnvironmentValue('VAPID_PRIVATE_KEY')
  const subject = readEnvironmentValue('VAPID_SUBJECT')
  const publicKeyConfigured = isBase64UrlKey(publicKey, 65)
  const privateKeyConfigured = isBase64UrlKey(privateKey, 32)

  return {
    publicKeyConfigured,
    privateKeyConfigured,
    subjectConfigured: isValidSubject(subject),
    keyPairMatches:
      publicKeyConfigured && privateKeyConfigured && isMatchingKeyPair(publicKey, privateKey),
  }
}

export function isPushConfigured(): boolean {
  const status = getPushConfigurationStatus()
  return (
    status.publicKeyConfigured &&
    status.privateKeyConfigured &&
    status.subjectConfigured &&
    status.keyPairMatches
  )
}

export function getPublicVapidKey(): string | null {
  if (!isPushConfigured()) return null
  return readEnvironmentValue('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || null
}

export function getVapidDetails(): VapidDetails {
  if (!isPushConfigured()) {
    throw new Error(
      'Web Push is not configured. Set a matching NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY plus VAPID_SUBJECT.'
    )
  }

  return {
    subject: readEnvironmentValue('VAPID_SUBJECT')!,
    publicKey: readEnvironmentValue('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!,
    privateKey: readEnvironmentValue('VAPID_PRIVATE_KEY')!,
  }
}
