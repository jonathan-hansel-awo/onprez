import { prisma } from '@/lib/prisma'
import { sendAppointmentStatusEmail } from '@/lib/services/email'
import {
  AppointmentTransitionError,
  VALID_APPOINTMENT_TRANSITIONS,
  transitionAppointment,
} from '@/lib/services/appointment-state'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/services/email', () => ({
  sendAppointmentStatusEmail: jest.fn(),
}))

const mockedTransaction = prisma.$transaction as jest.Mock
const mockedSendStatusEmail = sendAppointmentStatusEmail as jest.Mock

function createTransaction(status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' = 'PENDING') {
  const current = {
    id: 'appointment-1',
    businessId: 'business-1',
    customerId: 'customer-1',
    status,
    businessNotes: null,
    totalAmount: 25,
  }
  const appointment = {
    ...current,
    status: status === 'PENDING' ? 'CONFIRMED' : 'COMPLETED',
    previousStatus: status,
    customerName: 'Alex Customer',
    customerEmail: 'alex@example.com',
    startTime: new Date('2030-07-15T09:00:00.000Z'),
    service: { name: 'Consultation' },
    customer: { id: 'customer-1' },
    business: { name: 'OnPrez Salon', timezone: 'Europe/London' },
  }
  const tx = {
    appointment: {
      findFirst: jest.fn().mockResolvedValue(current),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(appointment),
    },
    customer: { update: jest.fn().mockResolvedValue({}) },
    appointmentStatusTransition: { create: jest.fn().mockResolvedValue({}) },
  }

  mockedTransaction.mockImplementation(async callback => callback(tx))
  return { tx, current, appointment }
}

describe('appointment state machine', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedSendStatusEmail.mockResolvedValue({ success: true })
  })

  it('defines terminal states and permits only the documented transitions', () => {
    expect(VALID_APPOINTMENT_TRANSITIONS).toEqual({
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
      RESCHEDULED: [],
      CANCELLED: [],
      COMPLETED: [],
      NO_SHOW: [],
    })
  })

  it('rejects COMPLETED to PENDING without mutating or auditing', async () => {
    const { tx } = createTransaction('COMPLETED')

    await expect(
      transitionAppointment({
        appointmentId: 'appointment-1',
        businessId: 'business-1',
        toStatus: 'PENDING',
        changedBy: 'user-1',
        changedByType: 'USER',
      })
    ).rejects.toEqual(
      expect.objectContaining<Partial<AppointmentTransitionError>>({
        code: 'INVALID_TRANSITION',
      })
    )

    expect(tx.appointment.updateMany).not.toHaveBeenCalled()
    expect(tx.appointmentStatusTransition.create).not.toHaveBeenCalled()
    expect(mockedSendStatusEmail).not.toHaveBeenCalled()
  })

  it('updates state and records the actor and timestamp in one transaction', async () => {
    const { tx } = createTransaction('PENDING')

    const result = await transitionAppointment({
      appointmentId: 'appointment-1',
      businessId: 'business-1',
      toStatus: 'CONFIRMED',
      changedBy: 'user-1',
      changedByType: 'USER',
      reason: 'Approved by manager',
    })

    expect(tx.appointment.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'appointment-1',
        businessId: 'business-1',
        status: 'PENDING',
      },
      data: expect.objectContaining({
        status: 'CONFIRMED',
        previousStatus: 'PENDING',
        confirmedBy: 'user-1',
        confirmedAt: expect.any(Date),
      }),
    })
    expect(tx.appointmentStatusTransition.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointmentId: 'appointment-1',
        businessId: 'business-1',
        fromStatus: 'PENDING',
        toStatus: 'CONFIRMED',
        changedBy: 'user-1',
        changedByType: 'USER',
        changedAt: result.changedAt,
      }),
    })
  })

  it('sends email only after a successful transition and names the actual states', async () => {
    createTransaction('PENDING')

    await transitionAppointment({
      appointmentId: 'appointment-1',
      businessId: 'business-1',
      toStatus: 'CONFIRMED',
      changedBy: 'user-1',
      changedByType: 'USER',
      notifyCustomer: true,
    })

    expect(mockedSendStatusEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alex@example.com',
        fromStatus: 'PENDING',
        toStatus: 'CONFIRMED',
        timezone: 'Europe/London',
      })
    )
  })

  it('rejects a concurrent status change before creating an audit record', async () => {
    const { tx } = createTransaction('PENDING')
    tx.appointment.updateMany.mockResolvedValue({ count: 0 })

    await expect(
      transitionAppointment({
        appointmentId: 'appointment-1',
        businessId: 'business-1',
        toStatus: 'CONFIRMED',
        changedByType: 'SYSTEM',
      })
    ).rejects.toEqual(expect.objectContaining({ code: 'CONCURRENT_UPDATE' }))

    expect(tx.appointmentStatusTransition.create).not.toHaveBeenCalled()
  })
})
