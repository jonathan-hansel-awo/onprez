// Mock dependencies
jest.mock('@/lib/config/env', () => ({
  env: {
    APP_URL: 'http://localhost:3000',
    SUPPORT_EMAIL: 'support@onprez.com',
  },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      get findUnique() {
        return jest.fn()
      },
      get update() {
        return jest.fn()
      },
    },
    user: {
      get update() {
        return jest.fn()
      },
    },
    session: {
      get deleteMany() {
        return jest.fn()
      },
    },
    get $transaction() {
      return jest.fn()
    },
  },
}))

jest.mock('@/lib/auth/password', () => ({
  get hashPassword() {
    return jest.fn()
  },
}))

jest.mock('@/lib/services/email', () => ({
  get sendPasswordChangedEmail() {
    return jest.fn()
  },
}))

jest.mock('@/lib/services/security-logging', () => ({
  get logSecurityEvent() {
    return jest.fn()
  },
}))

import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { sendPasswordChangedEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { completePasswordReset, validatePasswordStrength } from '@/lib/services/password-reset'

describe('Complete Password Reset', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reset password successfully', async () => {
    const mockToken = {
      id: 'token-123',
      userId: 'user-123',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        businesses: [{ name: 'Test Business' }],
      },
    }

    ;(prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockToken)
    ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
    ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => {
      const mockTx = {
        user: { update: jest.fn().mockResolvedValue({}) },
        passwordResetToken: { update: jest.fn().mockResolvedValue({}) },
        session: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
      }
      return callback(mockTx)
    })
    ;(sendPasswordChangedEmail as jest.Mock).mockResolvedValue({ success: true })
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await completePasswordReset(
      { token: 'valid-token', newPassword: 'NewPass123!' },
      '127.0.0.1'
    )

    expect(result.success).toBe(true)
    expect(hashPassword).toHaveBeenCalledWith('NewPass123!')
    expect(sendPasswordChangedEmail).toHaveBeenCalled()
  })

  it('should fail for invalid token', async () => {
    ;(prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await completePasswordReset(
      { token: 'invalid-token', newPassword: 'NewPass123!' },
      '127.0.0.1'
    )

    expect(result.success).toBe(false)
    expect(result.message).toContain('Invalid or expired')
  })

  it('should fail for already used token', async () => {
    const mockToken = {
      id: 'token-123',
      userId: 'user-123',
      token: 'used-token',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: new Date(),
      user: { id: 'user-123', email: 'test@example.com', businesses: [] },
    }

    ;(prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockToken)

    const result = await completePasswordReset(
      { token: 'used-token', newPassword: 'NewPass123!' },
      '127.0.0.1'
    )

    expect(result.success).toBe(false)
    expect(result.message).toContain('already been used')
  })

  it('should fail for expired token', async () => {
    const mockToken = {
      id: 'token-123',
      userId: 'user-123',
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 3600000),
      usedAt: null,
      user: { id: 'user-123', email: 'test@example.com', businesses: [] },
    }

    ;(prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockToken)

    const result = await completePasswordReset(
      { token: 'expired-token', newPassword: 'NewPass123!' },
      '127.0.0.1'
    )

    expect(result.success).toBe(false)
    expect(result.message).toContain('expired')
  })

  it('should fail for weak password', async () => {
    const mockToken = {
      id: 'token-123',
      userId: 'user-123',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      user: { id: 'user-123', email: 'test@example.com', businesses: [] },
    }

    ;(prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockToken)

    const result = await completePasswordReset(
      { token: 'valid-token', newPassword: 'weak' },
      '127.0.0.1'
    )

    expect(result.success).toBe(false)
    expect(result.message).toContain('at least 8 characters')
  })
})

describe('Password Strength Validation', () => {
  it('should validate strong password', () => {
    const result = validatePasswordStrength('StrongPass123!')
    expect(result.isValid).toBe(true)
  })

  it('should reject short password', () => {
    const result = validatePasswordStrength('Short1!')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('8 characters')
  })

  it('should reject password without uppercase', () => {
    const result = validatePasswordStrength('password123!')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('uppercase')
  })

  it('should reject password without lowercase', () => {
    const result = validatePasswordStrength('PASSWORD123!')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('lowercase')
  })

  it('should reject password without number', () => {
    const result = validatePasswordStrength('PasswordTest!')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('number')
  })

  it('should reject password without special character', () => {
    const result = validatePasswordStrength('Password123')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('special character')
  })
})
