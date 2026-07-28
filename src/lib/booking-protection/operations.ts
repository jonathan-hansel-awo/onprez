import { BookingPaymentStatus, BookingRefundStatus, PaymentStatus, Prisma } from '@prisma/client'
import type Stripe from 'stripe'

import { releaseCheckoutSession, settleCheckoutSession } from '@/lib/booking-protection/checkout'
import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe/config'

export type BookingDepositRefundResultStatus =
  | 'NOT_REQUIRED'
  | 'ALREADY_REFUNDED'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'

export interface BookingDepositRefundResult {
  status: BookingDepositRefundResultStatus
  paymentId?: string
  providerRefundId?: string | null
  refundableAmount: number
  refundedAmount: number
  error?: string
}

interface RequestBookingDepositRefundInput {
  appointmentId: string
  businessId: string
  requestedBy?: string
  reason: string
}

interface RecordRetainedDepositInput {
  appointmentId: string
  businessId: string
  retainedBy?: string
  reason: string
}

function stripeErrorCode(error: unknown): string {
  const value = error as { code?: unknown; raw?: { code?: unknown } }
  if (typeof value.code === 'string') return value.code
  if (typeof value.raw?.code === 'string') return value.raw.code
  return 'STRIPE_REFUND_FAILED'
}

function stripeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Stripe could not create the refund.'
}

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

function fromMinorUnits(amount: number): number {
  return amount / 100
}

function refundStatus(refund: Stripe.Refund): BookingRefundStatus {
  switch (String(refund.status)) {
    case 'succeeded':
      return BookingRefundStatus.SUCCEEDED
    case 'failed':
    case 'canceled':
      return BookingRefundStatus.FAILED
    default:
      return BookingRefundStatus.PENDING
  }
}

function refundFailureReason(refund: Stripe.Refund): string | null {
  const value = refund as Stripe.Refund & { failure_reason?: string | null }
  return value.failure_reason ?? null
}

function paymentIdFromRefund(refund: Stripe.Refund): string | null {
  const metadataId = refund.metadata?.onprezBookingPaymentId
  return metadataId || null
}

function paymentIntentIdFromRefund(refund: Stripe.Refund): string | null {
  const value = refund as Stripe.Refund & { payment_intent?: string | null }
  return typeof value.payment_intent === 'string' ? value.payment_intent : null
}

function targetRefundedAmount(refund: Stripe.Refund): number | null {
  const value = refund.metadata?.onprezRefundTargetTotalMinor
  if (!value) return null
  const minor = Number(value)
  return Number.isFinite(minor) && minor >= 0 ? fromMinorUnits(minor) : null
}

function paymentIntentBookingStatus(status: Stripe.PaymentIntent.Status): BookingPaymentStatus {
  switch (status) {
    case 'succeeded':
      return BookingPaymentStatus.SUCCEEDED
    case 'processing':
    case 'requires_capture':
    case 'requires_confirmation':
      return BookingPaymentStatus.PROCESSING
    case 'requires_action':
      return BookingPaymentStatus.REQUIRES_ACTION
    case 'canceled':
      return BookingPaymentStatus.CANCELLED
    case 'requires_payment_method':
    default:
      return BookingPaymentStatus.FAILED
  }
}

async function listAllPaymentIntentRefunds(
  paymentIntentId: string,
  providerAccountId: string
): Promise<Stripe.Refund[]> {
  const refunds: Stripe.Refund[] = []
  let startingAfter: string | undefined

  do {
    const page = await getStripeClient().refunds.list(
      {
        payment_intent: paymentIntentId,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      },
      { stripeAccount: providerAccountId }
    )
    refunds.push(...page.data)
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined
  } while (startingAfter)

  return refunds
}

