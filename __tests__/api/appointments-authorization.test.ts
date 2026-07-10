/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'

import { requireBusinessAccess, requireBusinessRole } from '@/lib/auth/business-access'

import { requireAppointmentAccess, requireAppointmentRole } from '@/lib/auth/appointment-access'

import {
  createBooking,
  cancelAppointment,
  rescheduleAppointment,
  validateBookingTime,
  checkBookingConflicts,
} from '@/lib/services/booking'

import {
  createMultiDayAppointment,
  generateMultiDayDates,
  generateMultiDaySlots,
  checkMultiDayAvailability,
  getAppointmentSeries,
  cancelAppointmentSeries,
} from '@/lib/services/multi-day-booking'

import {
  appointmentQuerySchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  rescheduleAppointmentSchema,
  checkAvailabilitySchema,
} from '@/lib/validation/booking'

import { GET as appointmentsGET, POST as appointmentsPOST } from '@/app/api/appointments/route'

import {
  GET as appointmentGET,
  PUT as appointmentPUT,
  DELETE as appointmentDELETE,
} from '@/app/api/appointments/[id]/route'

import { POST as appointmentReschedulePOST } from '@/app/api/appointments/[id]/reschedule/route'

import { POST as checkAvailabilityPOST } from '@/app/api/appointments/check-conflicts/route'

import { GET as multiDayGET, POST as multiDayPOST } from '@/app/api/appointments/multi-day/route'

import {
  GET as appointmentSeriesGET,
  DELETE as appointmentSeriesDELETE,
} from '@/app/api/appointments/[id]/series/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveReadableBusinessContext: jest.fn(),
  resolveWritableBusinessContext: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessAccess: jest.fn(),
  requireBusinessRole: jest.fn(),
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

jest.mock('@/lib/auth/appointment-access', () => ({
  requireAppointmentAccess: jest.fn(),
  requireAppointmentRole: jest.fn(),
}))

jest.mock('@/lib/services/booking', () => ({
  createBooking: jest.fn(),
  cancelAppointment: jest.fn(),
  rescheduleAppointment: jest.fn(),
  validateBookingTime: jest.fn(),
  checkBookingConflicts: jest.fn(),
}))

jest.mock('@/lib/services/multi-day-booking', () => ({
  createMultiDayAppointment: jest.fn(),
  generateMultiDayDates: jest.fn(),
  generateMultiDaySlots: jest.fn(),
  checkMultiDayAvailability: jest.fn(),
  getAppointmentSeries: jest.fn(),
  cancelAppointmentSeries: jest.fn(),
}))

jest.mock('@/lib/validation/booking', () => ({
  appointmentQuerySchema: {
    safeParse: jest.fn(),
  },
  createAppointmentSchema: {
    safeParse: jest.fn(),
  },
  updateAppointmentSchema: {
    safeParse: jest.fn(),
  },
  rescheduleAppointmentSchema: {
    safeParse: jest.fn(),
  },
  checkAvailabilitySchema: {
    safeParse: jest.fn(),
  },
}))

const mockedPrisma = prisma as unknown as {
  business: {
    findUnique: jest.Mock
  }
  service: {
    findFirst: jest.Mock
  }
  appointment: {
    findMany: jest.Mock
    count: jest.Mock
    findFirst: jest.Mock
    update: jest.Mock
  }
  customer: {
    findFirst: jest.Mock
    updateMany: jest.Mock
  }
}

const mockedGetCurrentUser = getCurrentUser as jest.Mock

const mockedResolveReadableBusinessContext = resolveReadableBusinessContext as jest.Mock
const mockedResolveWritableBusinessContext = resolveWritableBusinessContext as jest.Mock

const mockedRequireBusinessAccess = requireBusinessAccess as jest.Mock
const mockedRequireBusinessRole = requireBusinessRole as jest.Mock

const mockedRequireAppointmentAccess = requireAppointmentAccess as jest.Mock
const mockedRequireAppointmentRole = requireAppointmentRole as jest.Mock

const mockedCreateBooking = createBooking as jest.Mock
const mockedCancelAppointment = cancelAppointment as jest.Mock
const mockedRescheduleAppointment = rescheduleAppointment as jest.Mock
const mockedValidateBookingTime = validateBookingTime as jest.Mock
const mockedCheckBookingConflicts = checkBookingConflicts as jest.Mock

