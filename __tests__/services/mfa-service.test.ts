/**
 * @jest-environment node
 */

import { verifyBackupCode, getMfaStatus, regenerateBackupCodes } from '@/lib/services/mfa'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    mfaBackupCode: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/services/security-logging', () => ({
  logSecurityEvent: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock
  }
  mfaBackupCode: {
    findFirst: jest.Mock
    updateMany: jest.Mock
    count: jest.Mock
    deleteMany: jest.Mock
    createMany: jest.Mock
  }
  $transaction: jest.Mock
}

const mockedLogSecurityEvent = logSecurityEvent as jest.Mock

describe('MFA service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.MFA_BACKUP_CODE_PEPPER = 'test-backup-code-pepper'
  })

  it('verifyBackupCode rejects when MFA is not enabled', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      mfaEnabled: false,
    })

    const result = await verifyBackupCode('user-1', 'ABCD-1234', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(false)
    expect(result.error).toBe('MFA_NOT_ENABLED')
    expect(mockedPrisma.mfaBackupCode.findFirst).not.toHaveBeenCalled()
    expect(mockedPrisma.mfaBackupCode.updateMany).not.toHaveBeenCalled()
  })

  it('verifyBackupCode searches for unused HMAC or legacy backup-code hash', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      mfaEnabled: true,
    })

    mockedPrisma.mfaBackupCode.findFirst.mockResolvedValue({
      id: 'code-1',
    })

    mockedPrisma.mfaBackupCode.updateMany.mockResolvedValue({
      count: 1,
    })

    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const result = await verifyBackupCode('user-1', 'ABCD-1234', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(true)

    expect(mockedPrisma.mfaBackupCode.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        usedAt: null,
        OR: [{ hashedCode: expect.any(String) }, { hashedCode: expect.any(String) }],
      },
      select: {
        id: true,
      },
    })

    expect(mockedPrisma.mfaBackupCode.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'code-1',
        userId: 'user-1',
        usedAt: null,
      },
      data: {
        usedAt: expect.any(Date),
      },
    })
  })

  it('verifyBackupCode prevents backup-code reuse races', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      mfaEnabled: true,
    })

    mockedPrisma.mfaBackupCode.findFirst.mockResolvedValue({
      id: 'code-1',
    })

    mockedPrisma.mfaBackupCode.updateMany.mockResolvedValue({
      count: 0,
    })

    const result = await verifyBackupCode('user-1', 'ABCD-1234', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(false)
    expect(result.error).toBe('INVALID_BACKUP_CODE')
  })

  it('verifyBackupCode logs failed backup-code attempts', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      mfaEnabled: true,
    })

    mockedPrisma.mfaBackupCode.findFirst.mockResolvedValue(null)
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const result = await verifyBackupCode('user-1', 'BAD-CODE', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(false)
    expect(result.error).toBe('INVALID_BACKUP_CODE')

    expect(mockedLogSecurityEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'mfa_backup_code_failed',
      details: {
        reason: 'Invalid or used backup code',
      },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      severity: 'warning',
    })
  })

  it('getMfaStatus counts unused backup codes without loading code rows', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      mfaEnabled: true,
    })

    mockedPrisma.mfaBackupCode.count.mockResolvedValue(5)

    const result = await getMfaStatus('user-1')

    expect(result).toEqual({
      success: true,
      mfaEnabled: true,
      hasBackupCodes: true,
      backupCodesCount: 5,
    })

    expect(mockedPrisma.mfaBackupCode.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        usedAt: null,
      },
    })
  })

  it('regenerateBackupCodes stores hashed codes, not returned raw codes', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      mfaEnabled: true,
    })

    mockedPrisma.mfaBackupCode.deleteMany.mockReturnValue('delete-operation')
    mockedPrisma.mfaBackupCode.createMany.mockReturnValue('create-operation')
    mockedPrisma.$transaction.mockResolvedValue([])
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const result = await regenerateBackupCodes('user-1', '127.0.0.1', 'test-agent')

    expect(result.success).toBe(true)
    expect(result.data?.backupCodes).toHaveLength(8)

    expect(mockedPrisma.mfaBackupCode.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-1',
          hashedCode: expect.any(String),
        }),
      ]),
    })

    const createCall = mockedPrisma.mfaBackupCode.createMany.mock.calls[0][0]
    const storedHashes = createCall.data.map((entry: { hashedCode: string }) => entry.hashedCode)

    for (const rawCode of result.data?.backupCodes || []) {
      expect(storedHashes).not.toContain(rawCode)
    }

    expect(mockedPrisma.$transaction).toHaveBeenCalledWith(['delete-operation', 'create-operation'])
  })
})
