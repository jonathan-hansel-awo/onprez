// Mock env FIRST
jest.mock('@/lib/config/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    APP_URL: 'https://onprez.vercel.app',
    NODE_ENV: 'test',
  },
}))

// Mock Prisma with factory function
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock password
jest.mock('@/lib/auth/password', () => ({
  hashPassword: jest.fn(),
}))

// Mock email
jest.mock('@/lib/services/email', () => ({
  sendVerificationEmail: jest.fn(),
}))

// Mock security logging
jest.mock('@/lib/services/security-logging', () => ({
  logSecurityEvent: jest.fn(),
}))

// Import AFTER mocks
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { sendVerificationEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { signupUser, checkHandleAvailability } from '@/lib/services/signup'

describe('Signup Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signupUser', () => {
    const signupData = {
      email: 'test@example.com',
      password: 'Test123!',
      handle: 'test-user',
      businessName: 'Test Business',
      businessCategory: 'OTHER' as const,
    }

    it('should create user and business successfully', async () => {
      // Setup mocks
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValueOnce(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
      ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-123',
              email: 'test@example.com',
              emailVerified: false,
            }),
          },
          emailVerificationToken: {
            create: jest.fn().mockResolvedValue({
              id: 'token-123',
              token: 'verification-token',
              expiresAt: new Date(),
            }),
          },
          business: {
            create: jest.fn().mockResolvedValue({
              id: 'business-123',
              ownerId: 'user-123',
              slug: 'test-user',
              name: 'Test Business',
            }),
          },
        }

        return callback(mockTx)
      })
      ;(sendVerificationEmail as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'email-123',
      })
      ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

      const result = await signupUser(signupData, '192.168.1.1', 'Mozilla/5.0')

      expect(result.success).toBe(true)
      expect(result.userId).toBe('user-123')
      expect(result.businessId).toBe('business-123')
      expect(result.requiresVerification).toBe(true)
      expect(sendVerificationEmail).toHaveBeenCalled()
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_signup',
          severity: 'info',
        })
      )
    })

    it('should fail if email already exists', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      })

      const result = await signupUser(signupData, '192.168.1.1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('already registered')
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should fail if handle already taken', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-business',
        slug: 'test-user',
      })

      const result = await signupUser(signupData, '192.168.1.1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('already taken')
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should log security event on failure', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
      ;(prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await signupUser(signupData, '192.168.1.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_signup_failed',
          severity: 'warning',
        })
      )
    })
  })

  describe('checkHandleAvailability', () => {
    it('should return available for new handle', async () => {
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await checkHandleAvailability('new-handle')

      expect(result.available).toBe(true)
      expect(result.reason).toBeUndefined()
      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { slug: 'new-handle' },
      })
    })

    it('should return unavailable for existing handle', async () => {
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing',
        slug: 'taken-handle',
      })

      const result = await checkHandleAvailability('taken-handle')

      expect(result.available).toBe(false)
      expect(result.reason).toContain('already taken')
    })

    it('should normalize handle before checking', async () => {
      ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(null)

      await checkHandleAvailability('Test-Handle')

      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-handle' },
      })
    })
  })
})
