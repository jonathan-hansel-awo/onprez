/**
 * @jest-environment node
 */

import {
  verifyMfaChallenge,
  resendMfaChallenge,
  isDeviceTrusted,
  hashMfaTempToken,
} from '@/lib/services/mfa-challenge'
import { verifyMfaToken, verifyBackupCode } from '@/lib/services/mfa'
import { createSession } from '@/lib/services/session'
import { generateToken } from '@/lib/utils/token'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    mfaTempToken: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    trustedDevice: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/services/mfa', () => ({
  verifyMfaToken: jest.fn(),
  verifyBackupCode: jest.fn(),
}))

jest.mock('@/lib/services/session', () => ({
  createSession: jest.fn(),
}))

jest.mock('@/lib/utils/token', () => ({
  generateToken: jest.fn(),
}))

jest.mock('@/lib/services/security-logging', () => ({
  logSecurityEvent: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  mfaTempToken: {
    findFirst: jest.Mock
    updateMany: jest.Mock
    update: jest.Mock
    create: jest.Mock
  }
  user: {
    update: jest.Mock
  }
  trustedDevice: {
    findFirst: jest.Mock
    update: jest.Mock
    create: jest.Mock
  }
  $transaction: jest.Mock
}

const mockedVerifyMfaToken = verifyMfaToken as jest.Mock
const mockedVerifyBackupCode = verifyBackupCode as jest.Mock
const mockedCreateSession = createSession as jest.Mock
const mockedGenerateToken = generateToken as jest.Mock
const mockedLogSecurityEvent = logSecurityEvent as jest.Mock

const validTempTokenRecord = {
  id: 'temp-token-1',
  token: 'hashed-temp-token',
  userId: 'user-1',
  usedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  user: {
    id: 'user-1',
    email: 'user@example.com',
    emailVerified: true,
  },
}

describe('MFA challenge service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.MFA_TEMP_TOKEN_PEPPER = 'test-temp-token-pepper'
    process.env.TRUSTED_DEVICE_PEPPER = 'test-trusted-device-pepper'
  })

  it('hashMfaTempToken returns a non-raw deterministic HMAC value', () => {
    const hash1 = hashMfaTempToken('raw-temp-token')
    const hash2 = hashMfaTempToken('raw-temp-token')

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe('raw-temp-token')
    expect(hash1).toHaveLength(64)
  })

  it('verifyMfaChallenge looks up temp token by hashed token with legacy fallback', async () => {
    mockedPrisma.mfaTempToken.findFirst.mockResolvedValue(validTempTokenRecord)
    mockedVerifyMfaToken.mockResolvedValue({ success: true, message: 'Verified' })
    mockedPrisma.mfaTempToken.updateMany.mockResolvedValue({ count: 1 })
    mockedCreateSession.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    })
    mockedPrisma.user.update.mockResolvedValue({})
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const result = await verifyMfaChallenge({
      tempToken: 'raw-temp-token',
      code: '123456',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })

    expect(result.success).toBe(true)

    expect(mockedPrisma.mfaTempToken.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ token: hashMfaTempToken('raw-temp-token') }, { token: 'raw-temp-token' }],
      },
      include: { user: true },
    })
  })

  it('verifyMfaChallenge rejects already-used temp tokens', async () => {
    mockedPrisma.mfaTempToken.findFirst.mockResolvedValue({
      ...validTempTokenRecord,
      usedAt: new Date(),
    })

    const result = await verifyMfaChallenge({
      tempToken: 'raw-temp-token',
      code: '123456',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('TOKEN_ALREADY_USED')
    expect(mockedVerifyMfaToken).not.toHaveBeenCalled()
    expect(mockedCreateSession).not.toHaveBeenCalled()
  })

  it('verifyMfaChallenge atomically consumes temp token before creating session', async () => {
    mockedPrisma.mfaTempToken.findFirst.mockResolvedValue(validTempTokenRecord)
    mockedVerifyMfaToken.mockResolvedValue({ success: true, message: 'Verified' })

    // Simulates another request using the same temp token first.
    mockedPrisma.mfaTempToken.updateMany.mockResolvedValue({ count: 0 })

    const result = await verifyMfaChallenge({
      tempToken: 'raw-temp-token',
      code: '123456',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('TOKEN_ALREADY_USED')
    expect(mockedCreateSession).not.toHaveBeenCalled()
  })

  it('verifyMfaChallenge marks failed MFA attempts on the user', async () => {
    mockedPrisma.mfaTempToken.findFirst.mockResolvedValue(validTempTokenRecord)
    mockedVerifyMfaToken.mockResolvedValue({
      success: false,
      message: 'Invalid verification code',
      error: 'INVALID_TOKEN',
    })
    mockedPrisma.user.update.mockResolvedValue({})

    const result = await verifyMfaChallenge({
      tempToken: 'raw-temp-token',
      code: '000000',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('INVALID_TOKEN')

    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLogin: expect.any(Date),
      },
    })
  })

  it('verifyMfaChallenge can verify backup codes', async () => {
    mockedPrisma.mfaTempToken.findFirst.mockResolvedValue(validTempTokenRecord)
    mockedVerifyBackupCode.mockResolvedValue({ success: true, message: 'Backup code verified' })
    mockedPrisma.mfaTempToken.updateMany.mockResolvedValue({ count: 1 })
    mockedCreateSession.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    })
    mockedPrisma.user.update.mockResolvedValue({})
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const result = await verifyMfaChallenge({
      tempToken: 'raw-temp-token',
      code: 'ABCD-1234',
      isBackupCode: true,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })

    expect(result.success).toBe(true)
    expect(mockedVerifyBackupCode).toHaveBeenCalledWith(
      'user-1',
      'ABCD-1234',
      '127.0.0.1',
      'test-agent'
    )
    expect(mockedVerifyMfaToken).not.toHaveBeenCalled()
  })

  it('verifyMfaChallenge updates an existing trusted device instead of duplicating it', async () => {
    mockedPrisma.mfaTempToken.findFirst.mockResolvedValue(validTempTokenRecord)
    mockedVerifyMfaToken.mockResolvedValue({ success: true, message: 'Verified' })
    mockedPrisma.mfaTempToken.updateMany.mockResolvedValue({ count: 1 })
    mockedCreateSession.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    })

    mockedPrisma.trustedDevice.findFirst.mockResolvedValue({
      id: 'trusted-device-1',
    })

    mockedPrisma.trustedDevice.update.mockResolvedValue({})
    mockedPrisma.user.update.mockResolvedValue({})
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const result = await verifyMfaChallenge({
      tempToken: 'raw-temp-token',
      code: '123456',
      trustDevice: true,
      deviceInfo: {
        browser: 'Chrome',
        os: 'Windows',
        device: 'Desktop',
      },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })

    expect(result.success).toBe(true)
    expect(mockedPrisma.trustedDevice.update).toHaveBeenCalled()
    expect(mockedPrisma.trustedDevice.create).not.toHaveBeenCalled()
  })

  it('isDeviceTrusted updates lastUsedAt for trusted devices', async () => {
    mockedPrisma.trustedDevice.findFirst.mockResolvedValue({
      id: 'trusted-device-1',
    })

    mockedPrisma.trustedDevice.update.mockResolvedValue({})

    const result = await isDeviceTrusted(
      'user-1',
      {
        browser: 'Chrome',
        os: 'Windows',
        device: 'Desktop',
      },
      'test-agent'
    )

    expect(result).toBe(true)

    expect(mockedPrisma.trustedDevice.update).toHaveBeenCalledWith({
      where: { id: 'trusted-device-1' },
      data: { lastUsedAt: expect.any(Date) },
    })
  })

  it('resendMfaChallenge stores a hashed new temp token, not the raw token', async () => {
    mockedGenerateToken.mockReturnValue('new-raw-temp-token')

    mockedPrisma.mfaTempToken.findFirst.mockResolvedValue(validTempTokenRecord)
    mockedPrisma.mfaTempToken.update.mockReturnValue('update-old-token-operation')
    mockedPrisma.mfaTempToken.create.mockReturnValue('create-new-token-operation')
    mockedPrisma.$transaction.mockResolvedValue([])
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const result = await resendMfaChallenge('old-raw-temp-token', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(true)
    expect(result.tempToken).toBe('new-raw-temp-token')

    expect(mockedPrisma.mfaTempToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        token: hashMfaTempToken('new-raw-temp-token'),
        expiresAt: expect.any(Date),
      },
    })

    expect(mockedPrisma.$transaction).toHaveBeenCalledWith([
      'update-old-token-operation',
      'create-new-token-operation',
    ])
  })

  it('resendMfaChallenge rejects already-used temp tokens', async () => {
    mockedPrisma.mfaTempToken.findFirst.mockResolvedValue({
      ...validTempTokenRecord,
      usedAt: new Date(),
    })

    const result = await resendMfaChallenge('old-raw-temp-token', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(false)
    expect(mockedPrisma.mfaTempToken.create).not.toHaveBeenCalled()
  })
})
