// Mock the env module
jest.mock('@/lib/config/env', () => ({
  env: {
    RESEND_API_KEY: 'test-api-key',
    FROM_EMAIL: 'noreply@onprez.com',
    FROM_NAME: 'OnPrez',
    APP_URL: 'https://onprez.com',
    NODE_ENV: 'test',
  },
  isProduction: false,
  isDevelopment: false,
  isTest: true,
}))

// Declare mockSend BEFORE the Resend mock
const mockSend = jest.fn()

// Mock Resend module - Fixed to return proper structure
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  }
})

// Now import the functions to test
import {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendNewDeviceLoginEmail,
  sendAccountLockedEmail,
} from '@/lib/services/email'

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset the Resend instance
    jest.resetModules()

    // Set default successful response
    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    })
  })

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('email-123')
      expect(mockSend).toHaveBeenCalledWith({
        from: 'OnPrez <noreply@onprez.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: undefined,
        replyTo: undefined,
      })
    })

    it('should handle email send error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid email address' },
      })

      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email address')
    })

    it('should handle exception', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network error'))

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should accept custom from address', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        from: 'custom@example.com',
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      )
    })

    it('should support multiple recipients', async () => {
      await sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com'],
        })
      )
    })
  })

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const result = await sendVerificationEmail(
        'user@example.com',
        'https://onprez.com/verify?token=abc123',
        'John Doe'
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Verify your email address - OnPrez',
        })
      )
    })

    it('should include verification URL in email', async () => {
      await sendVerificationEmail('user@example.com', 'https://onprez.com/verify?token=abc123')

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('https://onprez.com/verify?token=abc123')
      expect(callArgs.text).toContain('https://onprez.com/verify?token=abc123')
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const result = await sendPasswordResetEmail(
        'user@example.com',
        'https://onprez.com/reset?token=xyz789',
        'Jane Smith'
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Reset your password - OnPrez',
        })
      )
    })

    it('should include reset URL in email', async () => {
      await sendPasswordResetEmail('user@example.com', 'https://onprez.com/reset?token=xyz789')

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('https://onprez.com/reset?token=xyz789')
      expect(callArgs.text).toContain('https://onprez.com/reset?token=xyz789')
    })
  })

  describe('sendPasswordChangedEmail', () => {
    it('should send password changed notification', async () => {
      const timestamp = new Date()
      const result = await sendPasswordChangedEmail(
        'user@example.com',
        'John Doe',
        '192.168.1.1',
        timestamp
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Your password has been changed - OnPrez',
        })
      )
    })

    it('should include IP and timestamp when provided', async () => {
      const timestamp = new Date('2024-01-01T12:00:00Z')
      await sendPasswordChangedEmail('user@example.com', 'John', '192.168.1.1', timestamp)

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('192.168.1.1')
    })
  })

  describe('sendNewDeviceLoginEmail', () => {
    it('should send new device login alert', async () => {
      const timestamp = new Date()
      const result = await sendNewDeviceLoginEmail(
        'user@example.com',
        'John Doe',
        'Chrome on Windows',
        '192.168.1.1',
        'London, UK',
        timestamp
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'New device login detected - OnPrez',
        })
      )
    })

    it('should include device details in email', async () => {
      await sendNewDeviceLoginEmail(
        'user@example.com',
        'John',
        'Chrome on Windows',
        '192.168.1.1',
        'London, UK'
      )

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('Chrome on Windows')
      expect(callArgs.html).toContain('192.168.1.1')
      expect(callArgs.html).toContain('London, UK')
    })
  })

  describe('sendAccountLockedEmail', () => {
    it('should send account locked notification', async () => {
      const unlockTime = new Date(Date.now() + 30 * 60 * 1000)
      const result = await sendAccountLockedEmail(
        'user@example.com',
        'John Doe',
        'multiple failed login attempts',
        unlockTime
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Your account has been locked - OnPrez',
        })
      )
    })

    it('should include unlock time when provided', async () => {
      const unlockTime = new Date('2024-01-01T13:00:00Z')
      await sendAccountLockedEmail('user@example.com', 'John', 'security', unlockTime)

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain(unlockTime.toLocaleString())
    })

    it('should show support message when no unlock time', async () => {
      await sendAccountLockedEmail('user@example.com', 'John', 'security')

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('support@onprez.com')
    })
  })
})
