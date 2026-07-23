import { AppointmentStatus, BookingPaymentStatus, PaymentStatus, Prisma } from '@prisma/client'
import type Stripe from 'stripe'

import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
import { sendBookingCreatedNotifications } from '@/lib/services/booking-notifications'
import { getStripeClient } from '@/lib/stripe/config'

export const BOOKING_CHECKOUT_RESERVATION_MINUTES = 30

interface CreateBookingDepositCheckoutInput {
  appointmentId: string
  businessId: string
  businessName: string
  businessHandle: string
  serviceName: string
  customerEmail: string
  amount: number
  currency: string
  providerAccountId: string
  targetStatus: 'PENDING' | 'CONFIRMED'
  policyVersion: string
  policyAcceptedAt: Date
  policySnapshot: Prisma.InputJsonValue
  origin: string
  idempotencyKey?: string
}

interface CheckoutResult {
  checkoutUrl: string
  checkoutSessionId: string
  expiresAt: Date
  replayed: boolean
}

interface PaymentMetadata {
  targetStatus?: AppointmentStatus
}

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

function readPaymentMetadata(value: Prisma.JsonValue | null): PaymentMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as unknown as PaymentMetadata
}

function checkoutUrls(origin: string, businessHandle: string, appointmentId: string) {
  const safeOrigin = new URL(origin).origin
  const confirmation = appointmentId.slice(0, 8).toUpperCase()
  const base = `${safeOrigin}/${encodeURIComponent(businessHandle)}/book/success`

  return {
    successUrl: `${base}?confirmation=${confirmation}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}?confirmation=${confirmation}&payment=cancelled`,
  }
}

export async function createBookingDepositCheckout(
  input: CreateBookingDepositCheckoutInput
): Promise<CheckoutResult> {
  const now = new Date()
  const existing = await prisma.bookingPayment.findFirst({
    where: { appointmentId: input.appointmentId, purpose: 'BOOKING_DEPOSIT' },
    orderBy: { createdAt: 'desc' },
  })

  if (
    existing?.status === BookingPaymentStatus.PENDING &&
    existing.providerCheckoutUrl &&
    existing.providerCheckoutSessionId &&
    existing.expiresAt &&
    existing.expiresAt > now
  ) {
    return {
      checkoutUrl: existing.providerCheckoutUrl,
      checkoutSessionId: existing.providerCheckoutSessionId,
      expiresAt: existing.expiresAt,
      replayed: true,
    }
  }

  const payment = await prisma.bookingPayment.create({
    data: {
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      providerAccountId: input.providerAccountId,
      idempotencyKey: `booking-deposit:${input.idempotencyKey || input.appointmentId}`,
      policyVersion: input.policyVersion,
      policyAcceptedAt: input.policyAcceptedAt,
      policySnapshot: input.policySnapshot,
      metadata: { targetStatus: input.targetStatus },
    },
  })

  const expiresAt = new Date(Date.now() + BOOKING_CHECKOUT_RESERVATION_MINUTES * 60_000)
  const { successUrl, cancelUrl } = checkoutUrls(
    input.origin,
    input.businessHandle,
    input.appointmentId
  )

  try {
    const session = await getStripeClient().checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: input.customerEmail,
        client_reference_id: input.appointmentId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: toMinorUnits(input.amount),
              product_data: {
                name: `Booking deposit – ${input.serviceName}`,
                description: `Deducted from the remaining balance at ${input.businessName}`,
              },
            },
          },
        ],
        metadata: {
          onprezBookingPaymentId: payment.id,
          onprezAppointmentId: input.appointmentId,
          onprezBusinessId: input.businessId,
        },
        payment_intent_data: {
          metadata: {
            onprezBookingPaymentId: payment.id,
            onprezAppointmentId: input.appointmentId,
            onprezBusinessId: input.businessId,
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
      },
      {
        stripeAccount: input.providerAccountId,
        idempotencyKey: `onprez-checkout-${payment.id}`,
      }
    )

    if (!session.url) throw new Error('Stripe Checkout did not return a redirect URL')

    await prisma.bookingPayment.update({
      where: { id: payment.id },
      data: {
        providerCheckoutSessionId: session.id,
        providerCheckoutUrl: session.url,
        expiresAt,
      },
    })

    return {
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
      expiresAt,
      replayed: false,
    }
  } catch (error) {
    const failedAt = new Date()
    const message = error instanceof Error ? error.message : 'Stripe Checkout creation failed'

    await prisma.$transaction(async tx => {
      await tx.bookingPayment.update({
        where: { id: payment.id },
        data: {
          status: BookingPaymentStatus.FAILED,
          failedAt,
          failureCode: 'PAYMENT_CHECKOUT_INITIALIZATION_FAILED',
          failureMessage: message,
        },
      })
      await tx.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          previousStatus: AppointmentStatus.PENDING,
          cancelledAt: failedAt,
          cancellationSource: 'SYSTEM',
          cancellationReason: 'PAYMENT_CHECKOUT_INITIALIZATION_FAILED',
          paymentStatus: PaymentStatus.FAILED,
        },
      })
      await tx.appointmentStatusTransition.create({
        data: {
          appointmentId: input.appointmentId,
          businessId: input.businessId,
          fromStatus: AppointmentStatus.PENDING,
          toStatus: AppointmentStatus.CANCELLED,
          changedByType: 'SYSTEM',
          reason: 'PAYMENT_CHECKOUT_INITIALIZATION_FAILED',
          metadata: { bookingPaymentId: payment.id },
        },
      })
    })

    throw error
  }
}

