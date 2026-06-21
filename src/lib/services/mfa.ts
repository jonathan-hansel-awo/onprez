import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { randomBytes, createHash, createHmac, createCipheriv, createDecipheriv } from 'crypto'
import { logSecurityEvent } from './security-logging'

interface MfaSetupResult {
  success: boolean
  message: string
  data?: {
    secret: string
    qrCodeUrl: string
    backupCodes: string[]
  }
  error?: string
}

interface MfaVerificationResult {
  success: boolean
  message: string
  error?: string
}

interface MfaStatusResult {
  success: boolean
  mfaEnabled: boolean
  hasBackupCodes: boolean
  backupCodesCount?: number
}

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY =
  process.env.MFA_ENCRYPTION_KEY ||
  createHash('sha256')
    .update(process.env.JWT_SECRET || 'default-key')
    .digest()

/**
 * Encrypt MFA secret for storage
 */
function getEncryptionKey(): Buffer {
  const source = process.env.MFA_ENCRYPTION_KEY

  if (process.env.NODE_ENV === 'production' && !source) {
    throw new Error('MFA_ENCRYPTION_KEY is required in production')
  }

  return createHash('sha256')
    .update(source || process.env.JWT_SECRET || 'development-only-mfa-key')
    .digest()
}

function getBackupCodePepper(): string {
  const pepper = process.env.MFA_BACKUP_CODE_PEPPER

  if (process.env.NODE_ENV === 'production' && !pepper) {
    throw new Error('MFA_BACKUP_CODE_PEPPER is required in production')
  }

  return pepper || process.env.JWT_SECRET || 'development-only-backup-code-pepper'
}

/**
 * Encrypt MFA secret for storage.
 *
 * New format: AES-256-GCM stored as "ciphertext:authTag".
 * Old CBC values are still supported in decryptSecret() for compatibility.
 */
function encryptSecret(secret: string): { encrypted: string; iv: string } {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)

  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  return {
    encrypted: `${encrypted}:${authTag}`,
    iv: iv.toString('hex'),
  }
}

/**
 * Decrypt MFA secret from storage.
 *
 * Supports:
 * - New AES-GCM format: "ciphertext:authTag"
 * - Legacy AES-CBC format: "ciphertext"
 */
function decryptSecret(encrypted: string, iv: string): string {
  const key = getEncryptionKey()

  if (encrypted.includes(':')) {
    const [ciphertext, authTag] = encrypted.split(':')

    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'))
    decipher.setAuthTag(Buffer.from(authTag, 'hex'))

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  // Legacy fallback for secrets already stored with AES-CBC.
  const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate secure backup codes.
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    const code = randomBytes(6).toString('hex').toUpperCase()
    codes.push(code.match(/.{1,4}/g)?.join('-') || code)
  }

  return codes
}

function normalizeBackupCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

/**
 * Hash backup code for storage.
 *
 * Use HMAC rather than plain SHA-256 so a database-only leak does not allow
 * cheap offline guessing of backup codes.
 */
function hashBackupCode(code: string): string {
  return createHmac('sha256', getBackupCodePepper()).update(normalizeBackupCode(code)).digest('hex')
}

/**
 * Legacy fallback for backup codes created before HMAC hashing.
 * Keep temporarily so existing users are not locked out.
 */
function legacyHashBackupCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/**
 * Setup MFA for user - generates secret and backup codes
 */
export async function setupMfa(
  userId: string,
  userEmail: string,
  ipAddress: string,
  userAgent: string
): Promise<MfaSetupResult> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mfaSecret: true },
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    // Check if MFA is already enabled
    if (user.mfaEnabled && user.mfaSecret) {
      return {
        success: false,
        message: 'MFA is already enabled for this account',
        error: 'MFA_ALREADY_ENABLED',
      }
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `OnPrez (${userEmail})`,
      issuer: 'OnPrez',
      length: 32,
    })

    if (!secret.base32) {
      throw new Error('Failed to generate secret')
    }

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '')

    // Generate backup codes
    const backupCodes = generateBackupCodes(8)
    const hashedBackupCodes = backupCodes.map(hashBackupCode)

    // Encrypt secret for storage
    const { encrypted, iv } = encryptSecret(secret.base32)

    // Delete existing MFA setup if any (cleanup)
    if (user.mfaSecret) {
      await prisma.mfaSecret.delete({
        where: { userId: user.id },
      })
    }

    await prisma.mfaBackupCode.deleteMany({
      where: { userId: user.id },
    })

    // Store encrypted secret (not verified yet)
    await prisma.mfaSecret.create({
      data: {
        userId: user.id,
        encryptedSecret: encrypted,
        iv,
        verified: false,
      },
    })

    // Store hashed backup codes
    await prisma.mfaBackupCode.createMany({
      data: hashedBackupCodes.map(hashedCode => ({
        userId: user.id,
        hashedCode,
      })),
    })

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      action: 'mfa_setup_initiated',
      details: {},
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message: 'MFA setup initiated successfully',
      data: {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
      },
    }
  } catch (error) {
    console.error('MFA setup error:', error)
    return {
      success: false,
      message: 'Failed to setup MFA',
      error: 'SETUP_FAILED',
    }
  }
}

/**
 * Verify TOTP code and enable MFA
 */