async function reconcileStripeRefundCollection(
  payment: Awaited<ReturnType<typeof prisma.bookingPayment.findUnique>>,
  refunds: Stripe.Refund[],
  source: string
): Promise<void> {
  if (!payment) return

  const ordered = [...refunds].sort((left, right) => left.created - right.created)
  const latest = ordered.at(-1)
  const succeeded = ordered.filter(refund => refundStatus(refund) === BookingRefundStatus.SUCCEEDED)
  const refundedAmount = Math.min(
    Number(payment.amount),
    succeeded.reduce((total, refund) => total + fromMinorUnits(refund.amount), 0)
  )
  const fullyRefunded = refundedAmount >= Number(payment.amount)
  const hasPendingRefund = ordered.some(
    refund => refundStatus(refund) === BookingRefundStatus.PENDING
  )
  const hasFailedRefund = ordered.some(
    refund => refundStatus(refund) === BookingRefundStatus.FAILED
  )
  const collectionStatus = hasPendingRefund
    ? BookingRefundStatus.PENDING
    : hasFailedRefund && !fullyRefunded
      ? BookingRefundStatus.FAILED
      : refundedAmount > 0
        ? BookingRefundStatus.SUCCEEDED
        : BookingRefundStatus.NOT_REQUESTED
  const failedRefund = [...ordered]
    .reverse()
    .find(refund => refundStatus(refund) === BookingRefundStatus.FAILED)
  const now = new Date()

  await prisma.$transaction(async tx => {
    await tx.bookingPayment.update({
      where: { id: payment.id },
      data: {
        providerRefundId: latest?.id ?? null,
        refundedAmount,
        refundStatus: collectionStatus,
        status:
          refundedAmount > 0
            ? fullyRefunded
              ? BookingPaymentStatus.REFUNDED
              : BookingPaymentStatus.PARTIALLY_REFUNDED
            : undefined,
        refundedAt: refundedAmount > 0 ? now : null,
        refundFailureCode:
          collectionStatus === BookingRefundStatus.FAILED
            ? refundFailureReason(failedRefund!) || 'STRIPE_REFUND_FAILED'
            : null,
        refundFailureMessage:
          collectionStatus === BookingRefundStatus.FAILED
            ? 'Stripe reported that the booking deposit refund failed.'
            : null,
        lastReconciledAt: now,
        reconciliationSource: source,
      },
    })

    if (refundedAmount > 0) {
      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          paymentStatus: fullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_PAID,
        },
      })
    }
  })
}

export async function applyStripeRefund(refund: Stripe.Refund): Promise<boolean> {
  const bookingPaymentId = paymentIdFromRefund(refund)
  const paymentIntentId = paymentIntentIdFromRefund(refund)
  const payment = await prisma.bookingPayment.findFirst({
    where: {
      OR: [
        ...(bookingPaymentId ? [{ id: bookingPaymentId }] : []),
        { providerRefundId: refund.id },
        ...(paymentIntentId ? [{ providerPaymentIntentId: paymentIntentId }] : []),
      ],
    },
    include: { appointment: true },
  })

  if (!payment) {
    logger.warn('booking.refund.webhook_unmatched', {
      providerRefundId: refund.id,
      paymentIntentId,
      bookingPaymentId,
    })
    return false
  }

  const normalizedStatus = refundStatus(refund)
  const existingRefunded = Number(payment.refundedAmount)
  const refundAmount = fromMinorUnits(refund.amount)
  const targetAmount = targetRefundedAmount(refund)
  const refundedAmount = Math.min(
    Number(payment.amount),
    targetAmount ??
      (payment.providerRefundId === refund.id
        ? Math.max(existingRefunded, refundAmount)
        : existingRefunded + refundAmount)
  )
  const now = new Date()

  await prisma.$transaction(async tx => {
    const data: Prisma.BookingPaymentUpdateInput = {
      providerRefundId: refund.id,
      refundStatus: normalizedStatus,
      lastReconciledAt: now,
      reconciliationSource: 'STRIPE_WEBHOOK',
    }

    if (normalizedStatus === BookingRefundStatus.SUCCEEDED) {
      const fullyRefunded = refundedAmount >= Number(payment.amount)
      data.refundedAmount = refundedAmount
      data.refundedAt = now
      data.status = fullyRefunded
        ? BookingPaymentStatus.REFUNDED
        : BookingPaymentStatus.PARTIALLY_REFUNDED
      data.refundFailureCode = null
      data.refundFailureMessage = null
      data.retainedAt = null
      data.retainedReason = null
      data.retainedBy = null

      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          paymentStatus: fullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_PAID,
        },
      })
    } else if (normalizedStatus === BookingRefundStatus.FAILED) {
      data.refundFailureCode = refundFailureReason(refund) || 'STRIPE_REFUND_FAILED'
      data.refundFailureMessage = 'Stripe reported that the booking deposit refund failed.'
    }

    await tx.bookingPayment.update({ where: { id: payment.id }, data })
  })

  logger.info('booking.refund.reconciled', {
    bookingId: payment.appointmentId,
    paymentId: payment.id,
    providerRefundId: refund.id,
    refundStatus: normalizedStatus,
    refundedAmount,
  })
  return true
}

