import {
  verifyMfaChallenge,
  isDeviceTrusted,
  resendMfaChallenge,
} from '@/lib/services/mfa-challenge'
import { prisma } from '@/lib/prisma'
import { verifyMfaToken, verifyBackupCode } from '@/lib/services/mfa'
import { createSession } from '@/lib/services/session'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    mfaTempToken: {
      get findUnique() {
        return jest.fn()
      },
      get update() {
        return jest.fn()
      },
      get create() {
        return jest.fn()
      },
    },
    user: {
      get update() {
        return jest.fn()
      },
    },
    trustedDevice: {
      get create() {
        return jest.fn()
      },
      get findFirst() {
        return jest.fn()
      },
      get update() {
        return jest.fn()
      },
    },
    $transaction: jest.fn(callback => callback(prisma)),
  },
}))

jest.mock('@/lib/services/mfa')
jest.mock('@/lib/services/security-logging')

const mockMfaTempToken = {
  id: 'temp-123',
  userId: 'user-123',
  token: 'temp-token-123',
  expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  usedAt: null,
  createdAt: new Date(),
  user: {
    id: 'user-123',
    email: 'test@example.com',
    emailVerified: true,
    mfaEnabled: true,
  },
}

describe('MFA Challenge Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyMfaChallenge', () => {
    it('should successfully verify TOTP code', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue(mockMfaTempToken)
      ;(verifyMfaToken as jest.Mock).mockResolvedValue({ success: true })
      ;(createSession as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      })
      ;(prisma.mfaTempToken.update as jest.Mock).mockResolvedValue(mockMfaTempToken)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      const result = await verifyMfaChallenge({
        tempToken: 'temp-token-123',
        code: '123456',
        isBackupCode: false,
        trustDevice: false,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.success).toBe(true)
      expect(result.data?.accessToken).toBe('access-token')
      expect(verifyMfaToken).toHaveBeenCalledWith('user-123', '123456', '127.0.0.1', 'Mozilla/5.0')
    })

    it('should successfully verify backup code', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue(mockMfaTempToken)
      ;(verifyBackupCode as jest.Mock).mockResolvedValue({ success: true })
      ;(createSession as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      })
      ;(prisma.mfaTempToken.update as jest.Mock).mockResolvedValue(mockMfaTempToken)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      const result = await verifyMfaChallenge({
        tempToken: 'temp-token-123',
        code: 'ABCD-1234-EFGH-5678',
        isBackupCode: true,
        trustDevice: false,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.success).toBe(true)
      expect(verifyBackupCode).toHaveBeenCalled()
    })

    it('should create trusted device when requested', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue(mockMfaTempToken)
      ;(verifyMfaToken as jest.Mock).mockResolvedValue({ success: true })
      ;(createSession as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      })
      ;(prisma.trustedDevice.create as jest.Mock).mockResolvedValue({})
      ;(prisma.mfaTempToken.update as jest.Mock).mockResolvedValue(mockMfaTempToken)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      const result = await verifyMfaChallenge({
        tempToken: 'temp-token-123',
        code: '123456',
        isBackupCode: false,
        trustDevice: true,
        deviceInfo: { browser: 'Chrome', os: 'Windows' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.success).toBe(true)
      expect(prisma.trustedDevice.create).toHaveBeenCalled()
    })

    it('should return error for invalid temp token', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await verifyMfaChallenge({
        tempToken: 'invalid-token',
        code: '123456',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_TEMP_TOKEN')
    })

    it('should return error for expired temp token', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue({
        ...mockMfaTempToken,
        expiresAt: new Date(Date.now() - 1000),
      })

      const result = await verifyMfaChallenge({
        tempToken: 'temp-token-123',
        code: '123456',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('TOKEN_EXPIRED')
    })

    it('should return error for already used temp token', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue({
        ...mockMfaTempToken,
        usedAt: new Date(),
      })

      const result = await verifyMfaChallenge({
        tempToken: 'temp-token-123',
        code: '123456',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('TOKEN_ALREADY_USED')
    })

    it('should track failed attempts', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue(mockMfaTempToken)
      ;(verifyMfaToken as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Invalid token',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      const result = await verifyMfaChallenge({
        tempToken: 'temp-token-123',
        code: '000000',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.success).toBe(false)
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: { increment: 1 },
          }),
        })
      )
    })
  })

  describe('isDeviceTrusted', () => {
    it('should return true for trusted device', async () => {
      ;(prisma.trustedDevice.findFirst as jest.Mock).mockResolvedValue({
        id: 'device-123',
        userId: 'user-123',
      })
      ;(prisma.trustedDevice.update as jest.Mock).mockResolvedValue({})

      const result = await isDeviceTrusted('user-123', { browser: 'Chrome' }, 'Mozilla/5.0')

      expect(result).toBe(true)
      expect(prisma.trustedDevice.update).toHaveBeenCalled()
    })

    it('should return false for untrusted device', async () => {
      ;(prisma.trustedDevice.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await isDeviceTrusted('user-123', { browser: 'Chrome' }, 'Mozilla/5.0')

      expect(result).toBe(false)
    })
  })

  describe('resendMfaChallenge', () => {
    it('should generate new temp token', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue(mockMfaTempToken)
      ;(prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}])

      const result = await resendMfaChallenge('temp-token-123', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(true)
      expect(result.tempToken).toBeDefined()
    })

    it('should return error for expired token', async () => {
      ;(prisma.mfaTempToken.findUnique as jest.Mock).mockResolvedValue({
        ...mockMfaTempToken,
        expiresAt: new Date(Date.now() - 1000),
      })

      const result = await resendMfaChallenge('temp-token-123', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
    })
  })
})
