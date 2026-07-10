/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessAccess } from '@/lib/auth/business-access'

import { GET as availabilityGET, POST as availabilityPOST } from '@/app/api/availability/route'

import { GET as slotsGET } from '@/app/api/availability/slots/route'
import { GET as nextGET } from '@/app/api/availability/next/route'
import {
  generateDetailedAvailabilityRange,
  generateDetailedDayAvailability,
  calculateAvailabilitySummary,
  getBookingRulesFromSettings,
  findNextAvailableSlot,
  getAvailabilityHeatmap,
  getPeakHours,
  getBookingWindow,
  getEffectiveBookingLimits,
  getSlotsAroundTime,
} from '@/lib/utils/availability'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessAccess: jest.fn(),
  businessAuthErrorResponse: jest.fn(() => undefined),
  BusinessAuthError: class BusinessAuthError extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string
    ) {
      super(message)
      this.name = 'BusinessAuthError'
    }
  },
}))

jest.mock('@/lib/utils/availability', () => ({
  generateDetailedAvailabilityRange: jest.fn(),
  generateDetailedDayAvailability: jest.fn(),
  calculateAvailabilitySummary: jest.fn(),
  getBookingRulesFromSettings: jest.fn(),
  findNextAvailableSlot: jest.fn(),
  getAvailabilityHeatmap: jest.fn(),
  getPeakHours: jest.fn(),
  getBookingWindow: jest.fn(),
  getEffectiveBookingLimits: jest.fn(),
  getSlotsAroundTime: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  business: {
    findFirst: jest.Mock
    findUnique: jest.Mock
  }
  service: {
    findFirst: jest.Mock
  }
  appointment: {
    findMany: jest.Mock
  }
}

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedRequireBusinessAccess = requireBusinessAccess as jest.Mock
const mockedGenerateDetailedAvailabilityRange = generateDetailedAvailabilityRange as jest.Mock
const mockedGenerateDetailedDayAvailability = generateDetailedDayAvailability as jest.Mock
const mockedCalculateAvailabilitySummary = calculateAvailabilitySummary as jest.Mock
const mockedGetBookingRulesFromSettings = getBookingRulesFromSettings as jest.Mock
const mockedFindNextAvailableSlot = findNextAvailableSlot as jest.Mock
const mockedGetAvailabilityHeatmap = getAvailabilityHeatmap as jest.Mock
const mockedGetPeakHours = getPeakHours as jest.Mock
const mockedGetBookingWindow = getBookingWindow as jest.Mock
const mockedGetEffectiveBookingLimits = getEffectiveBookingLimits as jest.Mock
const mockedGetSlotsAroundTime = getSlotsAroundTime as jest.Mock

function createRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init)
}

const business = {
  id: 'business-1',
  name: 'Test Business',
  slug: 'test-business',
  timezone: 'Europe/London',
  settings: {},
  businessHours: [
    {
      dayOfWeek: 6,
      openTime: '09:00',
      closeTime: '17:00',
      isClosed: false,
    },
  ],
  specialDates: [],
}

