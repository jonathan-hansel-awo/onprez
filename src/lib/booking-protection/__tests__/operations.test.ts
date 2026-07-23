/** @jest-environment node */

import { BookingPaymentStatus, BookingRefundStatus, PaymentStatus } from '@prisma/client'

import {
  applyStripeRefund,
  reconcileBookingPayment,
  recordRetainedBookingDeposit,
  requestBookingDepositRefund,
} from '@/lib/booking-protection/operations'
import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe/config'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    bookingPayment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    appointment: { update: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/lib/stripe/config', () => ({ getStripeClient: jest.fn() }))
jest.mock('@/lib/booking-protection/checkout', () => ({
  settleCheckoutSession: jest.fn(),
  releaseCheckoutSession: jest.fn(),
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const mockedPrisma = prisma as unknown as {
  bookingPayment: {
    findFirst: jest.Mock
    findUnique: jest.Mock
    findUniqueOrThrow: jest.Mock
    update: jest.Mock
    updateMany: jest.Mock
  }
  appointment: { update: jest.Mock }
  $transaction: jest.Mock
}
const mockedGetStripe = getStripeClient as jest.Mock
const refundsCreate = jest.fn()
const refundsList = jest.fn()
const retrieveIntent = jest.fn()
const retrieveSession = jest.fn()

const payment = {
  id: 'payment-1',
  appointmentId: 'appointment-1',
  businessId: 'business-1',
  providerAccountId: 'acct_1',
  providerPaymentIntentId: 'pi_1',
  providerCheckoutSessionId: 'cs_1',
  providerRefundId: null,
  amount: 10,
  refundedAmount: 0,
  status: BookingPaymentStatus.SUCCEEDED,
  refundStatus: BookingRefundStatus.NOT_REQUESTED,
  refundAttempt: 0,
  policySnapshot: { cancellationWindowHours: 24 },
}

describe('Booking Protection operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetStripe.mockReturnValue({
      refunds: { create: refundsCreate, list: refundsList },
      paymentIntents: { retrieve: retrieveIntent },
      checkout: { sessions: { retrieve: retrieveSession } },
    })
    mockedPrisma.$transaction.mockImplementation(async callback =>
      callback({
        bookingPayment: { update: mockedPrisma.bookingPayment.update },
        appointment: { update: mockedPrisma.appointment.update },
      })
    )
    mockedPrisma.bookingPayment.findFirst.mockResolvedValue(payment)
    mockedPrisma.bookingPayment.updateMany.mockResolvedValue({ count: 1 })
    mockedPrisma.bookingPayment.findUniqueOrThrow.mockResolvedValue({
      ...payment,
      refundAttempt: 1,
    })
    mockedPrisma.bookingPayment.update.mockResolvedValue(payment)
  })

  it('creates a connected-account refund with an idempotency key and records success', async () => {
    refundsCreate.mockResolvedValue({
      id: 're_1',
      status: 'succeeded',
      amount: 1000,
      payment_intent: 'pi_1',
      metadata: {
        onprezBookingPaymentId: 'payment-1',
        onprezRefundTargetTotalMinor: '1000',
      },
    })
    mockedPrisma.bookingPayment.findFirst
      .mockResolvedValueOnce(payment)
      .mockResolvedValueOnce({ ...payment, appointment: { id: 'appointment-1' } })

    const result = await requestBookingDepositRefund({
      appointmentId: 'appointment-1',
      businessId: 'business-1',
      requestedBy: 'user-1',
      reason: 'Business unavailable',
    })

    expect(result.status).toBe('SUCCEEDED')
    expect(refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_1', amount: 1000 }),
      expect.objectContaining({
        stripeAccount: 'acct_1',
        idempotencyKey: 'onprez-refund-payment-1-1000-1',
      })
    )
  })

  it('records a failed Stripe refund without reopening the appointment', async () => {
    refundsCreate.mockRejectedValue(
      Object.assign(new Error('Stripe unavailable'), { code: 'api_error' })
    )

    const result = await requestBookingDepositRefund({
      appointmentId: 'appointment-1',
      businessId: 'business-1',
      reason: 'Customer cancellation',
    })

    expect(result.status).toBe('FAILED')
    expect(mockedPrisma.bookingPayment.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          refundStatus: BookingRefundStatus.FAILED,
          refundFailureCode: 'api_error',
        }),
      })
    )
  })

  it('applies cumulative refund totals idempotently', async () => {
    mockedPrisma.bookingPayment.findFirst.mockResolvedValue({
      ...payment,
      providerRefundId: 're_1',
      refundedAmount: 4,
      appointment: { id: 'appointment-1' },
    })

    await applyStripeRefund({
      id: 're_1',
      status: 'succeeded',
      amount: 400,
      payment_intent: 'pi_1',
      metadata: {},
    } as never)

    expect(mockedPrisma.bookingPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ refundedAmount: 4 }),
      })
    )
    expect(mockedPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { paymentStatus: PaymentStatus.PARTIALLY_PAID },
      })
    )
  })

  it('records retained deposits explicitly', async () => {
    await expect(
      recordRetainedBookingDeposit({
        appointmentId: 'appointment-1',
        businessId: 'business-1',
        retainedBy: 'user-1',
        reason: 'Late cancellation',
      })
    ).resolves.toBe(true)

    expect(mockedPrisma.bookingPayment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ retainedReason: 'Late cancellation' }),
      })
    )
  })

  it('reconciles Checkout, PaymentIntent, charge and refunds from Stripe', async () => {
    mockedPrisma.bookingPayment.findUnique
      .mockResolvedValueOnce(payment)
      .mockResolvedValueOnce(payment)
    retrieveSession.mockResolvedValue({ id: 'cs_1', payment_status: 'unpaid', status: 'open' })
    retrieveIntent.mockResolvedValue({ id: 'pi_1', latest_charge: { id: 'ch_1' } })
    refundsList.mockResolvedValue({ data: [] })

    await expect(reconcileBookingPayment('payment-1', 'TEST')).resolves.toBe(true)

    expect(retrieveSession).toHaveBeenCalledWith('cs_1', {}, { stripeAccount: 'acct_1' })
    expect(retrieveIntent).toHaveBeenCalledWith(
      'pi_1',
      { expand: ['latest_charge'] },
      { stripeAccount: 'acct_1' }
    )
    expect(mockedPrisma.bookingPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerChargeId: 'ch_1',
          reconciliationSource: 'TEST',
        }),
      })
    )
  })
})
