/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  BusinessAuthError,
  getUserBusinessContexts,
  requireBusinessAccess,
  requireBusinessRole,
} from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    businessMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as unknown as {
  business: { findFirst: jest.Mock; findMany: jest.Mock }
  businessMember: { findFirst: jest.Mock; findMany: jest.Mock }
}

function business(id: string, ownerId: string, createdAt: string) {
  return {
    id,
    name: `Business ${id}`,
    slug: id,
    ownerId,
    settings: {},
    createdAt: new Date(createdAt),
  }
}

describe('central business authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns all owned and member businesses in stable order without duplicates', async () => {
    const ownedLater = business('owned-later', 'user-1', '2026-02-01T00:00:00Z')
    const ownedEarlier = business('owned-earlier', 'user-1', '2026-01-01T00:00:00Z')
    const memberBusiness = business('member-business', 'user-2', '2025-01-01T00:00:00Z')

    mockedPrisma.business.findMany.mockResolvedValue([ownedEarlier, ownedLater])
    mockedPrisma.businessMember.findMany.mockResolvedValue([
      {
        role: 'VIEWER',
        createdAt: new Date('2025-12-01T00:00:00Z'),
        business: memberBusiness,
      },
      {
        role: 'STAFF',
        createdAt: new Date('2026-03-01T00:00:00Z'),
        business: ownedLater,
      },
    ])

    const contexts = await getUserBusinessContexts('user-1')

    expect(contexts.map(context => context.businessId)).toEqual([
      'member-business',
      'owned-earlier',
      'owned-later',
    ])
    expect(contexts[0]).toMatchObject({ role: 'VIEWER', isOwner: false })
    expect(contexts[2]).toMatchObject({ role: 'OWNER', isOwner: true })
  })

  it('rejects a user who changes businessId to another tenant', async () => {
    mockedPrisma.business.findFirst.mockResolvedValue(null)
    mockedPrisma.businessMember.findFirst.mockResolvedValue(null)

    await expect(requireBusinessAccess('user-1', 'business-2')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
  })

  it('allows staff reads but rejects owner/admin-only writes', async () => {
    const staffBusiness = business('business-1', 'owner-1', '2026-01-01T00:00:00Z')
    mockedPrisma.business.findFirst.mockResolvedValue(null)
    mockedPrisma.businessMember.findFirst.mockResolvedValue({
      role: 'STAFF',
      business: staffBusiness,
    })

    await expect(requireBusinessAccess('staff-1', 'business-1')).resolves.toMatchObject({
      role: 'STAFF',
    })
    await expect(requireBusinessRole('staff-1', 'business-1', ['ADMIN'])).rejects.toBeInstanceOf(
      BusinessAuthError
    )
  })

  it('selects the exact requested business from query or header context', async () => {
    const selected = business('business-2', 'user-1', '2026-01-01T00:00:00Z')
    mockedPrisma.business.findFirst.mockResolvedValue(selected)

    const queryRequest = new NextRequest(
      'http://localhost/api/dashboard/stats?businessId=business-2'
    )
    const headerRequest = new NextRequest('http://localhost/api/dashboard/stats', {
      headers: { 'x-business-id': 'business-2' },
    })

    await expect(resolveReadableBusinessContext('user-1', queryRequest)).resolves.toMatchObject({
      businessId: 'business-2',
    })
    await expect(
      resolveWritableBusinessContext('user-1', headerRequest, ['ADMIN'])
    ).resolves.toMatchObject({ businessId: 'business-2', role: 'OWNER' })

    expect(mockedPrisma.business.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'business-2', ownerId: 'user-1' } })
    )
  })
})