describe('availability public API', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedPrisma.business.findFirst.mockResolvedValue(business)
    mockedPrisma.business.findUnique.mockResolvedValue(business)

    mockedPrisma.service.findFirst.mockResolvedValue({
      id: 'service-1',
      duration: 30,
      bufferTime: 0,
      requiresApproval: false,
      requiresDeposit: false,
      depositAmount: null,
      maxAdvanceBookingDays: null,
      minAdvanceBookingHours: null,
      name: 'Haircut',
      price: 25,
    })

    mockedPrisma.appointment.findMany.mockResolvedValue([])

    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
    })

    mockedRequireBusinessAccess.mockResolvedValue({
      userId: 'user-1',
      businessId: 'business-1',
      role: 'OWNER',
      isOwner: true,
      business: {
        id: 'business-1',
        name: 'Test Business',
        slug: 'test-business',
        ownerId: 'user-1',
      },
    })

    mockedGetBookingRulesFromSettings.mockReturnValue({
      maxAdvanceDays: 30,
      sameDayBookingAllowed: true,
      sameDayLeadTime: 60,
      bufferBetweenAppointments: 0,
      slotInterval: 30,
    })

    mockedGetEffectiveBookingLimits.mockReturnValue({
      maxAdvanceDays: 30,
      minAdvanceHours: 0,
      sameDayBooking: true,
      sameDayLeadTime: 60,
      source: {
        maxAdvance: 'business',
        minAdvance: 'business',
      },
    })

    mockedGetBookingWindow.mockReturnValue({
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-31T00:00:00.000Z'),
    })

    mockedGenerateDetailedAvailabilityRange.mockReturnValue([
      {
        date: '2026-08-01',
        dayOfWeek: 6,
        dateFormatted: '1 Aug 2026',
        dayName: 'Saturday',
        isOpen: true,
        businessHours: { openTime: '09:00', closeTime: '17:00' },
        isSpecialDate: false,
        specialDateName: undefined,
        availableSlots: 1,
        slots: [{ startTime: '10:00', available: true }],
      },
    ])

    mockedGenerateDetailedDayAvailability.mockReturnValue({
      date: '2026-08-01',
      dateFormatted: '1 Aug 2026',
      dayName: 'Saturday',
      isOpen: true,
      businessHours: { openTime: '09:00', closeTime: '17:00' },
      isSpecialDate: false,
      specialDateName: undefined,
      slots: [{ startTime: '10:00', available: true }],
    })

    mockedCalculateAvailabilitySummary.mockReturnValue({
      totalSlots: 1,
      availableSlots: 1,
    })

    mockedFindNextAvailableSlot.mockReturnValue({
      date: '2026-08-01',
      time: '10:00',
    })

    mockedGetAvailabilityHeatmap.mockReturnValue({
      '2026-08-01': 1,
    })

    mockedGetPeakHours.mockReturnValue([{ hour: 10, count: 2 }])

    mockedGetSlotsAroundTime.mockImplementation(day => day.slots)
  })

  it('rejects availability requests without businessId or slug', async () => {
    const response = await availabilityGET(createRequest('/api/availability'))

    expect(response.status).toBe(400)
    expect(mockedPrisma.business.findFirst).not.toHaveBeenCalled()
  })

  it('only allows service availability for active services in the requested business', async () => {
    const response = await availabilityGET(
      createRequest('/api/availability?businessId=business-1&serviceId=service-1&date=2026-08-01')
    )

    expect(response.status).toBe(200)

    expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'service-1',
          businessId: 'business-1',
          active: true,
        },
      })
    )
  })

  it('rejects inactive or cross-business services', async () => {
    mockedPrisma.service.findFirst.mockResolvedValue(null)

    const response = await availabilityGET(
      createRequest('/api/availability?businessId=business-1&serviceId=bad-service&date=2026-08-01')
    )

    expect(response.status).toBe(404)
    expect(mockedPrisma.appointment.findMany).not.toHaveBeenCalled()
  })

  it('requires auth before returning heatmap or peak-hour analytics', async () => {
    const response = await availabilityGET(
      createRequest(
        '/api/availability?businessId=business-1&includeHeatmap=true&includePeakHours=true'
      )
    )

    expect(response.status).toBe(200)
    expect(mockedGetCurrentUser).toHaveBeenCalled()
    expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')
  })

  it('checks specific slot availability against all business appointments, not only same-service appointments', async () => {
    const response = await availabilityPOST(
      createRequest('/api/availability', {
        method: 'POST',
        body: JSON.stringify({
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
        }),
        headers: {
          'content-type': 'application/json',
        },
      })
    )

    expect(response.status).toBe(200)

    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'business-1',
          status: {
            notIn: ['CANCELLED', 'NO_SHOW'],
          },
        }),
      })
    )

    expect(mockedPrisma.appointment.findMany.mock.calls[0][0].where.serviceId).toBeUndefined()
  })

  it('slots route validates service ownership and activity', async () => {
    const response = await slotsGET(
      createRequest(
        '/api/availability/slots?businessId=business-1&serviceId=service-1&date=2026-08-01'
      )
    )

    expect(response.status).toBe(200)

    expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'service-1',
        businessId: 'business-1',
        active: true,
      },
      select: {
        duration: true,
        bufferTime: true,
      },
    })
  })

  it('next route validates service ownership and activity', async () => {
    const response = await nextGET(
      createRequest('/api/availability/next?businessId=business-1&serviceId=service-1')
    )

    expect(response.status).toBe(200)

    expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'service-1',
        businessId: 'business-1',
        active: true,
      },
      select: {
        duration: true,
        bufferTime: true,
      },
    })
  })
})
