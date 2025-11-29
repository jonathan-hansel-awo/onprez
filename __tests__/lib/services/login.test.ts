// Mock env
jest.mock('@/lib/config/env', () => ({
  env: {
    APP_URL: 'https://onprez.com',
    SUPPORT_EMAIL: 'support@onprez.com',
  },
}))

// Mock Prisma with factory functions
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      get findUnique() {
        return jest.fn()
      },
      get update() {
        return jest.fn()
      },
    },
    authAttempt: {
      get create() {
        return jest.fn()
      },
      get updateMany() {
        return jest.fn()
      },
    },
    session: {
      get create() {
        return jest.fn()
      },
    },
  },
}))

// Mock password verification
jest.mock('@/lib/auth/password', () => ({
  get verifyPassword() {
    return jest.fn()
  },
}))

// Mock JWT generation
jest.mock('@/lib/auth/jwt', () => ({
  get generateAccessToken() {
    return jest.fn()
  },
  get generateRefreshToken() {
    return jest.fn()
  },
}))

// Mock email service
jest.mock('@/lib/services/email', () => ({
  get sendNewDeviceAlert() {
    return jest.fn()
  },
}))

// Mock security logging
jest.mock('@/lib/services/security-logging', () => ({
  get logSecurityEvent() {
    return jest.fn()
  },
}))

import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { sendNewDeviceAlert } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { loginUser } from '@/lib/services/login'

describe('Login Service', () => {
  const mockDeviceInfo = {
    userAgent: 'Mozilla/5.0',
    ipAddress: '127.0.0.1',
    platform: 'Windows',
    browser: 'Chrome',
  }

  const mockCredentials = {
    email: 'test@example.com',
    password: 'Test123!',
    rememberMe: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login user successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      emailVerified: true,
      accountLocked: false,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      sessions: [],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})
    ;(verifyPassword as jest.Mock).mockResolvedValue(true)
    ;(generateAccessToken as jest.Mock).mockReturnValue('access-token')
    ;(generateRefreshToken as jest.Mock).mockReturnValue('refresh-token')
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})
    ;(prisma.session.create as jest.Mock).mockResolvedValue({})
    ;(prisma.authAttempt.updateMany as jest.Mock).mockResolvedValue({})
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await loginUser(mockCredentials, mockDeviceInfo)

    expect(result.success).toBe(true)
    expect(result.accessToken).toBe('access-token')
    expect(result.refreshToken).toBe('refresh-token')
    expect(result.user?.id).toBe('user-123')
  })

  it('should fail for invalid email', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await loginUser(mockCredentials, mockDeviceInfo)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid email or password')
  })

  it('should fail for locked account', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      emailVerified: true,
      accountLocked: true,
      mfaEnabled: false,
      failedLoginAttempts: 5,
      sessions: [],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await loginUser(mockCredentials, mockDeviceInfo)

    expect(result.success).toBe(false)
    expect(result.error).toContain('locked')
  })

  it('should fail for unverified email', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      emailVerified: false,
      accountLocked: false,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      sessions: [],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})

    const result = await loginUser(mockCredentials, mockDeviceInfo)

    expect(result.success).toBe(false)
    expect(result.error).toContain('verify your email')
  })

  it('should increment failed attempts on wrong password', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      emailVerified: true,
      accountLocked: false,
      mfaEnabled: false,
      failedLoginAttempts: 2,
      sessions: [],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})
    ;(verifyPassword as jest.Mock).mockResolvedValue(false)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await loginUser(mockCredentials, mockDeviceInfo)

    expect(result.success).toBe(false)
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedLoginAttempts: 3,
        }),
      })
    )
  })

  it('should lock account after 5 failed attempts', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      emailVerified: true,
      accountLocked: false,
      mfaEnabled: false,
      failedLoginAttempts: 4,
      sessions: [],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})
    ;(verifyPassword as jest.Mock).mockResolvedValue(false)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await loginUser(mockCredentials, mockDeviceInfo)

    expect(result.success).toBe(false)
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          accountLocked: true,
        }),
      })
    )
  })

  it('should require MFA if enabled', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      emailVerified: true,
      accountLocked: false,
      mfaEnabled: true,
      failedLoginAttempts: 0,
      sessions: [],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})
    ;(verifyPassword as jest.Mock).mockResolvedValue(true)
    ;(generateAccessToken as jest.Mock).mockReturnValue('mfa-token')
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await loginUser(mockCredentials, mockDeviceInfo)

    expect(result.success).toBe(true)
    expect(result.requiresMfa).toBe(true)
    expect(result.mfaToken).toBe('mfa-token')
  })

  it('should send new device alert', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      emailVerified: true,
      accountLocked: false,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      sessions: [
        {
          userAgent: 'Different Agent',
          ipAddress: '192.168.1.1',
        },
      ],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})
    ;(verifyPassword as jest.Mock).mockResolvedValue(true)
    ;(generateAccessToken as jest.Mock).mockReturnValue('access-token')
    ;(generateRefreshToken as jest.Mock).mockReturnValue('refresh-token')
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})
    ;(prisma.session.create as jest.Mock).mockResolvedValue({})
    ;(prisma.authAttempt.updateMany as jest.Mock).mockResolvedValue({})
    ;(sendNewDeviceAlert as jest.Mock).mockResolvedValue({ success: true })
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await loginUser(mockCredentials, mockDeviceInfo)

    expect(result.success).toBe(true)
    expect(sendNewDeviceAlert).toHaveBeenCalledWith(
      'test@example.com',
      expect.objectContaining({
        deviceInfo: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
      })
    )
  })
})
