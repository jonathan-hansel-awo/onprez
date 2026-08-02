/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveReadableBusinessContext: jest.fn(),
  resolveWritableBusinessContext: jest.fn(),
}))
jest.mock('@/lib/services/rate-limit', () => ({ checkRateLimit: jest.fn() }))
jest.mock('@/lib/presence/public-presence-cache', () => ({
  invalidatePublicPresence: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: { securityLog: { create: jest.fn() } },
}))
jest.mock('@/lib/business/handle-changes', () => {
  class BusinessHandleValidationError extends Error {}
  class BusinessHandleConflictError extends Error {}
  class BusinessHandleNotFoundError extends Error {}
  return {
    BusinessHandleValidationError,
    BusinessHandleConflictError,
    BusinessHandleNotFoundError,
    changeBusinessHandle: jest.fn(),
    getBusinessHandleHistory: jest.fn(),
  }
})

import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { invalidatePublicPresence } from '@/lib/presence/public-presence-cache'
import { prisma } from '@/lib/prisma'
import { BusinessHandleConflictError, changeBusinessHandle } from '@/lib/business/handle-changes'
import { PUT } from '@/app/api/business/handle/route'

function request(handle: string) {
  return new NextRequest('http://localhost/api/business/handle', {
    method: 'PUT',
    headers: { 'content-type': 'application/json', 'user-agent': 'test-agent' },
    body: JSON.stringify({ handle }),
  })
}

describe('business handle route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
    ;(resolveWritableBusinessContext as jest.Mock).mockResolvedValue({
      businessId: 'business-1',
      role: 'OWNER',
      isOwner: true,
    })
  })

  it('reserves handle changes for the business owner', async () => {
    ;(resolveWritableBusinessContext as jest.Mock).mockResolvedValue({
      businessId: 'business-1',
      role: 'ADMIN',
      isOwner: false,
    })

    const response = await PUT(request('new-handle'))

    expect(response.status).toBe(403)
    expect(changeBusinessHandle).not.toHaveBeenCalled()
  })

  it('returns a conflict without exposing database details', async () => {
    ;(changeBusinessHandle as jest.Mock).mockRejectedValue(
      new BusinessHandleConflictError('This handle is already taken')
    )

    const response = await PUT(request('taken-handle'))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'This handle is already taken',
    })
  })

  it('invalidates the old, new and historical routes after a change', async () => {
    ;(changeBusinessHandle as jest.Mock).mockResolvedValue({
      changed: true,
      oldHandle: 'old-handle',
      business: { id: 'business-1', slug: 'new-handle' },
      previousHandles: [
        { sourceHandle: 'old-handle', createdAt: new Date() },
        { sourceHandle: 'oldest-handle', createdAt: new Date() },
      ],
    })
    ;(prisma.securityLog.create as jest.Mock).mockResolvedValue({})

    const response = await PUT(request('new-handle'))

    expect(response.status).toBe(200)
    expect(invalidatePublicPresence).toHaveBeenCalledTimes(3)
    expect(invalidatePublicPresence).toHaveBeenCalledWith('old-handle')
    expect(invalidatePublicPresence).toHaveBeenCalledWith('new-handle')
    expect(invalidatePublicPresence).toHaveBeenCalledWith('oldest-handle')
    expect(prisma.securityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'business_handle_changed',
          details: {
            businessId: 'business-1',
            fromHandle: 'old-handle',
            toHandle: 'new-handle',
          },
        }),
      })
    )
  })
})
