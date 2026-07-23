/** @jest-environment node */

import { AppointmentStatus, BookingPaymentStatus, PaymentStatus } from '@prisma/client'

import {
  createBookingDepositCheckout,
  releaseCheckoutSession,
  settleCheckoutSession,
} from '@/lib/booking-protection/checkout'
import { prisma } from '@/lib/prisma'
import { sendBookingCreatedNotifications } from '@/lib/services/booking-notifications'
import { getStripeClient } from '@/lib/stripe/config'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    bookingPayment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    appointment: { update: jest.fn() },
    appointmentStatusTransition: { create: jest.fn() },
    customer: { update: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/lib/stripe/config', () => ({ getStripeClient: jest.fn() }))
jest.mock('@/lib/services/booking-notifications', () => ({
  sendBookingCreatedNotifications: jest.fn(),
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const mockedPrisma = prisma as unknown as {
  bookingPayment: Record<string, jest.Mock>
  appointment: Record<string, jest.Mock>
  appointmentStatusTransition: Record<string, jest.Mock>
  customer: Record<string, jest.Mock>
  $transaction: jest.Mock
}
const mockedStripe = getStripeClient as jest.Mock
const mockedNotifications = sendBookingCreatedNotifications as jest.Mock
const checkoutCreate = jest.fn()

const appointment = {
  id: 'appointment-1',
  businessId: 'business-1',
  customerId: 'customer-1',
  status: AppointmentStatus.PENDING,
  depositPaid: false,
  totalAmount: 60,
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test',
    payment_status: 'paid',
    payment_intent: 'pi_test',
    status: 'complete',
    ...overrides,
  } as never
}

describe('booking deposit Checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedStripe.mockReturnValue({ checkout: { sessions: { create: checkoutCreate } } })
    mockedPrisma.$transaction.mockImplementation(async (callback: unknown) => {
      if (typeof callback !== 'function') return callback
      return callback({
        bookingPayment: mockedPrisma.bookingPayment,
        appointment: mockedPrisma.appointment,
        appointmentStatusTransition: mockedPrisma.appointmentStatusTransition,
        customer: mockedPrisma.customer,
      })
    })
    mockedNotifications.mockResolvedValue({
      customer: { success: true },
      business: { success: true },
    })
  })

  it('creates a direct-charge Checkout Session on the connected account', async () => {
    mockedPrisma.bookingPayment.findFirst.mockResolvedValue(null)
    mockedPrisma.bookingPayment.create.mockResolvedValue({ id: 'payment-1' })
    checkoutCreate.mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.test/cs_test' })

    const result = await createBookingDepositCheckout({
      appointmentId: 'appointment-1',
      businessId: 'business-1',
      businessName: 'Studio',
      businessHandle: 'studio',
      serviceName: 'Soft Glam',
      customerEmail: 'customer@example.com',
      amount: 10,
      currency: 'GBP',
      providerAccountId: 'acct_test',
      targetStatus: AppointmentStatus.CONFIRMED,
      policyVersion: 'booking-deposit-v1',
      policyAcceptedAt: new Date('2026-07-23T10:00:00.000Z'),
      policySnapshot: { cancellationWindowHours: 24 },
      origin: 'https://onprez.test',
      idempotencyKey: 'booking_key_1234567890',
    })

    expect(result.checkoutUrl).toBe('https://checkout.stripe.test/cs_test')
    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ currency: 'gbp', unit_amount: 1000 }),
          }),
        ],
      }),
      expect.objectContaining({ stripeAccount: 'acct_test' })
    )
  })

  it('settles a paid deposit once and confirms the reserved appointment', async () => {
    mockedPrisma.bookingPayment.findUnique
      .mockResolvedValueOnce({
        id: 'payment-1',
        businessId: 'business-1',
        appointmentId: 'appointment-1',
        amount: 10,
        metadata: { targetStatus: AppointmentStatus.CONFIRMED },
        appointment,
      })
      .mockResolvedValueOnce({
        id: 'payment-1',
        amount: 10,
        notificationSentAt: null,
        appointment: {
          ...appointment,
          status: AppointmentStatus.CONFIRMED,
          customerPhone: null,
          customerNotes: null,
          startTime: new Date(),
          endTime: new Date(),
          service: { name: 'Soft Glam', currency: 'GBP' },
          customer: { name: 'Customer', email: 'customer@example.com' },
          business: {
            name: 'Studio',
            email: 'studio@example.com',
            address: null,
            timezone: 'Europe/London',
            owner: { email: 'owner@example.com' },
          },
        },
      })
    mockedPrisma.bookingPayment.updateMany.mockResolvedValue({ count: 1 })

    const changed = await settleCheckoutSession(session())

    expect(changed).toBe(true)
    expect(mockedPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: AppointmentStatus.CONFIRMED,
          depositPaid: true,
          paymentStatus: PaymentStatus.PARTIALLY_PAID,
        }),
      })
    )
    expect(mockedPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalBookings: { increment: 1 } }),
      })
    )
    expect(mockedNotifications).toHaveBeenCalled()
  })

  it('keeps approval-required appointments pending after the deposit succeeds', async () => {
    mockedPrisma.bookingPayment.findUnique
      .mockResolvedValueOnce({
        id: 'payment-1',
        businessId: 'business-1',
        appointmentId: 'appointment-1',
        amount: 10,
        metadata: { targetStatus: AppointmentStatus.PENDING },
        appointment,
      })
      .mockResolvedValueOnce(null)
    mockedPrisma.bookingPayment.updateMany.mockResolvedValue({ count: 1 })

    await settleCheckoutSession(session())

    expect(mockedPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: AppointmentStatus.PENDING }),
      })
    )
    expect(mockedPrisma.appointmentStatusTransition.create).not.toHaveBeenCalled()
  })

  it('cancels and releases an unpaid reservation when Checkout expires', async () => {
    mockedPrisma.bookingPayment.findUnique.mockResolvedValue({
      id: 'payment-1',
      businessId: 'business-1',
      appointmentId: 'appointment-1',
      status: BookingPaymentStatus.PENDING,
      appointment,
    })
    mockedPrisma.bookingPayment.updateMany.mockResolvedValue({ count: 1 })

    const changed = await releaseCheckoutSession(
      session({ payment_status: 'unpaid', status: 'expired' })
    )

    expect(changed).toBe(true)
    expect(mockedPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: AppointmentStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        }),
      })
    )
  })
})
