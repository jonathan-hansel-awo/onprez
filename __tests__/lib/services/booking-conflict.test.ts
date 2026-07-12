/** @jest-environment node */

import { prisma } from '@/lib/prisma'
import { checkBookingConflicts, createBooking, zonedDateTimeToUtc } from '@/lib/services/booking'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    service: { findUnique: jest.fn() },
    business: { findUnique: jest.fn() },
    appointment: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const mockedPrisma = prisma as unknown as {
  service: { findUnique: jest.Mock }
  business: { findUnique: jest.Mock }
  appointment: { findMany: jest.Mock }
  $transaction: jest.Mock
}

describe('transaction-safe booking conflicts', () => {
  beforeEach(() => jest.resetAllMocks())

  it('converts business-local times across daylight-saving offsets', () => {
    expect(zonedDateTimeToUtc('2030-01-01', '10:00', 'Europe/London').toISOString()).toBe(
      '2030-01-01T10:00:00.000Z'
    )
    expect(zonedDateTimeToUtc('2030-07-01', '10:00', 'Europe/London').toISOString()).toBe(
      '2030-07-01T09:00:00.000Z'
    )
  })

  it('blocks pending and confirmed appointments when either service buffer overlaps', async () => {
    mockedPrisma.appointment.findMany.mockResolvedValue([
      {
        id: 'existing',
        startTime: new Date('2030-01-01T10:30:00.000Z'),
        endTime: new Date('2030-01-01T11:00:00.000Z'),
        customerName: 'Existing customer',
        service: { name: 'Existing service', bufferTime: 15 },
      },
    ])

    const result = await checkBookingConflicts(
      'business-1',
      '2030-01-01',
      '10:00',
      20,
      0,
      'Europe/London'
    )

    expect(result.available).toBe(false)
    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['PENDING', 'CONFIRMED'] } }),
      })
    )
  })

  it('allows cancelled appointments because only blocking statuses are queried', async () => {
    mockedPrisma.appointment.findMany.mockResolvedValue([])

    const result = await checkBookingConflicts(
      'business-1',
      '2030-01-01',
      '10:00',
      30,
      10,
      'Europe/London'
    )

    expect(result).toEqual({ available: true })
  })

  it('locks, rechecks, and creates in one transaction', async () => {
    const calls: string[] = []
    const tx = {
      $executeRaw: jest.fn(async () => calls.push('lock')),
      appointment: {
        findMany: jest.fn(async () => {
          calls.push('check')
          return []
        }),
        create: jest.fn(async ({ data }) => {
          calls.push('create')
          return { id: 'appointment-1', ...data }
        }),
      },
      customer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'customer-1', phone: null }),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
      },
    }

    mockedPrisma.service.findUnique.mockResolvedValue({
      id: 'service-1',
      businessId: 'business-1',
      active: true,
      duration: 30,
      bufferTime: 10,
      requiresApproval: false,
      requiresDeposit: false,
      depositAmount: null,
      price: 25,
    })
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      timezone: 'Europe/London',
      settings: { advanceBookingDays: 5000, sameDayBooking: true },
      businessHours: [{ dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', isClosed: false }],
      specialDates: [],
    })
    mockedPrisma.$transaction.mockImplementation(async callback => callback(tx))

    const result = await createBooking('business-1', 'service-1', '2030-01-01', '10:00', {
      name: 'Customer',
      email: 'customer@example.com',
    })

    expect(result.success).toBe(true)
    expect(calls).toEqual(['lock', 'check', 'create'])
    expect(mockedPrisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