export async function requestBookingDepositRefund(
  input: RequestBookingDepositRefundInput
): Promise<BookingDepositRefundResult> {
  let payment = await prisma.bookingPayment.findFirst({
    where: {
      appointmentId: input.appointmentId,
      businessId: input.businessId,
      status: {
        in: [
          BookingPaymentStatus.SUCCEEDED,
          BookingPaymentStatus.PARTIALLY_REFUNDED,
          BookingPaymentStatus.REFUNDED,
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!payment?.providerAccountId || !payment.providerPaymentIntentId) {
    return { status: 'NOT_REQUIRED', refundableAmount: 0, refundedAmount: 0 }
  }

  if (payment.refundStatus === BookingRefundStatus.FAILED) {
    try {
      await reconcileBookingPayment(payment.id, 'PRE_REFUND_RETRY')
      const reconciledPayment = await prisma.bookingPayment.findFirst({
        where: { id: payment.id },
      })
      if (reconciledPayment) payment = reconciledPayment
    } catch (error) {
      return {
        status: 'FAILED',
        paymentId: payment.id,
        providerRefundId: payment.providerRefundId,
        refundableAmount: Math.max(0, Number(payment.amount) - Number(payment.refundedAmount)),
        refundedAmount: Number(payment.refundedAmount),
        error:
          error instanceof Error
            ? `Could not verify the previous refund outcome: ${error.message}`
            : 'Could not verify the previous refund outcome.',
      }
    }
  }

  if (!payment?.providerAccountId || !payment.providerPaymentIntentId) {
    return { status: 'NOT_REQUIRED', refundableAmount: 0, refundedAmount: 0 }
  }

  const amount = Number(payment.amount)
  const alreadyRefunded = Number(payment.refundedAmount)
  const refundableAmount = Math.max(0, amount - alreadyRefunded)

  if (refundableAmount <= 0 || payment.status === BookingPaymentStatus.REFUNDED) {
    return {
      status: 'ALREADY_REFUNDED',
      paymentId: payment.id,
      providerRefundId: payment.providerRefundId,
      refundableAmount: 0,
      refundedAmount: alreadyRefunded,
    }
  }

  if (payment.refundStatus === BookingRefundStatus.PENDING) {
    return {
      status: 'PENDING',
      paymentId: payment.id,
      providerRefundId: payment.providerRefundId,
      refundableAmount,
      refundedAmount: alreadyRefunded,
    }
  }

  const claimed = await prisma.bookingPayment.updateMany({
    where: {
      id: payment.id,
      refundStatus: {
        in: [BookingRefundStatus.NOT_REQUESTED, BookingRefundStatus.FAILED],
      },
    },
    data: {
      refundStatus: BookingRefundStatus.PENDING,
      refundReason: input.reason,
      refundRequestedAt: new Date(),
      refundRequestedBy: input.requestedBy,
      refundAttempt: { increment: 1 },
      refundFailureCode: null,
      refundFailureMessage: null,
      retainedAt: null,
      retainedReason: null,
      retainedBy: null,
    },
  })

  if (claimed.count === 0) {
    return {
      status: 'PENDING',
      paymentId: payment.id,
      providerRefundId: payment.providerRefundId,
      refundableAmount,
      refundedAmount: alreadyRefunded,
    }
  }

  try {
    const claimedPayment = await prisma.bookingPayment.findUniqueOrThrow({
      where: { id: payment.id },
    })
    const targetRefundedMinor = toMinorUnits(alreadyRefunded + refundableAmount)
    const refund = await getStripeClient().refunds.create(
      {
        payment_intent: payment.providerPaymentIntentId,
        amount: toMinorUnits(refundableAmount),
        reason: 'requested_by_customer',
        metadata: {
          onprezBookingPaymentId: payment.id,
          onprezAppointmentId: payment.appointmentId,
          onprezBusinessId: payment.businessId,
          onprezRefundReason: input.reason.slice(0, 500),
          onprezRefundTargetTotalMinor: String(targetRefundedMinor),
        },
      },
      {
        stripeAccount: payment.providerAccountId,
        idempotencyKey: `onprez-refund-${payment.id}-${targetRefundedMinor}-${claimedPayment.refundAttempt}`,
      }
    )

    await applyStripeRefund(refund)
    const normalizedStatus = refundStatus(refund)
    return {
      status:
        normalizedStatus === BookingRefundStatus.SUCCEEDED
          ? 'SUCCEEDED'
          : normalizedStatus === BookingRefundStatus.FAILED
            ? 'FAILED'
            : 'PENDING',
      paymentId: payment.id,
      providerRefundId: refund.id,
      refundableAmount,
      refundedAmount:
        normalizedStatus === BookingRefundStatus.SUCCEEDED
          ? alreadyRefunded + refundableAmount
          : alreadyRefunded,
      ...(normalizedStatus === BookingRefundStatus.FAILED
        ? { error: 'Stripe reported that the refund failed.' }
        : {}),
    }
  } catch (error) {
    const code = stripeErrorCode(error)
    const message = stripeErrorMessage(error)
    await prisma.bookingPayment.updateMany({
      where: { id: payment.id, refundStatus: BookingRefundStatus.PENDING },
      data: {
        refundStatus: BookingRefundStatus.FAILED,
        refundFailureCode: code,
        refundFailureMessage: message.slice(0, 1_000),
      },
    })

    logger.error('booking.refund.request_failed', {
      bookingId: payment.appointmentId,
      businessId: payment.businessId,
      paymentId: payment.id,
      errorCode: code,
      error: message,
    })
    return {
      status: 'FAILED',
      paymentId: payment.id,
      providerRefundId: payment.providerRefundId,
      refundableAmount,
      refundedAmount: alreadyRefunded,
      error: message,
    }
  }
}

export async function recordRetainedBookingDeposit(
  input: RecordRetainedDepositInput
): Promise<boolean> {
  const updated = await prisma.bookingPayment.updateMany({
    where: {
      appointmentId: input.appointmentId,
      businessId: input.businessId,
      status: {
        in: [BookingPaymentStatus.SUCCEEDED, BookingPaymentStatus.PARTIALLY_REFUNDED],
      },
      refundStatus: { not: BookingRefundStatus.PENDING },
    },
    data: {
      retainedAt: new Date(),
      retainedReason: input.reason,
      retainedBy: input.retainedBy,
    },
  })

  if (updated.count > 0) {
    logger.info('booking.deposit.retained', {
      bookingId: input.appointmentId,
      businessId: input.businessId,
      retainedBy: input.retainedBy,
      reason: input.reason,
    })
  }
  return updated.count > 0
}

export async function reconcileBookingPayment(
  paymentId: string,
  source = 'MANUAL'
): Promise<boolean> {
  let payment = await prisma.bookingPayment.findUnique({
    where: { id: paymentId },
    include: { appointment: true },
  })
  if (!payment?.providerAccountId) return false

  const stripe = getStripeClient()

  if (payment.providerCheckoutSessionId) {
    const session = await stripe.checkout.sessions.retrieve(
      payment.providerCheckoutSessionId,
      {},
      { stripeAccount: payment.providerAccountId }
    )

    if (session.payment_status === 'paid') await settleCheckoutSession(session)
    else if (session.status === 'expired') await releaseCheckoutSession(session)
  }

  payment = await prisma.bookingPayment.findUnique({
    where: { id: paymentId },
    include: { appointment: true },
  })
  if (!payment?.providerAccountId) return false

  if (payment.providerPaymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(
      payment.providerPaymentIntentId,
      { expand: ['latest_charge'] },
      { stripeAccount: payment.providerAccountId }
    )
    const latestChargeId =
      typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id
    const reconciledStatus = paymentIntentBookingStatus(intent.status)
    const paymentSucceeded = reconciledStatus === BookingPaymentStatus.SUCCEEDED
    const paymentFailed =
      reconciledStatus === BookingPaymentStatus.FAILED ||
      reconciledStatus === BookingPaymentStatus.CANCELLED

    await prisma.$transaction(async tx => {
      await tx.bookingPayment.update({
        where: { id: payment.id },
        data: {
          status: reconciledStatus,
          providerChargeId: latestChargeId || undefined,
          paidAt: paymentSucceeded ? payment.paidAt || new Date() : payment.paidAt,
          failedAt: paymentFailed ? payment.failedAt || new Date() : payment.failedAt,
          failureCode: paymentFailed ? `PAYMENT_INTENT_${intent.status.toUpperCase()}` : null,
          failureMessage: paymentFailed
            ? intent.last_payment_error?.message || `Stripe PaymentIntent is ${intent.status}.`
            : null,
          lastReconciledAt: new Date(),
          reconciliationSource: source,
        },
      })

      if (paymentSucceeded || (paymentFailed && !payment.appointment.depositPaid)) {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: paymentSucceeded
            ? {
                depositPaid: true,
                depositPaidAt: payment.appointment.depositPaidAt || new Date(),
                paymentStatus:
                  Number(payment.amount) >= Number(payment.appointment.totalAmount)
                    ? PaymentStatus.PAID
                    : PaymentStatus.PARTIALLY_PAID,
              }
            : { paymentStatus: PaymentStatus.FAILED },
        })
      }
    })

    const refunds = await listAllPaymentIntentRefunds(
      payment.providerPaymentIntentId,
      payment.providerAccountId
    )
    await reconcileStripeRefundCollection(payment, refunds, source)
  } else {
    await prisma.bookingPayment.update({
      where: { id: payment.id },
      data: { lastReconciledAt: new Date(), reconciliationSource: source },
    })
  }

  logger.info('booking.payment.reconciled', {
    bookingId: payment.appointmentId,
    businessId: payment.businessId,
    paymentId: payment.id,
    source,
  })
  return true
}

export async function reconcileBookingPaymentByPaymentIntent(
  paymentIntentId: string,
  source: string
): Promise<boolean> {
  const payment = await prisma.bookingPayment.findUnique({
    where: { providerPaymentIntentId: paymentIntentId },
  })
  return payment ? reconcileBookingPayment(payment.id, source) : false
}
