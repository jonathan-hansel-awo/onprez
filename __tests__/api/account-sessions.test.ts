/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getSessions } from '@/app/api/account/sessions/route'
import { DELETE as deleteSession } from '@/app/api/account/sessions/[id]/route'
import { POST as terminateAllSessions } from '@/app/api/account/sessions/terminate-all/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/security-logging', () => ({
  logSecurityEvent: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name: string) => {
      if (name === 'accessToken') {
        return { value: 'current-token' }
      }

      return undefined
    }),
  })),
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedPrisma = prisma as unknown as {
  session: {
    findMany: jest.Mock
    findFirst: jest.Mock
    deleteMany: jest.Mock
  }
}
const mockedLogSecurityEvent = logSecurityEvent as jest.Mock

function createRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init)
}

describe('account session API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /api/account/sessions returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await getSessions()
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedPrisma.session.findMany).not.toHaveBeenCalled()
  })

  it('GET /api/account/sessions returns safe sessions without raw tokens', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })

    mockedPrisma.session.findMany.mockResolvedValue([
      {
        id: 'session-1',
        token: 'current-token',
        deviceInfo: { browser: 'Chrome' },
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
        expiresAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ] as any)

    const response = await getSessions()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.sessions).toHaveLength(1)
    expect(json.data.sessions[0].isCurrent).toBe(true)
    expect(json.data.sessions[0].token).toBeUndefined()
    expect(JSON.stringify(json)).not.toContain('current-token')
  })

  it('DELETE /api/account/sessions/[id] only deletes a session belonging to current user', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })

    mockedPrisma.session.findFirst.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      ipAddress: '127.0.0.1',
    } as any)

    mockedPrisma.session.deleteMany.mockResolvedValue({ count: 1 } as any)
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const response = await deleteSession(createRequest('/api/account/sessions/session-1'), {
      params: Promise.resolve({ id: 'session-1' }),
    })

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedPrisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        userId: 'user-1',
      },
    })
    expect(mockedPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        userId: 'user-1',
      },
    })
  })

  it('DELETE /api/account/sessions/[id] returns 404 for another user session', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })

    mockedPrisma.session.findFirst.mockResolvedValue(null)

    const response = await deleteSession(createRequest('/api/account/sessions/session-2'), {
      params: Promise.resolve({ id: 'session-2' }),
    })

    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.success).toBe(false)
    expect(mockedPrisma.session.deleteMany).not.toHaveBeenCalled()
  })

  it('POST /api/account/sessions/terminate-all keeps current session by default', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })

    mockedPrisma.session.deleteMany.mockResolvedValue({ count: 2 } as any)
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const response = await terminateAllSessions(
      createRequest('/api/account/sessions/terminate-all', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.deletedCount).toBe(2)
    expect(mockedPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        token: { not: 'current-token' },
      },
    })
  })

  it('POST /api/account/sessions/terminate-all can delete all sessions including current', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })

    mockedPrisma.session.deleteMany.mockResolvedValue({ count: 3 } as any)
    mockedLogSecurityEvent.mockResolvedValue(undefined)

    const response = await terminateAllSessions(
      createRequest('/api/account/sessions/terminate-all', {
        method: 'POST',
        body: JSON.stringify({ keepCurrent: false }),
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.deletedCount).toBe(3)
    expect(mockedPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
      },
    })
  })
})
