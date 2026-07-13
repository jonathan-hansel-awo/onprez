/** @jest-environment node */

import { prisma } from '@/lib/prisma'
import { createMultiDayAppointment } from '@/lib/services/multi-day-booking'

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

describe('transaction-safe multi-day booking conflicts', () => {
  beforeEach(() => jest.resetAllMocks())

  it('locks and rechecks every slot before creating the series', async () => {
    const calls: string[] = []
    const tx = {
      $executeRaw: jest.fn(async () => calls.push('lock')),
      appointment: {
        findMany: jest.fn(async () => {
          calls.push('check')
          return []
        }),
        create: jest.fn(async () => {
          calls.push('create')
          return { id: `appointment-${calls.filter(call => call === 'create').length}` }
        }),
      },
      customer: { update: jest.fn().mockResolvedValue({}) },
    }

    mockedPrisma.service.findUnique.mockResolvedValue({
      id: 'service-1',
      businessId: 'business-1',
      duration: 30,
      bufferTime: 10,
      price: 25,
    })
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      timezone: 'Europe/London',
      settings: {},
      businessHours: [
        { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00', isClosed: false },
      ],
      specialDates: [],
    })
    mockedPrisma.appointment.findMany.mockResolvedValue([])
    mockedPrisma.$transaction.mockImplementation(async callback => callback(tx))

    const result = await createMultiDayAppointment({
      businessId: 'business-1',
      serviceId: 'service-1',
      customerId: 'customer-1',
      customerName: 'Customer',
      customerEmail: 'customer@example.com',
      startDate: '2030-01-01',
      startTime: '10:00',
      pattern: { type: 'consecutive', consecutiveDays: 2 },
    })

    expect(result.success).toBe(true)
    expect(calls).toEqual(['lock', 'check', 'check', 'create', 'create'])
  })
})