async function sendPaymentConfirmedNotifications(paymentId: string) {
  const payment = await prisma.bookingPayment.findUnique({
    where: { id: paymentId },
    include: {
      appointment: {
        include: {
          service: true,
          customer: true,
          business: {
            select: {
              name: true,
              email: true,
              address: true,
              timezone: true,
              owner: { select: { email: true } },
            },
          },
        },
      },
    },
  })

  if (!payment || payment.notificationSentAt) return

  const appointment = payment.appointment
  const notifications = await sendBookingCreatedNotifications({
    bookingId: appointment.id,
    status: appointment.status,
    customerName: appointment.customer.name,
    customerEmail: appointment.customer.email,
    customerPhone: appointment.customerPhone,
    customerNotes: appointment.customerNotes,
    businessName: appointment.business.name,
    businessEmail: appointment.business.email,
    businessOwnerEmail: appointment.business.owner.email,
    businessAddress: appointment.business.address,
    serviceName: appointment.service.name,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    timezone: appointment.business.timezone,
    totalAmount: Number(appointment.totalAmount),
    currency: appointment.service.currency,
    depositPaid: Number(payment.amount),
    remainingAmount: Math.max(0, Number(appointment.totalAmount) - Number(payment.amount)),
  })

  await prisma.bookingPayment.updateMany({
    where: { id: payment.id, notificationSentAt: null },
    data: { notificationSentAt: new Date() },
  })

  logger[notifications.customer.success && notifications.business.success ? 'info' : 'warn'](
    'booking.payment.notifications_completed',
    {
      bookingId: appointment.id,
      paymentId,
      customerSent: notifications.customer.success,
      businessSent: notifications.business.success,
    }
  )
}

