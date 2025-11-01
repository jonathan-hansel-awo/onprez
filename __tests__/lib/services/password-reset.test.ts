// Mock env
jest.mock('@/lib/config/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
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
    },
    passwordResetToken: {
      get deleteMany() {
        return jest.fn()
      },
      get create() {
        return jest.fn()
      },
    },
  },
}))

// Mock email service
jest.mock('@/lib/services/email', () => ({
  get sendPasswordResetEmail() {
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
import { sendPasswordResetEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { requestPasswordReset } from '@/lib/services/password-reset'

describe('Password Reset Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send password reset email for existing user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      businesses: [{ name: 'Test Business' }],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({})
    ;(sendPasswordResetEmail as jest.Mock).mockResolvedValue({ success: true })
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await requestPasswordReset('test@example.com', '127.0.0.1')

    expect(result.success).toBe(true)
    expect(sendPasswordResetEmail).toHaveBeenCalled()
    expect(logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'password_reset_requested',
      })
    )
  })

  it('should not reveal if user does not exist', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await requestPasswordReset('nonexistent@example.com', '127.0.0.1')

    expect(result.success).toBe(true)
    expect(result.message).toContain('If an account')
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
    expect(logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'password_reset_requested_nonexistent',
      })
    )
  })

  it('should delete old unused reset tokens', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      businesses: [],
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 2 })
    ;(prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({})
    ;(sendPasswordResetEmail as jest.Mock).mockResolvedValue({ success: true })
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    await requestPasswordReset('test@example.com', '127.0.0.1')

    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        usedAt: null,
      },
    })
  })

  it('should handle errors gracefully', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
    ;(logSecurityEvent as jest.Mock).mockResolvedValue(undefined)

    const result = await requestPasswordReset('test@example.com', '127.0.0.1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Failed to process')
  })
})
