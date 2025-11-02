import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'crypto'
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
function encryptSecret(secret: string): { encrypted: string; iv: string } {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return {
    encrypted,
    iv: iv.toString('hex'),
  }
}

/**
 * Decrypt MFA secret from storage
 */
function decryptSecret(encrypted: string, iv: string): string {
  const decipher = createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv, 'hex'))
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Generate secure backup codes
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code.match(/.{1,4}/g)?.join('-') || code)
  }
  return codes
}

/**
 * Hash backup code for storage
 */
function hashBackupCode(code: string): string {
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
      details: {
        email: userEmail,
      },
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
      details: {
        email: user.email,
      },
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
      include: { mfaBackupCodes: true },
    })

    if (!user || !user.mfaEnabled) {
      return {
        success: false,
        message: 'MFA is not enabled for this account',
        error: 'MFA_NOT_ENABLED',
      }
    }

    // Hash the provided code
    const hashedCode = hashBackupCode(code)

    // Find unused backup code
    const backupCode = user.mfaBackupCodes.find(bc => bc.hashedCode === hashedCode && !bc.usedAt)

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

    // Mark backup code as used
    await prisma.mfaBackupCode.update({
      where: { id: backupCode.id },
      data: { usedAt: new Date() },
    })

    await logSecurityEvent({
      userId: user.id,
      action: 'mfa_backup_code_used',
      details: {},
      ipAddress,
      userAgent,
      severity: 'warning', // Using backup code is noteworthy
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
      include: {
        mfaBackupCodes: {
          where: { usedAt: null },
        },
      },
    })

    if (!user) {
      return {
        success: false,
        mfaEnabled: false,
        hasBackupCodes: false,
      }
    }

    return {
      success: true,
      mfaEnabled: user.mfaEnabled,
      hasBackupCodes: user.mfaBackupCodes.length > 0,
      backupCodesCount: user.mfaBackupCodes.length,
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
    })

    if (!user || !user.mfaEnabled) {
      return {
        success: false,
        message: 'MFA is not enabled for this account',
        error: 'MFA_NOT_ENABLED',
      }
    }

    // Delete old backup codes
    await prisma.mfaBackupCode.deleteMany({
      where: { userId: user.id },
    })

    // Generate new backup codes
    const backupCodes = generateBackupCodes(8)
    const hashedBackupCodes = backupCodes.map(hashBackupCode)

    // Store new backup codes
    await prisma.mfaBackupCode.createMany({
      data: hashedBackupCodes.map(hashedCode => ({
        userId: user.id,
        hashedCode,
      })),
    })

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
        secret: '', // Not needed for regenerate
        qrCodeUrl: '', // Not needed for regenerate
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