export async function settleCheckoutSession(session: Stripe.Checkout.Session): Promise<boolean> {
  const payment = await prisma.bookingPayment.findUnique({
    where: { providerCheckoutSessionId: session.id },
    include: { appointment: true },
  })

  if (!payment) {
    logger.warn('booking.payment.webhook_unmatched', { checkoutSessionId: session.id })
    return false
  }

  if (session.payment_status !== 'paid') {
    await prisma.bookingPayment.updateMany({
      where: { id: payment.id, status: BookingPaymentStatus.PENDING },
      data: { status: BookingPaymentStatus.PROCESSING },
    })
    return false
  }

  const metadata = readPaymentMetadata(payment.metadata)
  const targetStatus =
    metadata.targetStatus === AppointmentStatus.PENDING
      ? AppointmentStatus.PENDING
      : AppointmentStatus.CONFIRMED
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  const amount = Number(payment.amount)
  const total = Number(payment.appointment.totalAmount)
  const now = new Date()

  const firstSettlement = await prisma.$transaction(async tx => {
    const updated = await tx.bookingPayment.updateMany({
      where: {
        id: payment.id,
        status: {
          in: [
            BookingPaymentStatus.PENDING,
            BookingPaymentStatus.PROCESSING,
            BookingPaymentStatus.REQUIRES_ACTION,
          ],
        },
      },
      data: {
        status: BookingPaymentStatus.SUCCEEDED,
        providerPaymentIntentId: paymentIntentId || undefined,
        providerCheckoutUrl: null,
        paidAt: now,
        failureCode: null,
        failureMessage: null,
      },
    })

    if (updated.count === 0) return false

    await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: {
        status: targetStatus,
        previousStatus:
          targetStatus === AppointmentStatus.CONFIRMED ? AppointmentStatus.PENDING : undefined,
        confirmedAt: targetStatus === AppointmentStatus.CONFIRMED ? now : null,
        depositPaid: true,
        depositPaidAt: now,
        paymentStatus: amount >= total ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID,
        paidAt: amount >= total ? now : null,
      },
    })

    await tx.customer.updateMany({
      where: { id: payment.appointment.customerId, firstBookingAt: null },
      data: { firstBookingAt: now },
    })
    await tx.customer.update({
      where: { id: payment.appointment.customerId },
      data: { totalBookings: { increment: 1 }, lastBookingAt: now },
    })

    if (targetStatus === AppointmentStatus.CONFIRMED) {
      await tx.appointmentStatusTransition.create({
        data: {
          appointmentId: payment.appointmentId,
          businessId: payment.businessId,
          fromStatus: AppointmentStatus.PENDING,
          toStatus: AppointmentStatus.CONFIRMED,
          changedByType: 'SYSTEM',
          reason: 'BOOKING_DEPOSIT_PAID',
          metadata: { bookingPaymentId: payment.id, checkoutSessionId: session.id },
        },
      })
    }

    return true
  })

  if (firstSettlement) await sendPaymentConfirmedNotifications(payment.id)
  return firstSettlement
}

export async function releaseCheckoutSession(
  session: Stripe.Checkout.Session,
  reason = 'PAYMENT_CHECKOUT_EXPIRED'
): Promise<boolean> {
  const payment = await prisma.bookingPayment.findUnique({
    where: { providerCheckoutSessionId: session.id },
    include: { appointment: true },
  })

  if (!payment || payment.status === BookingPaymentStatus.SUCCEEDED) return false
  const now = new Date()

  return prisma.$transaction(async tx => {
    const updated = await tx.bookingPayment.updateMany({
      where: {
        id: payment.id,
        status: {
          in: [
            BookingPaymentStatus.PENDING,
            BookingPaymentStatus.PROCESSING,
            BookingPaymentStatus.REQUIRES_ACTION,
          ],
        },
      },
      data: {
        status:
          reason === 'PAYMENT_FAILED'
            ? BookingPaymentStatus.FAILED
            : BookingPaymentStatus.CANCELLED,
        providerCheckoutUrl: null,
        failedAt: now,
        failureCode: reason,
        failureMessage:
          reason === 'PAYMENT_FAILED'
            ? 'Stripe could not complete the booking deposit payment.'
            : 'The payment session expired before the deposit was paid.',
      },
    })

    if (updated.count === 0) return false

    if (
      payment.appointment.status === AppointmentStatus.PENDING &&
      !payment.appointment.depositPaid
    ) {
      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          previousStatus: AppointmentStatus.PENDING,
          cancelledAt: now,
          cancellationSource: 'SYSTEM',
          cancellationReason: reason,
          paymentStatus: PaymentStatus.FAILED,
        },
      })
      await tx.appointmentStatusTransition.create({
        data: {
          appointmentId: payment.appointmentId,
          businessId: payment.businessId,
          fromStatus: AppointmentStatus.PENDING,
          toStatus: AppointmentStatus.CANCELLED,
          changedByType: 'SYSTEM',
          reason,
          metadata: { bookingPaymentId: payment.id, checkoutSessionId: session.id },
        },
      })
    }

    return true
  })
}

export async function reconcileCheckoutSession(
  checkoutSessionId: string
): Promise<Stripe.Checkout.Session | null> {
  const payment = await prisma.bookingPayment.findUnique({
    where: { providerCheckoutSessionId: checkoutSessionId },
  })

  if (!payment?.providerAccountId) return null

  const session = await getStripeClient().checkout.sessions.retrieve(
    checkoutSessionId,
    {},
    { stripeAccount: payment.providerAccountId }
  )

  if (session.payment_status === 'paid') await settleCheckoutSession(session)
  if (session.status === 'expired') await releaseCheckoutSession(session)
  return session
}
