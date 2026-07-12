/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getBusiness } from '@/app/api/business/[businessId]/route'
import { PUT as updateBusinessTheme } from '@/app/api/business/[businessId]/theme/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    businessMember: {
      findFirst: jest.fn(),
    },
  },
}))

type TestUser = {
  id: string
  email: string
  emailVerified: boolean
  mfaEnabled: boolean
  role: 'USER'
}

const users = {
  ownerA: user('owner-a'),
  ownerB: user('owner-b'),
  staffA: user('staff-a'),
  adminA: user('admin-a'),
}

const businesses = {
  a: business('business-a', users.ownerA.id),
  b: business('business-b', users.ownerB.id),
}

const memberships = new Map([
  [`${users.staffA.id}:${businesses.a.id}`, 'STAFF'],
  [`${users.adminA.id}:${businesses.a.id}`, 'ADMIN'],
])

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedPrisma = prisma as unknown as {
  business: { findFirst: jest.Mock; findUnique: jest.Mock; update: jest.Mock }
  businessMember: { findFirst: jest.Mock }
}

function user(id: string): TestUser {
  return {
    id,
    email: `${id}@example.com`,
    emailVerified: true,
    mfaEnabled: false,
    role: 'USER',
  }
}

function business(id: string, ownerId: string) {
  return {
    id,
    ownerId,
    name: id,
    slug: id,
    category: 'OTHER',
    description: null,
    tagline: null,
    phone: null,
    email: `${id}@example.com`,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    country: 'GB',
    website: null,
    timezone: 'Europe/London',
    logoUrl: null,
    coverImageUrl: null,
    socialLinks: {},
    settings: {},
    branding: {},
    isPublished: false,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  }
}

function request(path: string, method: 'GET' | 'PUT' = 'GET') {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'PUT' ? JSON.stringify({ theme: { primaryColor: '#123456' } }) : undefined,
  })
}

function context(businessId: string) {
  return { params: Promise.resolve({ businessId }) }
}

describe('private business API role matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedPrisma.business.findFirst.mockImplementation(
      ({ where }: { where: { id: string; ownerId: string } }) => {
        const candidate = Object.values(businesses).find(item => item.id === where.id)
        return candidate?.ownerId === where.ownerId ? candidate : null
      }
    )

    mockedPrisma.businessMember.findFirst.mockImplementation(
      ({ where }: { where: { userId: string; businessId: string } }) => {
        const role = memberships.get(`${where.userId}:${where.businessId}`)
        const selectedBusiness = Object.values(businesses).find(
          item => item.id === where.businessId
        )

        return role && selectedBusiness ? { role, business: selectedBusiness } : null
      }
    )

    mockedPrisma.business.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Object.values(businesses).find(item => item.id === where.id) ?? null
    )

    mockedPrisma.business.update.mockImplementation(
      ({ where, data }: { where: { id: string }; data: { settings: unknown } }) => {
        const selectedBusiness = Object.values(businesses).find(item => item.id === where.id)
        return selectedBusiness
          ? { ...selectedBusiness, settings: data.settings, updatedAt: new Date() }
          : null
      }
    )
  })

  it.each([
    ['Owner A', users.ownerA, businesses.a.id, 'OWNER'],
    ['Owner B', users.ownerB, businesses.b.id, 'OWNER'],
    ['Staff A', users.staffA, businesses.a.id, 'STAFF'],
    ['Admin A', users.adminA, businesses.a.id, 'ADMIN'],
  ])('%s can read their authorized business', async (_label, currentUser, businessId, role) => {
    mockedGetCurrentUser.mockResolvedValue(currentUser)

    const response = await getBusiness(request(`/api/business/${businessId}`), context(businessId))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.business.id).toBe(businessId)
    expect(json.data.access.role).toBe(role)
  })

  it.each([
    ['Owner A', users.ownerA],
    ['Staff A', users.staffA],
    ['Admin A', users.adminA],
  ])('%s cannot read Business B by changing businessId', async (_label, currentUser) => {
    mockedGetCurrentUser.mockResolvedValue(currentUser)

    const response = await getBusiness(
      request(`/api/business/${businesses.b.id}`),
      context(businesses.b.id)
    )

    expect(response.status).toBe(403)
    expect(mockedPrisma.business.findUnique).not.toHaveBeenCalled()
  })

  it('staff can read Business A but cannot perform admin-only mutations', async () => {
    mockedGetCurrentUser.mockResolvedValue(users.staffA)

    const readResponse = await getBusiness(
      request(`/api/business/${businesses.a.id}`),
      context(businesses.a.id)
    )
    const writeResponse = await updateBusinessTheme(
      request(`/api/business/${businesses.a.id}/theme`, 'PUT'),
      context(businesses.a.id)
    )

    expect(readResponse.status).toBe(200)
    expect(writeResponse.status).toBe(403)
    expect(mockedPrisma.business.update).not.toHaveBeenCalled()
  })

  it.each([
    ['Owner A', users.ownerA],
    ['Admin A', users.adminA],
  ])('%s can perform an admin-level mutation for Business A', async (_label, currentUser) => {
    mockedGetCurrentUser.mockResolvedValue(currentUser)

    const response = await updateBusinessTheme(
      request(`/api/business/${businesses.a.id}/theme`, 'PUT'),
      context(businesses.a.id)
    )

    expect(response.status).toBe(200)
    expect(mockedPrisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: businesses.a.id } })
    )
  })

  it.each([
    ['read', () => getBusiness(request('/api/business/business-a'), context('business-a'))],
    [
      'write',
      () =>
        updateBusinessTheme(
          request('/api/business/business-a/theme', 'PUT'),
          context('business-a')
        ),
    ],
  ])('anonymous users cannot %s private business data', async (_operation, invoke) => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await invoke()

    expect(response.status).toBe(401)
    expect(mockedPrisma.business.findFirst).not.toHaveBeenCalled()
    expect(mockedPrisma.business.update).not.toHaveBeenCalled()
  })
})
