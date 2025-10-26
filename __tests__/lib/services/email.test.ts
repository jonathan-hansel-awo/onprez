import {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendNewDeviceLoginEmail,
  sendAccountLockedEmail,
} from '../../../lib/services/email'

// Mock Resend module
const mockSend = jest.fn()

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  }
})

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    process.env.RESEND_API_KEY = 'test-api-key'
    process.env.FROM_EMAIL = 'noreply@onprez.com'
    process.env.FROM_NAME = 'OnPrez'
    process.env.APP_URL = 'https://onprez.vercel.app'
  })

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
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
      mockSend.mockRejectedValue(new Error('Network error'))

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should accept custom from address', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      await sendVerificationEmail('user@example.com', 'https://onprez.com/verify?token=abc123')

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('https://onprez.com/verify?token=abc123')
      expect(callArgs.text).toContain('https://onprez.com/verify?token=abc123')
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      await sendPasswordResetEmail('user@example.com', 'https://onprez.com/reset?token=xyz789')

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('https://onprez.com/reset?token=xyz789')
      expect(callArgs.text).toContain('https://onprez.com/reset?token=xyz789')
    })
  })

  describe('sendPasswordChangedEmail', () => {
    it('should send password changed notification', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      const timestamp = new Date('2024-01-01T12:00:00Z')
      await sendPasswordChangedEmail('user@example.com', 'John', '192.168.1.1', timestamp)

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('192.168.1.1')
    })
  })

  describe('sendNewDeviceLoginEmail', () => {
    it('should send new device login alert', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

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
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      const unlockTime = new Date('2024-01-01T13:00:00Z')
      await sendAccountLockedEmail('user@example.com', 'John', 'security', unlockTime)

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain(unlockTime.toLocaleString())
    })

    it('should show support message when no unlock time', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      await sendAccountLockedEmail('user@example.com', 'John', 'security')

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('support@onprez.com')
    })
  })
})