const mockedCreateMultiDayAppointment = createMultiDayAppointment as jest.Mock
const mockedGenerateMultiDayDates = generateMultiDayDates as jest.Mock
const mockedGenerateMultiDaySlots = generateMultiDaySlots as jest.Mock
const mockedCheckMultiDayAvailability = checkMultiDayAvailability as jest.Mock
const mockedGetAppointmentSeries = getAppointmentSeries as jest.Mock
const mockedCancelAppointmentSeries = cancelAppointmentSeries as jest.Mock

const mockedAppointmentQuerySchema = appointmentQuerySchema as unknown as {
  safeParse: jest.Mock
}

const mockedCreateAppointmentSchema = createAppointmentSchema as unknown as {
  safeParse: jest.Mock
}

const mockedUpdateAppointmentSchema = updateAppointmentSchema as unknown as {
  safeParse: jest.Mock
}

const mockedRescheduleAppointmentSchema = rescheduleAppointmentSchema as unknown as {
  safeParse: jest.Mock
}

const mockedCheckAvailabilitySchema = checkAvailabilitySchema as unknown as {
  safeParse: jest.Mock
}

function createRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init)
}

function jsonRequest(path: string, body: unknown, method = 'POST') {
  return createRequest(path, {
    method,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  })
}

const authUser = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER',
  emailVerified: true,
  mfaEnabled: false,
}

const readableBusinessContext = {
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
}

const writableBusinessContext = readableBusinessContext

const appointmentAccess = {
  id: 'appointment-1',
  businessId: 'business-1',
  status: 'PENDING',
  startTime: new Date('2026-08-01T10:00:00.000Z'),
  endTime: new Date('2026-08-01T10:30:00.000Z'),
  customerId: 'customer-1',
  customerEmail: 'customer@example.com',
  businessNotes: null,
  customerNotes: null,
  totalAmount: 25,
}

