/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getNotes, PUT as updateNotes } from '@/app/api/dashboard/bookings/[id]/notes/route'
import { GET as getStats } from '@/app/api/dashboard/stats/route'
import { GET as getCustomers } from '@/app/api/dashboard/customers/route'
import { POST as quickCreateBooking } from '@/app/api/dashboard/bookings/quick-create/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'
import { requireAppointmentAccess, requireAppointmentRole } from '@/lib/auth/appointment-access'
import { prisma } from '@/lib/prisma'
import { createBooking } from '@/lib/services/booking'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveReadableBusinessContext: jest.fn(),
  resolveWritableBusinessContext: jest.fn(),
}))

jest.mock('@/lib/auth/appointment-access', () => ({
  requireAppointmentAccess: jest.fn(),
  requireAppointmentRole: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  businessAuthErrorResponse: jest.fn(() => undefined),
}))

jest.mock('@/lib/services/booking', () => ({
  createBooking: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: {
      findUnique: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveReadableBusinessContext = resolveReadableBusinessContext as jest.Mock
const mockedResolveWritableBusinessContext = resolveWritableBusinessContext as jest.Mock
const mockedRequireAppointmentAccess = requireAppointmentAccess as jest.Mock
const mockedRequireAppointmentRole = requireAppointmentRole as jest.Mock
const mockedCreateBooking = createBooking as jest.Mock

const mockedPrisma = prisma as unknown as {
  appointment: {
    findUnique: jest.Mock
    count: jest.Mock
    aggregate: jest.Mock
    findMany: jest.Mock
    groupBy: jest.Mock
    update: jest.Mock
  }
  customer: {
    count: jest.Mock
    findFirst: jest.Mock
    findMany: jest.Mock
  }
  business: {
    findUnique: jest.Mock
  }
}

function createRequest(
  path: string,
  body?: unknown,
  init?: ConstructorParameters<typeof NextRequest>[1]
) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      'x-forwarded-for': '127.0.0.1',
      ...(init?.headers || {}),
    },
    ...init,
  })
}

const user = {
  id: 'user-1',
  email: 'user@example.com',
  emailVerified: true,
  mfaEnabled: false,
  role: 'USER',
}

const businessContext = {
  userId: 'user-1',
  businessId: 'business-1',
  role: 'OWNER',
  isOwner: true,
  business: {
    id: 'business-1',
    name: 'Business One',
    slug: 'business-one',
    ownerId: 'user-1',
    settings: {},
  },
}

describe('dashboard authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedGetCurrentUser.mockResolvedValue(user)
    mockedResolveReadableBusinessContext.mockResolvedValue(businessContext)
    mockedResolveWritableBusinessContext.mockResolvedValue(businessContext)
    mockedRequireAppointmentAccess.mockResolvedValue({ appointment: { businessId: 'business-1' } })
    mockedRequireAppointmentRole.mockResolvedValue({ appointment: { businessId: 'business-1' } })
  })

  it('GET booking notes requires appointment access', async () => {
    mockedPrisma.appointment.findUnique.mockResolvedValue({
      id: 'appointment-1',
      businessNotes: 'Private business note',
      customerNotes: 'Customer note',
    })

    const response = await getNotes(createRequest('/api/dashboard/bookings/appointment-1/notes'), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedRequireAppointmentAccess).toHaveBeenCalledWith('user-1', 'appointment-1')
  })

  it('PUT booking notes requires writable appointment role', async () => {
    mockedPrisma.appointment.update.mockResolvedValue({
      id: 'appointment-1',
      businessNotes: 'Updated',
      customerNotes: null,
      updatedAt: new Date(),
    })

    const response = await updateNotes(
      createRequest(
        '/api/dashboard/bookings/appointment-1/notes',
        {
          businessNotes: 'Updated',
        },
        { method: 'PUT' }
      ),
      {
        params: Promise.resolve({ id: 'appointment-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedRequireAppointmentRole).toHaveBeenCalledWith('user-1', 'appointment-1', [
      'ADMIN',
      'MANAGER',
      'STAFF',
    ])
  })

  it('GET dashboard stats uses readable business context', async () => {
    mockedPrisma.appointment.count.mockResolvedValue(0)
    mockedPrisma.appointment.aggregate.mockResolvedValue({ _sum: { totalAmount: 0 } })
    mockedPrisma.customer.count.mockResolvedValue(0)

    const response = await getStats(createRequest('/api/dashboard/stats'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith(
      'user-1',
      expect.any(NextRequest)
    )
  })

  it('GET dashboard customers is tenant-scoped through readable business context', async () => {
    mockedPrisma.customer.findMany.mockResolvedValue([])

    const response = await getCustomers(createRequest('/api/dashboard/customers'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith(
      'user-1',
      expect.any(NextRequest)
    )
    expect(mockedPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'business-1' } })
    )
  })

  it('POST quick-create uses writable business context', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      name: 'Business One',
      timezone: 'Europe/London',
      email: 'business@example.com',
    })

    mockedCreateBooking.mockResolvedValue({
      success: true,
      appointment: {
        id: 'appointment-1',
        customerEmail: 'customer@example.com',
      },
    })

    const response = await quickCreateBooking(
      createRequest('/api/dashboard/bookings/quick-create', {
        serviceId: 'ckservice000000000000000001',
        date: '2026-08-01',
        startTime: '10:00',
        customerName: 'Customer One',
        customerEmail: 'customer@example.com',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith(
      'user-1',
      expect.any(NextRequest),
      ['ADMIN', 'MANAGER', 'STAFF']
    )
  })
})
