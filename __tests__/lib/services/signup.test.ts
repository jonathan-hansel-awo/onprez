// Mock functions - declare but don't initialize yet
let mockUserFindUnique: jest.Mock
let mockBusinessFindUnique: jest.Mock
let mockTransaction: jest.Mock
let mockHashPassword: jest.Mock
let mockSendVerificationEmail: jest.Mock
let mockLogSecurityEvent: jest.Mock

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      get findUnique() {
        return mockUserFindUnique
      },
    },
    business: {
      get findUnique() {
        return mockBusinessFindUnique
      },
    },
    get $transaction() {
      return mockTransaction
    },
  },
}))

// Mock password
jest.mock('@/lib/auth/password', () => ({
  get hashPassword() {
    return mockHashPassword
  },
}))

// Mock email
jest.mock('@/lib/services/email', () => ({
  get sendVerificationEmail() {
    return mockSendVerificationEmail
  },
}))

// Mock security logging
jest.mock('@/lib/services/security-logging', () => ({
  get logSecurityEvent() {
    return mockLogSecurityEvent
  },
}))

// Mock env
jest.mock('@/lib/config/env', () => ({
  env: {
    APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

// NOW import the service
import { signupUser, checkHandleAvailability } from '@/lib/services/signup'

describe('Signup Service', () => {
  beforeEach(() => {
    // Initialize mocks in beforeEach
    mockUserFindUnique = jest.fn()
    mockBusinessFindUnique = jest.fn()
    mockTransaction = jest.fn()
    mockHashPassword = jest.fn()
    mockSendVerificationEmail = jest.fn()
    mockLogSecurityEvent = jest.fn()
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
      // Mock no existing user or business
      mockUserFindUnique.mockResolvedValueOnce(null)
      mockBusinessFindUnique.mockResolvedValueOnce(null)

      // Mock password hashing
      mockHashPassword.mockResolvedValue('hashed-password')

      // Mock transaction
      mockTransaction.mockImplementation(async callback => {
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

      // Mock email service
      mockSendVerificationEmail.mockResolvedValue({
        success: true,
        messageId: 'email-123',
      })

      // Mock security logging
      mockLogSecurityEvent.mockResolvedValue(undefined)

      const result = await signupUser(signupData, '192.168.1.1', 'Mozilla/5.0')

      expect(result.success).toBe(true)
      expect(result.userId).toBe('user-123')
      expect(result.businessId).toBe('business-123')
      expect(result.requiresVerification).toBe(true)
      expect(mockSendVerificationEmail).toHaveBeenCalled()
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_signup',
          severity: 'info',
        })
      )
    })

    it('should fail if email already exists', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      })

      const result = await signupUser(signupData, '192.168.1.1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('already registered')
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('should fail if handle already taken', async () => {
      mockUserFindUnique.mockResolvedValue(null)
      mockBusinessFindUnique.mockResolvedValue({
        id: 'existing-business',
        slug: 'test-user',
      })

      const result = await signupUser(signupData, '192.168.1.1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Email address is already registered')
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('should log security event on failure', async () => {
      mockUserFindUnique.mockResolvedValue(null)
      mockBusinessFindUnique.mockResolvedValue(null)
      mockHashPassword.mockResolvedValue('hashed-password')

      // Make transaction fail
      mockTransaction.mockRejectedValue(new Error('Database error'))

      const result = await signupUser(signupData, '192.168.1.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_signup_failed',
          severity: 'warning',
        })
      )
    })
  })

  describe('checkHandleAvailability', () => {
    it('should return available for new handle', async () => {
      mockBusinessFindUnique.mockResolvedValue(null)

      const result = await checkHandleAvailability('new-handle')

      expect(result.available).toBe(true)
      expect(result.reason).toBeUndefined()
      expect(mockBusinessFindUnique).toHaveBeenCalledWith({
        where: { slug: 'new-handle' },
      })
    })

    it('should return unavailable for existing handle', async () => {
      mockBusinessFindUnique.mockResolvedValue({
        id: 'existing',
        slug: 'taken-handle',
      })

      const result = await checkHandleAvailability('taken-handle')

      expect(result.available).toBe(false)
      expect(result.reason).toContain('already taken')
    })

    it('should normalize handle before checking', async () => {
      mockBusinessFindUnique.mockResolvedValue(null)

      await checkHandleAvailability('Test-Handle')

      expect(mockBusinessFindUnique).toHaveBeenCalledWith({
        where: { slug: 'test-handle' },
      })
    })
  })
})
