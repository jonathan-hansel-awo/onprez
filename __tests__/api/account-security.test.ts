/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getActivity } from '@/app/api/account/activity/route'
import { GET as getTrustedDevices } from '@/app/api/account/trusted-devices/route'
import { DELETE as revokeTrustedDevice } from '@/app/api/account/trusted-devices/[id]/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    securityLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    trustedDevice: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/security-logging', () => ({
  logSecurityEvent: jest.fn(),
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedPrisma = prisma as unknown as {
  securityLog: {
    findMany: jest.Mock<any, any>
    count: jest.Mock<any, any>
  }
  trustedDevice: {
    findMany: jest.Mock<any, any>
    findFirst: jest.Mock<any, any>
    updateMany: jest.Mock<any, any>
  }
}
const mockedLogSecurityEvent = logSecurityEvent as jest.Mock

function createRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init)
}

describe('account security API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /api/account/activity returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await getActivity(createRequest('/api/account/activity'))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedPrisma.securityLog.findMany).not.toHaveBeenCalled()
  })

  it('GET /api/account/activity scopes logs to current user', async () => {
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1' })

    mockedPrisma.securityLog.findMany
      .mockResolvedValueOnce([
        {
          id: 'log-1',
          action: 'login',
          details: {},
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          severity: 'info',
          createdAt: new Date(),
        },
      ] as any)
      .mockResolvedValueOnce([{ action: 'login' }] as any)
      .mockResolvedValueOnce([{ severity: 'info' }] as any)

    mockedPrisma.securityLog.count.mockResolvedValue(1)

    const response = await getActivity(createRequest('/api/account/activity?page=1&limit=20'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedPrisma.securityLog.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
        }),
      })
    )

    expect(mockedPrisma.securityLog.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-1',
      }),
    })
  })

  it('GET /api/account/trusted-devices returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await getTrustedDevices()
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedPrisma.trustedDevice.findMany).not.toHaveBeenCalled()
  })

  it('GET /api/account/trusted-devices only queries current user active devices', async () => {
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1' })

    mockedPrisma.trustedDevice.findMany.mockResolvedValue([
      {
        id: 'device-1',
        deviceName: 'Chrome on Windows',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        ipAddress: '127.0.0.1',
        location: null,
        lastUsedAt: new Date(),
        createdAt: new Date(),
      },
    ] as any)

    const response = await getTrustedDevices()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedPrisma.trustedDevice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          revokedAt: null,
        },
      })
    )
  })

  it('DELETE /api/account/trusted-devices/[id] returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await revokeTrustedDevice(
      createRequest('/api/account/trusted-devices/device-1', {
        method: 'DELETE',
      }),
      {
        params: Promise.resolve({ id: 'device-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedPrisma.trustedDevice.updateMany).not.toHaveBeenCalled()
  })

  it('DELETE /api/account/trusted-devices/[id] returns 404 for another user device', async () => {
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockedPrisma.trustedDevice.findFirst.mockResolvedValue(null)

    const response = await revokeTrustedDevice(
      createRequest('/api/account/trusted-devices/device-2', {
        method: 'DELETE',
      }),
      {
        params: Promise.resolve({ id: 'device-2' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.success).toBe(false)
    expect(mockedPrisma.trustedDevice.updateMany).not.toHaveBeenCalled()
  })

  it('DELETE /api/account/trusted-devices/[id] revokes only current user device', async () => {
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1' })

    mockedPrisma.trustedDevice.findFirst.mockResolvedValue({
      id: 'device-1',
      userId: 'user-1',
      ipAddress: '127.0.0.1',
    } as any)

    mockedPrisma.trustedDevice.updateMany.mockResolvedValue({ count: 1 } as any)
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const response = await revokeTrustedDevice(
      createRequest('/api/account/trusted-devices/device-1', {
        method: 'DELETE',
      }),
      {
        params: Promise.resolve({ id: 'device-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedPrisma.trustedDevice.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'device-1',
        userId: 'user-1',
        revokedAt: null,
      },
      select: {
        id: true,
        userId: true,
        ipAddress: true,
      },
    })

    expect(mockedPrisma.trustedDevice.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'device-1',
        userId: 'user-1',
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    })
  })
})
