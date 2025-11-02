import {
  setupMfa,
  verifyMfaSetup,
  verifyMfaToken,
  verifyBackupCode,
  getMfaStatus,
  regenerateBackupCodes,
} from '@/lib/services/mfa'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'
import * as speakeasy from 'speakeasy'

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
    mfaSecret: {
      get create() {
        return jest.fn()
      },
      get update() {
        return jest.fn()
      },
      get delete() {
        return jest.fn()
      },
    },
    mfaBackupCode: {
      get createMany() {
        return jest.fn()
      },
      get deleteMany() {
        return jest.fn()
      },
      get update() {
        return jest.fn()
      },
    },
    $transaction: jest.fn(callback => callback(prisma)),
  },
}))

jest.mock('@/lib/services/security-logging')

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    base32: 'JBSWY3DPEHPK3PXP',
    otpauth_url: 'otpauth://totp/OnPrez?secret=JBSWY3DPEHPK3PXP&issuer=OnPrez',
  })),
  totp: {
    verify: jest.fn(() => true),
  },
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,iVBORw0KGgo=')),
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  mfaEnabled: false,
  mfaSecret: null,
  mfaBackupCodes: [],
}

const mockMfaSecret = {
  id: 'secret-123',
  userId: 'user-123',
  encryptedSecret: 'encrypted-secret',
  iv: 'iv-string',
  verified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('MFA Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('setupMfa', () => {
    it('should successfully setup MFA', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.mfaSecret.create as jest.Mock).mockResolvedValue(mockMfaSecret)
      ;(prisma.mfaBackupCode.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.mfaBackupCode.createMany as jest.Mock).mockResolvedValue({ count: 8 })

      const result = await setupMfa('user-123', 'test@example.com', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.secret).toBeDefined()
      expect(result.data?.qrCodeUrl).toBeDefined()
      expect(result.data?.backupCodes).toHaveLength(8)
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'mfa_setup_initiated',
        })
      )
    })

    it('should return error if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await setupMfa('user-123', 'test@example.com', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(result.error).toBe('USER_NOT_FOUND')
    })

    it('should return error if MFA already enabled', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: mockMfaSecret,
      })

      const result = await setupMfa('user-123', 'test@example.com', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(result.error).toBe('MFA_ALREADY_ENABLED')
    })
  })

  describe('verifyMfaSetup', () => {
    it('should successfully verify and enable MFA', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaSecret: mockMfaSecret,
      })
      ;(prisma.$transaction as jest.Mock).mockResolvedValue([
        { ...mockMfaSecret, verified: true },
        { ...mockUser, mfaEnabled: true },
      ])
      speakeasy.totp.verify.mockReturnValue(true)
      speakeasy.totp.verify.mockReturnValue(true)

      const result = await verifyMfaSetup('user-123', '123456', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(true)
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'mfa_enabled',
        })
      )
    })

    it('should return error for invalid token', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaSecret: mockMfaSecret,
      })

      speakeasy.totp.verify.mockReturnValue(false)

      const result = await verifyMfaSetup('user-123', '000000', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_TOKEN')
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'mfa_verification_failed',
        })
      )
    })

    it('should return error if MFA not setup', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await verifyMfaSetup('user-123', '123456', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(result.error).toBe('MFA_NOT_SETUP')
    })
  })

  describe('verifyMfaToken', () => {
    it('should successfully verify MFA token', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: { ...mockMfaSecret, verified: true },
      })

      speakeasy.totp.verify.mockReturnValue(true)

      const result = await verifyMfaToken('user-123', '123456', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(true)
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'mfa_login_success',
        })
      )
    })

    it('should return error for invalid token', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: { ...mockMfaSecret, verified: true },
      })

      speakeasy.totp.verify.mockReturnValue(false)

      const result = await verifyMfaToken('user-123', '000000', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_TOKEN')
    })
  })

  describe('verifyBackupCode', () => {
    it('should successfully verify unused backup code', async () => {
      const mockBackupCode = {
        id: 'code-123',
        userId: 'user-123',
        hashedCode: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', // hash of 'ABCD-1234-EFGH-5678'
        usedAt: null,
        createdAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
        mfaBackupCodes: [mockBackupCode],
      })
      ;(prisma.mfaBackupCode.update as jest.Mock).mockResolvedValue({
        ...mockBackupCode,
        usedAt: new Date(),
      })

      const result = await verifyBackupCode(
        'user-123',
        'ABCD-1234-EFGH-5678',
        '127.0.0.1',
        'Mozilla/5.0'
      )

      expect(result.success).toBe(true)
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'mfa_backup_code_used',
        })
      )
    })

    it('should return error for invalid backup code', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
        mfaBackupCodes: [],
      })

      const result = await verifyBackupCode('user-123', 'INVALID-CODE', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_BACKUP_CODE')
    })
  })

  describe('getMfaStatus', () => {
    it('should return MFA status', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
        mfaBackupCodes: [{}, {}, {}],
      })

      const result = await getMfaStatus('user-123')

      expect(result.success).toBe(true)
      expect(result.mfaEnabled).toBe(true)
      expect(result.hasBackupCodes).toBe(true)
      expect(result.backupCodesCount).toBe(3)
    })

    it('should handle user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getMfaStatus('user-123')

      expect(result.success).toBe(false)
      expect(result.mfaEnabled).toBe(false)
    })
  })

  describe('regenerateBackupCodes', () => {
    it('should successfully regenerate backup codes', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      })
      ;(prisma.mfaBackupCode.deleteMany as jest.Mock).mockResolvedValue({ count: 8 })
      ;(prisma.mfaBackupCode.createMany as jest.Mock).mockResolvedValue({ count: 8 })

      const result = await regenerateBackupCodes('user-123', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(true)
      expect(result.data?.backupCodes).toHaveLength(8)
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'mfa_backup_codes_regenerated',
        })
      )
    })

    it('should return error if MFA not enabled', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await regenerateBackupCodes('user-123', '127.0.0.1', 'Mozilla/5.0')

      expect(result.success).toBe(false)
      expect(result.error).toBe('MFA_NOT_ENABLED')
    })
  })
})
