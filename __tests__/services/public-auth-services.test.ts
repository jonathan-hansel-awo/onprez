/**
 * @jest-environment node
 */

import {
  hashEmailVerificationToken,
  resendVerificationEmail,
  verifyEmail,
} from '@/lib/services/email-verification'
import {
  completePasswordReset,
  hashPasswordResetToken,
  requestPasswordReset,
} from '@/lib/services/password-reset'
import { signupUser } from '@/lib/services/signup'
import { prisma } from '@/lib/prisma'
import { generateVerificationToken, generatePasswordResetToken } from '@/lib/utils/token'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '@/lib/services/email'
import { hashPassword } from '@/lib/auth/password'
import { logSecurityEvent } from '@/lib/services/security-logging'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
    emailVerificationToken: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    passwordResetToken: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/utils/token', () => ({
  generateVerificationToken: jest.fn(),
  generatePasswordResetToken: jest.fn(),
}))

jest.mock('@/lib/services/email', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendPasswordChangedEmail: jest.fn(),
}))

jest.mock('@/lib/auth/password', () => ({
  hashPassword: jest.fn(),
}))

jest.mock('@/lib/services/security-logging', () => ({
  logSecurityEvent: jest.fn(),
}))

jest.mock('@/lib/config/env', () => ({
  env: {
    APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

jest.mock('@/lib/validation/auth', () => ({
  RESERVED_HANDLES: ['admin', 'api', 'dashboard'],
}))

jest.mock('@/lib/utils/default-presence-page', () => ({
  createDefaultPresencePageContent: jest.fn(() => ({ blocks: [] })),
}))

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock
  }
  business: {
    findUnique: jest.Mock
  }
  emailVerificationToken: {
    findFirst: jest.Mock
    deleteMany: jest.Mock
    create: jest.Mock
  }
  passwordResetToken: {
    findFirst: jest.Mock
    deleteMany: jest.Mock
    create: jest.Mock
  }
  $transaction: jest.Mock
}

const mockedGenerateVerificationToken = generateVerificationToken as jest.Mock
const mockedGeneratePasswordResetToken = generatePasswordResetToken as jest.Mock
const mockedSendVerificationEmail = sendVerificationEmail as jest.Mock
const mockedSendPasswordResetEmail = sendPasswordResetEmail as jest.Mock
const mockedSendPasswordChangedEmail = sendPasswordChangedEmail as jest.Mock
const mockedHashPassword = hashPassword as jest.Mock
const mockedLogSecurityEvent = logSecurityEvent as jest.Mock

describe('public auth services', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    process.env.EMAIL_VERIFICATION_TOKEN_PEPPER = 'test-email-verification-pepper'
    process.env.PASSWORD_RESET_TOKEN_PEPPER = 'test-password-reset-pepper'

    mockedLogSecurityEvent.mockResolvedValue(undefined)
  })

  it('hashEmailVerificationToken returns a non-raw deterministic token hash', () => {
    const hash1 = hashEmailVerificationToken('raw-token')
    const hash2 = hashEmailVerificationToken('raw-token')

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe('raw-token')
    expect(hash1).toHaveLength(64)
  })

  it('resendVerificationEmail stores hashed token and sends raw token only in email URL', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: false,
      businesses: [{ name: 'Test Business' }],
    })

    mockedGenerateVerificationToken.mockReturnValue({
      token: 'raw-verification-token',
      expiresAt: new Date(Date.now() + 60_000),
    })

    mockedPrisma.emailVerificationToken.deleteMany.mockResolvedValue({ count: 1 })
    mockedPrisma.emailVerificationToken.create.mockResolvedValue({})
    mockedSendVerificationEmail.mockResolvedValue(undefined)

    const result = await resendVerificationEmail('User@Example.com', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(true)

    expect(mockedPrisma.emailVerificationToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        token: hashEmailVerificationToken('raw-verification-token'),
        email: 'user@example.com',
        expiresAt: expect.any(Date),
      },
    })

    expect(mockedPrisma.emailVerificationToken.create.mock.calls[0][0].data.token).not.toBe(
      'raw-verification-token'
    )

    expect(mockedSendVerificationEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.stringContaining('token=raw-verification-token'),
      'Test Business'
    )
  })

  it('verifyEmail looks up hashed token with legacy raw-token fallback and atomically consumes it', async () => {
    const expiresAt = new Date(Date.now() + 60_000)

    mockedPrisma.emailVerificationToken.findFirst.mockResolvedValue({
      id: 'verification-token-1',
      userId: 'user-1',
      email: 'user@example.com',
      verifiedAt: null,
      expiresAt,
      user: { id: 'user-1' },
    })

    const tx = {
      emailVerificationToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
    }

    mockedPrisma.$transaction.mockImplementation(async cb => cb(tx))

    const result = await verifyEmail('raw-verification-token', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(true)

    expect(mockedPrisma.emailVerificationToken.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { token: hashEmailVerificationToken('raw-verification-token') },
          { token: 'raw-verification-token' },
        ],
      },
      include: { user: true },
    })

    expect(tx.emailVerificationToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'verification-token-1',
        verifiedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: {
        verifiedAt: expect.any(Date),
        token: hashEmailVerificationToken('raw-verification-token'),
      },
    })
  })

  it('hashPasswordResetToken returns a non-raw deterministic token hash', () => {
    const hash1 = hashPasswordResetToken('raw-reset-token')
    const hash2 = hashPasswordResetToken('raw-reset-token')

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe('raw-reset-token')
    expect(hash1).toHaveLength(64)
  })

  it('requestPasswordReset stores hashed token and emails raw token URL', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      businesses: [{ name: 'Test Business' }],
    })

    mockedGeneratePasswordResetToken.mockReturnValue({
      token: 'raw-reset-token',
      expiresAt: new Date(Date.now() + 60_000),
    })

    mockedPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 })
    mockedPrisma.passwordResetToken.create.mockResolvedValue({})
    mockedSendPasswordResetEmail.mockResolvedValue(undefined)

    const result = await requestPasswordReset('User@Example.com', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(true)

    expect(mockedPrisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        token: hashPasswordResetToken('raw-reset-token'),
        expiresAt: expect.any(Date),
      },
    })

    expect(mockedPrisma.passwordResetToken.create.mock.calls[0][0].data.token).not.toBe(
      'raw-reset-token'
    )

    expect(mockedSendPasswordResetEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.stringContaining('token=raw-reset-token'),
      'Test Business'
    )
  })

  it('requestPasswordReset returns generic success for nonexistent users and sends no email', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null)

    const result = await requestPasswordReset('missing@example.com', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(true)
    expect(result.message).toContain('If an account with this email exists')
    expect(mockedSendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('completePasswordReset atomically consumes token, updates password, and deletes sessions', async () => {
    mockedPrisma.passwordResetToken.findFirst.mockResolvedValue({
      id: 'reset-token-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        email: 'user@example.com',
        businesses: [{ name: 'Test Business' }],
      },
    })

    mockedHashPassword.mockResolvedValue('new-password-hash')
    mockedSendPasswordChangedEmail.mockResolvedValue(undefined)

    const tx = {
      passwordResetToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
      session: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    }

    mockedPrisma.$transaction.mockImplementation(async cb => cb(tx))

    const result = await completePasswordReset(
      {
        token: 'raw-reset-token',
        newPassword: 'Password123!',
      },
      '127.0.0.1',
      'test-agent'
    )

    expect(result.success).toBe(true)

    expect(mockedPrisma.passwordResetToken.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ token: hashPasswordResetToken('raw-reset-token') }, { token: 'raw-reset-token' }],
      },
      include: {
        user: {
          include: {
            businesses: true,
          },
        },
      },
    })

    expect(tx.passwordResetToken.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'reset-token-1',
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: {
        usedAt: expect.any(Date),
        token: hashPasswordResetToken('raw-reset-token'),
      },
    })

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: 'new-password-hash',
        failedLoginAttempts: 0,
        accountLocked: false,
        lastFailedLogin: null,
      },
    })

    expect(tx.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    })
  })

  it('signupUser stores hashed verification token and succeeds even if verification email fails', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null)
    mockedPrisma.business.findUnique.mockResolvedValue(null)
    mockedHashPassword.mockResolvedValue('password-hash')

    mockedGenerateVerificationToken.mockReturnValue({
      token: 'raw-verification-token',
      expiresAt: new Date(Date.now() + 60_000),
    })

    const tx = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
        }),
      },
      emailVerificationToken: {
        create: jest.fn().mockResolvedValue({}),
      },
      business: {
        create: jest.fn().mockResolvedValue({
          id: 'business-1',
          slug: 'test-business',
        }),
      },
      page: {
        create: jest.fn().mockResolvedValue({}),
      },
    }

    mockedPrisma.$transaction.mockImplementation(async cb => cb(tx))
    mockedSendVerificationEmail.mockRejectedValue(new Error('Email provider down'))

    const result = await signupUser(
      {
        email: 'User@Example.com',
        password: 'Password123!',
        businessName: 'Test Business',
        businessCategory: 'Beauty',
        handle: 'Test-Business',
      } as any,
      '127.0.0.1',
      'test-agent'
    )

    expect(result.success).toBe(true)
    expect(result.requiresVerification).toBe(true)

    expect(tx.emailVerificationToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        token: hashEmailVerificationToken('raw-verification-token'),
        email: 'user@example.com',
        expiresAt: expect.any(Date),
      },
    })

    expect(tx.emailVerificationToken.create.mock.calls[0][0].data.token).not.toBe(
      'raw-verification-token'
    )
  })
})
