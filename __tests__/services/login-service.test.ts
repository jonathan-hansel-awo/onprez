/**
 * @jest-environment node
 */

import { loginUser } from '@/lib/services/login'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { generateToken } from '@/lib/utils/token'
import { hashMfaTempToken } from '@/lib/services/mfa-challenge'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { sendNewDeviceAlert } from '@/lib/services/email'
import { hashSessionToken } from '@/lib/auth/token-hash'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    authAttempt: {
      create: jest.fn(),
      update: jest.fn(),
    },
    mfaTempToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth/password', () => ({
  verifyPassword: jest.fn(),
}))

jest.mock('@/lib/auth/jwt', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}))

jest.mock('@/lib/utils/token', () => ({
  generateToken: jest.fn(),
}))

jest.mock('@/lib/services/mfa-challenge', () => ({
  hashMfaTempToken: jest.fn(),
}))

jest.mock('@/lib/services/security-logging', () => ({
  logSecurityEvent: jest.fn(),
}))

jest.mock('@/lib/services/email', () => ({
  sendNewDeviceAlert: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock
    update: jest.Mock
  }
  authAttempt: {
    create: jest.Mock
    update: jest.Mock
  }
  mfaTempToken: {
    updateMany: jest.Mock
    create: jest.Mock
  }
  session: {
    create: jest.Mock
  }
  $transaction: jest.Mock
}

const mockedVerifyPassword = verifyPassword as jest.Mock
const mockedGenerateAccessToken = generateAccessToken as jest.Mock
const mockedGenerateRefreshToken = generateRefreshToken as jest.Mock
const mockedGenerateToken = generateToken as jest.Mock
const mockedHashMfaTempToken = hashMfaTempToken as jest.Mock
const mockedLogSecurityEvent = logSecurityEvent as jest.Mock
const mockedSendNewDeviceAlert = sendNewDeviceAlert as jest.Mock

const deviceInfo = {
  userAgent: 'test-agent',
  ipAddress: '127.0.0.1',
  platform: 'Windows',
  browser: 'Chrome',
}

describe('loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedPrisma.authAttempt.create.mockResolvedValue({
      id: 'auth-attempt-1',
    })

    mockedLogSecurityEvent.mockResolvedValue(undefined)
  })

  it('returns generic invalid credentials when user does not exist', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null)

    const result = await loginUser(
      {
        email: 'Missing@Example.com',
        password: 'password',
      },
      deviceInfo
    )

    expect(result).toEqual({
      success: false,
      error: 'Invalid email or password',
    })

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'missing@example.com' },
      })
    )

    expect(mockedPrisma.authAttempt.create).toHaveBeenCalledWith({
      data: {
        userId: undefined,
        email: 'missing@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        attemptType: 'login',
        success: false,
      },
    })

    expect(mockedVerifyPassword).not.toHaveBeenCalled()
  })

  it('stores only hashed MFA temp token and returns raw temp token once', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: 'password-hash',
      accountLocked: false,
      failedLoginAttempts: 0,
      mfaEnabled: true,
      sessions: [],
    })

    mockedVerifyPassword.mockResolvedValue(true)
    mockedGenerateToken.mockReturnValue('raw-temp-token')
    mockedHashMfaTempToken.mockReturnValue('hashed-temp-token')

    mockedPrisma.mfaTempToken.updateMany.mockReturnValue('consume-existing-temp-tokens')
    mockedPrisma.mfaTempToken.create.mockReturnValue('create-new-temp-token')
    mockedPrisma.$transaction.mockResolvedValue([])

    const result = await loginUser(
      {
        email: 'user@example.com',
        password: 'password',
      },
      deviceInfo
    )

    expect(result).toEqual({
      success: true,
      requiresMfa: true,
      mfaToken: 'raw-temp-token',
    })

    expect(JSON.stringify(result)).not.toContain('userId')

    expect(mockedHashMfaTempToken).toHaveBeenCalledWith('raw-temp-token')

    expect(mockedPrisma.mfaTempToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        token: 'hashed-temp-token',
        expiresAt: expect.any(Date),
      },
    })

    expect(mockedPrisma.mfaTempToken.create.mock.calls[0][0].data.token).not.toBe('raw-temp-token')

    expect(mockedPrisma.$transaction).toHaveBeenCalledWith([
      'consume-existing-temp-tokens',
      'create-new-temp-token',
    ])
  })

  it('consumes existing active MFA temp tokens before creating a new one', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: 'password-hash',
      accountLocked: false,
      failedLoginAttempts: 0,
      mfaEnabled: true,
      sessions: [],
    })

    mockedVerifyPassword.mockResolvedValue(true)
    mockedGenerateToken.mockReturnValue('raw-temp-token')
    mockedHashMfaTempToken.mockReturnValue('hashed-temp-token')

    mockedPrisma.mfaTempToken.updateMany.mockReturnValue('consume-existing-temp-tokens')
    mockedPrisma.mfaTempToken.create.mockReturnValue('create-new-temp-token')
    mockedPrisma.$transaction.mockResolvedValue([])

    await loginUser(
      {
        email: 'user@example.com',
        password: 'password',
      },
      deviceInfo
    )

    expect(mockedPrisma.mfaTempToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: {
        usedAt: expect.any(Date),
      },
    })
  })

  it('increments failed attempts and locks account after too many invalid passwords', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: 'password-hash',
      accountLocked: false,
      failedLoginAttempts: 4,
      mfaEnabled: false,
      sessions: [],
    })

    mockedVerifyPassword.mockResolvedValue(false)
    mockedPrisma.user.update.mockResolvedValue({})

    const result = await loginUser(
      {
        email: 'user@example.com',
        password: 'wrong-password',
      },
      deviceInfo
    )

    expect(result.success).toBe(false)

    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        failedLoginAttempts: 5,
        accountLocked: true,
        lastFailedLogin: expect.any(Date),
      },
    })
  })

  it('creates a session and updates the exact auth attempt on successful non-MFA login', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: 'password-hash',
      accountLocked: false,
      failedLoginAttempts: 2,
      mfaEnabled: false,
      sessions: [
        {
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1',
        },
      ],
    })

    mockedVerifyPassword.mockResolvedValue(true)
    mockedGenerateAccessToken.mockReturnValue('access-token')
    mockedGenerateRefreshToken.mockReturnValue('refresh-token')
    mockedPrisma.user.update.mockResolvedValue({})
    mockedPrisma.session.create.mockResolvedValue({})
    mockedPrisma.authAttempt.update.mockResolvedValue({})

    const result = await loginUser(
      {
        email: 'user@example.com',
        password: 'password',
        rememberMe: true,
      },
      deviceInfo
    )

    expect(result).toEqual({
      success: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: true,
      },
    })

    expect(mockedPrisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        token: hashSessionToken('access-token'),
        refreshToken: hashSessionToken('refresh-token'),
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      }),
    })

    expect(mockedPrisma.authAttempt.update).toHaveBeenCalledWith({
      where: { id: 'auth-attempt-1' },
      data: { success: true },
    })
  })

  it('does not fail login if new-device email alert fails', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: 'password-hash',
      accountLocked: false,
      failedLoginAttempts: 0,
      mfaEnabled: false,
      sessions: [],
    })

    mockedVerifyPassword.mockResolvedValue(true)
    mockedGenerateAccessToken.mockReturnValue('access-token')
    mockedGenerateRefreshToken.mockReturnValue('refresh-token')
    mockedPrisma.user.update.mockResolvedValue({})
    mockedPrisma.session.create.mockResolvedValue({})
    mockedPrisma.authAttempt.update.mockResolvedValue({})
    mockedSendNewDeviceAlert.mockRejectedValue(new Error('Email provider down'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const result = await loginUser(
      {
        email: 'user@example.com',
        password: 'password',
      },
      deviceInfo
    )

    expect(result.success).toBe(true)
    expect(result.accessToken).toBe('access-token')
    expect(result.refreshToken).toBe('refresh-token')

    consoleSpy.mockRestore()
  })
})
