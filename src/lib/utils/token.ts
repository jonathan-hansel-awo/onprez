import crypto from 'crypto'

/**
 * Generate a random token
 * @param length - Token length in bytes (default: 32)
 * @returns Hex string token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate a verification token with expiry
 * @param expiryHours - Hours until token expires (default: 24)
 * @returns Token and expiry date
 */
export function generateVerificationToken(expiryHours: number = 24): {
  token: string
  expiresAt: Date
} {
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiryHours)

  return { token, expiresAt }
}

/**
 * Generate a password reset token with expiry
 * @param expiryHours - Hours until token expires (default: 1)
 * @returns Token and expiry date
 */
export function generatePasswordResetToken(expiryHours: number = 1): {
  token: string
  expiresAt: Date
} {
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiryHours)

  return { token, expiresAt }
}

/**
 * Check if a token has expired
 * @param expiresAt - Token expiry date
 * @returns True if expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}