describe('appointments API authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)

    mockedResolveReadableBusinessContext.mockResolvedValue(readableBusinessContext)
    mockedResolveWritableBusinessContext.mockResolvedValue(writableBusinessContext)

    mockedRequireBusinessAccess.mockResolvedValue(readableBusinessContext)
    mockedRequireBusinessRole.mockResolvedValue(writableBusinessContext)

    mockedRequireAppointmentAccess.mockResolvedValue({
      appointment: appointmentAccess,
      context: readableBusinessContext,
    })

    mockedRequireAppointmentRole.mockResolvedValue({
      appointment: appointmentAccess,
      context: writableBusinessContext,
    })

    mockedAppointmentQuerySchema.safeParse.mockReturnValue({
      success: true,
      data: {
        status: undefined,
        startDate: undefined,
        endDate: undefined,
        customerId: undefined,
        serviceId: undefined,
        page: 1,
        limit: 10,
        sortBy: 'startTime',
        sortOrder: 'asc',
      },
    })

    mockedCreateAppointmentSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        serviceId: 'service-1',
        date: '2026-08-01',
        startTime: '10:00',
        customerName: 'John Customer',
        customerEmail: 'customer@example.com',
        customerPhone: '07123456789',
        customerNotes: 'Test notes',
      },
    })

    mockedUpdateAppointmentSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        status: 'NO_SHOW',
      },
    })

    mockedRescheduleAppointmentSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        date: '2026-08-02',
        startTime: '11:00',
        reason: 'Customer requested a later time',
      },
    })

    mockedCheckAvailabilitySchema.safeParse.mockReturnValue({
      success: true,
      data: {
        businessId: 'business-1',
        serviceId: 'service-1',
        date: '2026-08-01',
        startTime: '10:00',
        duration: undefined,
        excludeAppointmentId: undefined,
      },
    })
  })

  describe('GET /api/appointments', () => {
    it('uses readable business context and scopes appointment listing to that business', async () => {
      mockedPrisma.appointment.findMany.mockResolvedValue([
        {
          id: 'appointment-1',
          startTime: new Date('2026-08-01T10:00:00.000Z'),
          endTime: new Date('2026-08-01T10:30:00.000Z'),
          duration: 30,
          status: 'PENDING',
          previousStatus: null,
          customerName: 'John Customer',
          customerEmail: 'customer@example.com',
          customerPhone: '07123456789',
          customerNotes: null,
          businessNotes: null,
          totalAmount: 25,
          paymentStatus: 'PENDING',
          createdAt: new Date('2026-07-01T10:00:00.000Z'),
          updatedAt: new Date('2026-07-01T10:00:00.000Z'),
          service: {
            id: 'service-1',
            name: 'Haircut',
            price: 25,
            duration: 30,
          },
          customer: {
            id: 'customer-1',
            name: 'John Customer',
            email: 'customer@example.com',
            phone: '07123456789',
          },
        },
      ])

      mockedPrisma.appointment.count.mockResolvedValue(1)

      const response = await appointmentsGET(createRequest('/api/appointments'))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)

      expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith('user-1')

      expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: 'business-1',
          },
        })
      )

      expect(mockedPrisma.appointment.count).toHaveBeenCalledWith({
        where: {
          businessId: 'business-1',
        },
      })
    })
  })

  describe('POST /api/appointments', () => {
    it('requires writable business context and checks the service belongs to the authorized business', async () => {
      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
      })

      mockedCreateBooking.mockResolvedValue({
        success: true,
        appointment: {
          id: 'appointment-1',
        },
      })

      const response = await appointmentsPOST(
        jsonRequest('/api/appointments', {
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          customerName: 'John Customer',
          customerEmail: 'customer@example.com',
        })
      )

      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)

      expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith('user-1', undefined, [
        'ADMIN',
        'MANAGER',
        'STAFF',
      ])

      expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-1',
          businessId: 'business-1',
          active: true,
        },
        select: {
          id: true,
        },
      })

      expect(mockedCreateBooking).toHaveBeenCalledWith(
        'business-1',
        'service-1',
        '2026-08-01',
        '10:00',
        {
          name: 'John Customer',
          email: 'customer@example.com',
          phone: '07123456789',
          notes: 'Test notes',
        },
        expect.objectContaining({
          status: 'CONFIRMED',
          bookingSource: 'dashboard',
        })
      )
    })

    it('rejects appointment creation when the service is not active or not in the business', async () => {
      mockedPrisma.service.findFirst.mockResolvedValue(null)

      const response = await appointmentsPOST(
        jsonRequest('/api/appointments', {
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          customerName: 'John Customer',
          customerEmail: 'customer@example.com',
        })
      )

      expect(response.status).toBe(404)
      expect(mockedCreateBooking).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/appointments/[id]', () => {
    it('requires appointment access and fetches the appointment scoped to its business', async () => {
      mockedPrisma.appointment.findFirst.mockResolvedValue({
        id: 'appointment-1',
        businessId: 'business-1',
        totalAmount: 25,
        service: {
          id: 'service-1',
          name: 'Haircut',
          price: 25,
        },
        customer: {
          id: 'customer-1',
          name: 'John Customer',
        },
        business: {
          name: 'Test Business',
        },
      })

      const response = await appointmentGET(createRequest('/api/appointments/appointment-1'), {
        params: Promise.resolve({ id: 'appointment-1' }),
      })

      expect(response.status).toBe(200)

      expect(mockedRequireAppointmentAccess).toHaveBeenCalledWith('user-1', 'appointment-1')

      expect(mockedPrisma.appointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'appointment-1',
            businessId: 'business-1',
          },
        })
      )
    })
  })

  describe('PUT /api/appointments/[id]', () => {
    it('requires appointment role and scopes customer stat updates to the appointment business', async () => {
      mockedPrisma.appointment.findFirst.mockResolvedValue({
        id: 'appointment-1',
        businessId: 'business-1',
        status: 'CONFIRMED',
        customerId: 'customer-1',
      })

      mockedPrisma.appointment.update.mockResolvedValue({
        id: 'appointment-1',
        status: 'NO_SHOW',
        totalAmount: 25,
        service: {
          id: 'service-1',
          name: 'Haircut',
          price: 25,
        },
        customer: {
          id: 'customer-1',
          name: 'John Customer',
        },
      })

      mockedPrisma.customer.updateMany.mockResolvedValue({ count: 1 })

      const response = await appointmentPUT(
        jsonRequest('/api/appointments/appointment-1', { status: 'NO_SHOW' }, 'PUT'),
        {
          params: Promise.resolve({ id: 'appointment-1' }),
        }
      )

      expect(response.status).toBe(200)

      expect(mockedRequireAppointmentRole).toHaveBeenCalledWith('user-1', 'appointment-1', [
        'ADMIN',
        'MANAGER',
        'STAFF',
      ])

      expect(mockedPrisma.customer.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'customer-1',
          businessId: 'business-1',
        },
        data: {
          noShowCount: { increment: 1 },
        },
      })

      expect(mockedPrisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'appointment-1' },
          data: expect.objectContaining({
            status: 'NO_SHOW',
            previousStatus: 'CONFIRMED',
          }),
        })
      )
    })

    it('rejects service changes when the new service is outside the appointment business', async () => {
      mockedUpdateAppointmentSchema.safeParse.mockReturnValueOnce({
        success: true,
        data: {
          serviceId: 'other-service',
        },
      })

      mockedRequireAppointmentRole.mockResolvedValueOnce({
        appointment: {
          ...appointmentAccess,
          id: 'appointment-1',
          businessId: 'business-1',
        },
        context: writableBusinessContext,
      })

      mockedPrisma.appointment.findFirst.mockResolvedValue({
        id: 'appointment-1',
        businessId: 'business-1',
        status: 'PENDING',
        customerId: 'customer-1',
      })

      mockedPrisma.service.findFirst.mockResolvedValue(null)

      const response = await appointmentPUT(
        jsonRequest('/api/appointments/appointment-1', { serviceId: 'other-service' }, 'PUT'),
        {
          params: Promise.resolve({ id: 'appointment-1' }),
        }
      )

      const json = await response.json()

      expect(json).toEqual({
        success: false,
        error: 'Service not found',
      })

      expect(response.status).toBe(404)
      expect(mockedPrisma.appointment.update).not.toHaveBeenCalled()

      expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'other-service',
          businessId: 'business-1',
        },
        select: { id: true },
      })
    })
  })

  describe('DELETE /api/appointments/[id]', () => {
    it('requires appointment role and passes the appointment businessId into cancelAppointment', async () => {
      mockedCancelAppointment.mockResolvedValue({
        success: true,
        appointment: {
          id: 'appointment-1',
          status: 'CANCELLED',
        },
      })

      const response = await appointmentDELETE(
        createRequest('/api/appointments/appointment-1?reason=Customer%20request'),
        {
          params: Promise.resolve({ id: 'appointment-1' }),
        }
      )

      expect(response.status).toBe(200)

      expect(mockedRequireAppointmentRole).toHaveBeenCalledWith('user-1', 'appointment-1', [
        'ADMIN',
        'MANAGER',
        'STAFF',
      ])

      expect(mockedCancelAppointment).toHaveBeenCalledWith(
        'appointment-1',
        'business-1',
        'BUSINESS',
        'Customer request'
      )
    })
  })

  describe('POST /api/appointments/[id]/reschedule', () => {
    it('requires appointment role and reschedules using the appointment businessId', async () => {
      mockedRescheduleAppointment.mockResolvedValue({
        success: true,
        appointment: {
          id: 'appointment-1',
          startTime: new Date('2026-08-02T11:00:00.000Z'),
        },
      })

      const response = await appointmentReschedulePOST(
        jsonRequest('/api/appointments/appointment-1/reschedule', {
          date: '2026-08-02',
          startTime: '11:00',
          reason: 'Customer requested a later time',
        }),
        {
          params: Promise.resolve({ id: 'appointment-1' }),
        }
      )

      expect(response.status).toBe(200)

      expect(mockedRequireAppointmentRole).toHaveBeenCalledWith('user-1', 'appointment-1', [
        'ADMIN',
        'MANAGER',
        'STAFF',
      ])

      expect(mockedRescheduleAppointment).toHaveBeenCalledWith(
        'appointment-1',
        'business-1',
        '2026-08-02',
        '11:00',
        'Customer requested a later time'
      )
    })
  })

  describe('POST /api/appointments/check-availability', () => {
    it('allows public availability checks but only for active services in the requested business', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        settings: {},
        timezone: 'Europe/London',
      })

      mockedPrisma.service.findFirst.mockResolvedValue({
        duration: 30,
        bufferTime: 10,
      })

      mockedValidateBookingTime.mockResolvedValue({
        valid: true,
      })

      mockedCheckBookingConflicts.mockResolvedValue({
        available: true,
        conflicts: [],
      })

      const response = await checkAvailabilityPOST(
        jsonRequest('/api/appointments/check-availability', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
        })
      )

      expect(response.status).toBe(200)

      expect(mockedGetCurrentUser).not.toHaveBeenCalled()
      expect(mockedRequireBusinessAccess).not.toHaveBeenCalled()

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

      expect(mockedCheckBookingConflicts).toHaveBeenCalledWith(
        'business-1',
        '2026-08-01',
        '10:00',
        30,
        10,
        'Europe/London',
        undefined
      )
    })

    it('requires business access before using excludeAppointmentId', async () => {
      mockedCheckAvailabilitySchema.safeParse.mockReturnValueOnce({
        success: true,
        data: {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          duration: undefined,
          excludeAppointmentId: 'appointment-1',
        },
      })

      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        settings: {},
        timezone: 'Europe/London',
      })

      mockedPrisma.service.findFirst.mockResolvedValue({
        duration: 30,
        bufferTime: 10,
      })

      mockedPrisma.appointment.findFirst.mockResolvedValue({
        id: 'appointment-1',
      })

      mockedValidateBookingTime.mockResolvedValue({
        valid: true,
      })

      mockedCheckBookingConflicts.mockResolvedValue({
        available: true,
        conflicts: [],
      })

      const response = await checkAvailabilityPOST(
        jsonRequest('/api/appointments/check-availability', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          excludeAppointmentId: 'appointment-1',
        })
      )

      expect(response.status).toBe(200)

      expect(mockedGetCurrentUser).toHaveBeenCalled()
      expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')

      expect(mockedPrisma.appointment.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'appointment-1',
          businessId: 'business-1',
        },
        select: { id: true },
      })
    })
  })

  describe('GET /api/appointments/multi-day', () => {
    it('requires business access before previewing multi-day slots', async () => {
      mockedPrisma.service.findFirst.mockResolvedValue({
        duration: 45,
      })

      mockedGenerateMultiDayDates.mockReturnValue(['2026-08-01', '2026-08-02'])
      mockedGenerateMultiDaySlots.mockReturnValue([
        {
          date: '2026-08-01',
          startTime: '09:00',
        },
        {
          date: '2026-08-02',
          startTime: '09:00',
        },
      ])

      mockedCheckMultiDayAvailability.mockResolvedValue({
        available: true,
      })

      const response = await multiDayGET(
        createRequest(
          '/api/appointments/multi-day?businessId=business-1&serviceId=service-1&startDate=2026-08-01&patternType=consecutive&checkAvailability=true'
        )
      )

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')

      expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-1',
          businessId: 'business-1',
          active: true,
        },
        select: {
          duration: true,
        },
      })

      expect(mockedCheckMultiDayAvailability).toHaveBeenCalledWith('business-1', expect.any(Array))
    })
  })

  describe('POST /api/appointments/multi-day', () => {
    it('requires writable business role before creating multi-day appointments', async () => {
      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
      })

      mockedCreateMultiDayAppointment.mockResolvedValue({
        success: true,
        appointments: [{ id: 'appointment-1' }, { id: 'appointment-2' }],
      })

      const response = await multiDayPOST(
        jsonRequest('/api/appointments/multi-day', {
          businessId: 'business-1',
          serviceId: 'service-1',
          startDate: '2026-08-01',
        })
      )

      expect(response.status).toBe(201)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
        'ADMIN',
        'MANAGER',
        'STAFF',
      ])

      expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-1',
          businessId: 'business-1',
          active: true,
        },
        select: { id: true },
      })

      expect(mockedCreateMultiDayAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'business-1',
          serviceId: 'service-1',
        })
      )
    })
  })

  describe('GET /api/appointments/[id]/series', () => {
    it('requires appointment access before returning appointment series data', async () => {
      mockedGetAppointmentSeries.mockResolvedValue({
        parentAppointment: {
          id: 'appointment-1',
        },
        appointments: [{ id: 'appointment-1' }, { id: 'appointment-2' }],
      })

      const response = await appointmentSeriesGET(
        createRequest('/api/appointments/appointment-1/series'),
        {
          params: Promise.resolve({ id: 'appointment-1' }),
        }
      )

      expect(response.status).toBe(200)

      expect(mockedRequireAppointmentAccess).toHaveBeenCalledWith('user-1', 'appointment-1')
      expect(mockedGetAppointmentSeries).toHaveBeenCalledWith('appointment-1')
    })
  })

  describe('DELETE /api/appointments/[id]/series', () => {
    it('requires appointment role before cancelling an entire series', async () => {
      mockedCancelAppointmentSeries.mockResolvedValue({
        success: true,
        cancelled: 3,
      })

      const response = await appointmentSeriesDELETE(
        jsonRequest(
          '/api/appointments/appointment-1/series',
          { reason: 'Business closed' },
          'DELETE'
        ),
        {
          params: Promise.resolve({ id: 'appointment-1' }),
        }
      )

      expect(response.status).toBe(200)

      expect(mockedRequireAppointmentRole).toHaveBeenCalledWith('user-1', 'appointment-1', [
        'ADMIN',
        'MANAGER',
        'STAFF',
      ])

      expect(mockedCancelAppointmentSeries).toHaveBeenCalledWith(
        'appointment-1',
        'Business closed',
        'user-1'
      )
    })
  })
})