export async function verifyMfaSetup(
  userId: string,
  token: string,
  ipAddress: string,
  userAgent: string
): Promise<MfaVerificationResult> {
  try {
    // Get user with MFA secret
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mfaSecret: true },
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    if (!user.mfaSecret) {
      return {
        success: false,
        message: 'MFA setup not initiated',
        error: 'MFA_NOT_SETUP',
      }
    }

    if (user.mfaSecret.verified && user.mfaEnabled) {
      return {
        success: false,
        message: 'MFA is already enabled',
        error: 'MFA_ALREADY_ENABLED',
      }
    }

    // Decrypt secret
    const secret = decryptSecret(user.mfaSecret.encryptedSecret, user.mfaSecret.iv)

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after for clock drift
    })

    if (!verified) {
      // Log failed verification
      await logSecurityEvent({
        userId: user.id,
        action: 'mfa_verification_failed',
        details: {
          reason: 'Invalid token',
        },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: false,
        message: 'Invalid verification code',
        error: 'INVALID_TOKEN',
      }
    }

    // Mark secret as verified and enable MFA
    await prisma.$transaction([
      prisma.mfaSecret.update({
        where: { userId: user.id },
        data: { verified: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { mfaEnabled: true },
      }),
    ])

    // Log successful MFA enable
    await logSecurityEvent({
      userId: user.id,
      action: 'mfa_enabled',
      details: {},
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message: 'MFA enabled successfully',
    }
  } catch (error) {
    console.error('MFA verification error:', error)
    return {
      success: false,
      message: 'Failed to verify MFA code',
      error: 'VERIFICATION_FAILED',
    }
  }
}

/**
 * Verify TOTP token during login
 */
export async function verifyMfaToken(
  userId: string,
  token: string,
  ipAddress: string,
  userAgent: string
): Promise<MfaVerificationResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mfaSecret: true },
    })

    if (!user || !user.mfaSecret || !user.mfaEnabled) {
      return {
        success: false,
        message: 'MFA is not enabled for this account',
        error: 'MFA_NOT_ENABLED',
      }
    }

    // Decrypt secret
    const secret = decryptSecret(user.mfaSecret.encryptedSecret, user.mfaSecret.iv)

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    })

    if (!verified) {
      await logSecurityEvent({
        userId: user.id,
        action: 'mfa_login_failed',
        details: {
          reason: 'Invalid token',
        },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: false,
        message: 'Invalid verification code',
        error: 'INVALID_TOKEN',
      }
    }

    await logSecurityEvent({
      userId: user.id,
      action: 'mfa_login_success',
      details: {},
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message: 'Token verified successfully',
    }
  } catch (error) {
    console.error('MFA token verification error:', error)
    return {
      success: false,
      message: 'Failed to verify MFA token',
      error: 'VERIFICATION_FAILED',
    }
  }
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string,
  ipAddress: string,
  userAgent: string
): Promise<MfaVerificationResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mfaEnabled: true,
      },
    })

    if (!user || !user.mfaEnabled) {
      return {
        success: false,
        message: 'MFA is not enabled for this account',
        error: 'MFA_NOT_ENABLED',
      }
    }

    const hashedCode = hashBackupCode(code)
    const legacyHashedCode = legacyHashBackupCode(code)

    const backupCode = await prisma.mfaBackupCode.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        OR: [{ hashedCode }, { hashedCode: legacyHashedCode }],
      },
      select: {
        id: true,
      },
    })

    if (!backupCode) {
      await logSecurityEvent({
        userId: user.id,
        action: 'mfa_backup_code_failed',
        details: {
          reason: 'Invalid or used backup code',
        },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: false,
        message: 'Invalid or already used backup code',
        error: 'INVALID_BACKUP_CODE',
      }
    }

    const updateResult = await prisma.mfaBackupCode.updateMany({
      where: {
        id: backupCode.id,
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    if (updateResult.count !== 1) {
      return {
        success: false,
        message: 'Invalid or already used backup code',
        error: 'INVALID_BACKUP_CODE',
      }
    }

    await logSecurityEvent({
      userId: user.id,
      action: 'mfa_backup_code_used',
      details: {},
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return {
      success: true,
      message: 'Backup code verified successfully',
    }
  } catch (error) {
    console.error('Backup code verification error:', error)

    return {
      success: false,
      message: 'Failed to verify backup code',
      error: 'VERIFICATION_FAILED',
    }
  }
}

/**
 * Get MFA status for user
 */
export async function getMfaStatus(userId: string): Promise<MfaStatusResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mfaEnabled: true,
      },
    })

    if (!user) {
      return {
        success: false,
        mfaEnabled: false,
        hasBackupCodes: false,
      }
    }

    const backupCodesCount = await prisma.mfaBackupCode.count({
      where: {
        userId,
        usedAt: null,
      },
    })

    return {
      success: true,
      mfaEnabled: user.mfaEnabled,
      hasBackupCodes: backupCodesCount > 0,
      backupCodesCount,
    }
  } catch (error) {
    console.error('Get MFA status error:', error)

    return {
      success: false,
      mfaEnabled: false,
      hasBackupCodes: false,
    }
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<MfaSetupResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mfaEnabled: true,
      },
    })

    if (!user || !user.mfaEnabled) {
      return {
        success: false,
        message: 'MFA is not enabled for this account',
        error: 'MFA_NOT_ENABLED',
      }
    }

    const backupCodes = generateBackupCodes(8)
    const hashedBackupCodes = backupCodes.map(hashBackupCode)

    await prisma.$transaction([
      prisma.mfaBackupCode.deleteMany({
        where: { userId: user.id },
      }),
      prisma.mfaBackupCode.createMany({
        data: hashedBackupCodes.map(hashedCode => ({
          userId: user.id,
          hashedCode,
        })),
      }),
    ])

    await logSecurityEvent({
      userId: user.id,
      action: 'mfa_backup_codes_regenerated',
      details: {},
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return {
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        secret: '',
        qrCodeUrl: '',
        backupCodes,
      },
    }
  } catch (error) {
    console.error('Regenerate backup codes error:', error)

    return {
      success: false,
      message: 'Failed to regenerate backup codes',
      error: 'REGENERATE_FAILED',
    }
  }
}
