/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as setupMfaRoute } from '@/app/api/auth/mfa/setup/route'
import { POST as verifySetupRoute } from '@/app/api/auth/mfa/verify-setup/route'
import { POST as backupCodesRoute } from '@/app/api/auth/mfa/backup-codes/route'
import { POST as regenerateCodesRoute } from '@/app/api/auth/mfa/regenerate-codes/route'
import { POST as disableMfaRoute } from '@/app/api/auth/mfa/disable/route'
import { GET as statusRoute } from '@/app/api/auth/mfa/status/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { verifyPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { setupMfa, verifyMfaSetup, regenerateBackupCodes, getMfaStatus } from '@/lib/services/mfa'
import { logSecurityEvent } from '@/lib/services/security-logging'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/password', () => ({
  verifyPassword: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mfaBackupCode: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    mfaSecret: {
      deleteMany: jest.fn(),
    },
    trustedDevice: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/services/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('@/lib/services/mfa', () => ({
  setupMfa: jest.fn(),
  verifyMfaSetup: jest.fn(),
  regenerateBackupCodes: jest.fn(),
  getMfaStatus: jest.fn(),
}))

jest.mock('@/lib/services/security-logging', () => ({
  logSecurityEvent: jest.fn(),
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedVerifyPassword = verifyPassword as jest.Mock
const mockedCheckRateLimit = checkRateLimit as jest.Mock
const mockedSetupMfa = setupMfa as jest.Mock
const mockedVerifyMfaSetup = verifyMfaSetup as jest.Mock
const mockedRegenerateBackupCodes = regenerateBackupCodes as jest.Mock
const mockedGetMfaStatus = getMfaStatus as jest.Mock
const mockedLogSecurityEvent = logSecurityEvent as jest.Mock

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock
    update: jest.Mock
  }
  mfaBackupCode: {
    findMany: jest.Mock
    deleteMany: jest.Mock
  }
  mfaSecret: {
    deleteMany: jest.Mock
  }
  trustedDevice: {
    deleteMany: jest.Mock
  }
  $transaction: jest.Mock
}

function createRequest(
  path: string,
  body?: unknown,
  init?: ConstructorParameters<typeof NextRequest>[1]
) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })
}

function allowRateLimit() {
  mockedCheckRateLimit.mockResolvedValue({
    allowed: true,
    limit: 5,
    remaining: 4,
    resetAt: new Date(Date.now() + 60_000),
  })
}

describe('MFA API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    allowRateLimit()
  })

  it('POST /api/auth/mfa/setup returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await setupMfaRoute(createRequest('/api/auth/mfa/setup'))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedSetupMfa).not.toHaveBeenCalled()
  })

  it('POST /api/auth/mfa/setup uses current user id and email, not client-provided identity', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'real@example.com',
      mfaEnabled: false,
    })

    mockedSetupMfa.mockResolvedValue({
      success: true,
      message: 'MFA setup started',
      data: { qrCode: 'qr', secret: 'temporary-display-secret' },
    })

    const response = await setupMfaRoute(
      createRequest('/api/auth/mfa/setup', {
        userId: 'attacker-user',
        email: 'attacker@example.com',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedSetupMfa).toHaveBeenCalledWith(
      'user-1',
      'real@example.com',
      expect.any(String),
      expect.any(String)
    )
  })

  it('POST /api/auth/mfa/verify-setup verifies setup for current user only', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'real@example.com',
      mfaEnabled: false,
    })

    mockedVerifyMfaSetup.mockResolvedValue({
      success: true,
      message: 'MFA enabled',
    })

    const response = await verifySetupRoute(
      createRequest('/api/auth/mfa/verify-setup', {
        userId: 'attacker-user',
        token: '123456',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedVerifyMfaSetup).toHaveBeenCalledWith(
      'user-1',
      '123456',
      expect.any(String),
      expect.any(String)
    )
  })

  it('POST /api/auth/mfa/backup-codes returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await backupCodesRoute(
      createRequest('/api/auth/mfa/backup-codes', {
        password: 'password',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
  })

  it('POST /api/auth/mfa/backup-codes does not return hashed backup codes', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      mfaEnabled: true,
    })

    mockedPrisma.user.findUnique.mockResolvedValue({
      passwordHash: 'hash',
    })

    mockedVerifyPassword.mockResolvedValue(true)

    mockedPrisma.mfaBackupCode.findMany.mockResolvedValue([
      {
        id: 'code-1',
        usedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])

    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const response = await backupCodesRoute(
      createRequest('/api/auth/mfa/backup-codes', {
        password: 'password',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(JSON.stringify(json)).not.toContain('hashedCode')
    expect(mockedPrisma.mfaBackupCode.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: {
        id: true,
        usedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  })

  it('POST /api/auth/mfa/regenerate-codes requires valid password', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      mfaEnabled: true,
    })

    mockedPrisma.user.findUnique.mockResolvedValue({
      passwordHash: 'hash',
    })

    mockedVerifyPassword.mockResolvedValue(false)

    const response = await regenerateCodesRoute(
      createRequest('/api/auth/mfa/regenerate-codes', {
        password: 'wrong',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedRegenerateBackupCodes).not.toHaveBeenCalled()
  })

  it('POST /api/auth/mfa/disable refuses when MFA is not enabled', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      mfaEnabled: false,
    })

    const response = await disableMfaRoute(
      createRequest('/api/auth/mfa/disable', {
        password: 'password',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(mockedPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('POST /api/auth/mfa/disable deletes only current user MFA data', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      mfaEnabled: true,
    })

    mockedPrisma.user.findUnique.mockResolvedValue({
      passwordHash: 'hash',
    })

    mockedVerifyPassword.mockResolvedValue(true)
    mockedPrisma.$transaction.mockResolvedValue([])
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const response = await disableMfaRoute(
      createRequest('/api/auth/mfa/disable', {
        password: 'password',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedPrisma.mfaSecret.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    })

    expect(mockedPrisma.mfaBackupCode.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    })

    expect(mockedPrisma.trustedDevice.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    })

    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { mfaEnabled: false },
    })
  })

  it('GET /api/auth/mfa/status returns current user MFA status', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })

    mockedGetMfaStatus.mockResolvedValue({
      enabled: true,
      backupCodesRemaining: 8,
    })

    const response = await statusRoute()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedGetMfaStatus).toHaveBeenCalledWith('user-1')
  })
})
