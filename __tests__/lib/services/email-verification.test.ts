// Mock env FIRST
jest.mock('@/lib/config/env', () => ({
  env: {
    APP_URL: 'https://onprez.com',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
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
    emailVerificationToken: {
      get findUnique() {
        return jest.fn()
      },
      get update() {
        return jest.fn()
      },
      get create() {
        return jest.fn()
      },
      get deleteMany() {
        return jest.fn()
      },
    },
    get $transaction() {
      return jest.fn()
    },
  },
}))

// Mock email service with factory function
jest.mock('@/lib/services/email', () => ({
  get sendVerificationEmail() {
    return jest.fn()
  },
}))

// Mock security logging with factory function
jest.mock('@/lib/services/security-logging', () => ({
  get logSecurityEvent() {
    return jest.fn()
  },
}))

// NOW import after all mocks
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { verifyEmail, resendVerificationEmail } from '@/lib/services/email-verification'

describe('Email Verification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockToken = {
        id: 'token-123',
        userId: 'user-123',
        token: 'valid-token',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        verifiedAt: null,
        createdAt: new Date(),
        user: { id: 'user-123', email: 'test@example.com' },
      }

      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(mockToken)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          emailVerificationToken: {
            update: jest.fn().mockResolvedValue({}),
          },
          user: {
            update: jest.fn().mockResolvedValue({}),
          },
        }
        return callback(mockTx)
      })
      ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

      const result = await verifyEmail('valid-token', '127.0.0.1', 'test-agent')

      expect(result.success).toBe(true)
      expect(result.email).toBe('test@example.com')
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'email_verified',
        })
      )
    })

    it('should fail for invalid token', async () => {
      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await verifyEmail('invalid-token', '127.0.0.1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid or expired')
    })

    it('should fail for expired token', async () => {
      const mockToken = {
        id: 'token-123',
        userId: 'user-123',
        token: 'expired-token',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
        verifiedAt: null,
        createdAt: new Date(),
        user: { id: 'user-123', email: 'test@example.com' },
      }

      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(mockToken)

      const result = await verifyEmail('expired-token', '127.0.0.1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('expired')
    })

    it('should fail for already verified token', async () => {
      const mockToken = {
        id: 'token-123',
        userId: 'user-123',
        token: 'verified-token',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 86400000),
        verifiedAt: new Date(),
        createdAt: new Date(),
        user: { id: 'user-123', email: 'test@example.com' },
      }

      ;(prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(mockToken)

      const result = await verifyEmail('verified-token', '127.0.0.1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('already been verified')
    })
  })

  describe('resendVerificationEmail', () => {
    it('should resend verification email successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
        businesses: [{ name: 'Test Business' }],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      ;(sendVerificationEmail as jest.Mock).mockResolvedValue({ success: true })
      ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

      const result = await resendVerificationEmail('test@example.com', '127.0.0.1')

      expect(result.success).toBe(true)
      expect(sendVerificationEmail).toHaveBeenCalled()
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'verification_email_resent',
        })
      )
    })

    it('should not reveal if user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await resendVerificationEmail('nonexistent@example.com', '127.0.0.1')

      expect(result.success).toBe(true)
      expect(result.message).toContain('If an account')
      expect(sendVerificationEmail).not.toHaveBeenCalled()
    })

    it('should fail for already verified email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        businesses: [],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await resendVerificationEmail('test@example.com', '127.0.0.1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('already verified')
    })
  })
})
