import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { logApiError } from '@/lib/api/error-response'
import { reconcileCheckoutSession } from '@/lib/booking-protection/checkout'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/services/rate-limit'

const lookupSchema = z.object({
  confirmationNumber: z
    .string()
    .trim()
    .min(8)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/),
  customerEmail: z.string().trim().email().max(254),
  checkoutSessionId: z.string().trim().max(255).optional(),
})

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function GET(request: NextRequest) {
  try {
    const validation = lookupSchema.safeParse({
      confirmationNumber: request.nextUrl.searchParams.get('confirmationNumber') || '',
      customerEmail:
        request.nextUrl.searchParams.get('customerEmail') ||
        request.nextUrl.searchParams.get('email') ||
        '',
      checkoutSessionId: request.nextUrl.searchParams.get('sessionId') || undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid confirmation, email and payment session details are required',
        },
        { status: 400 }
      )
    }

    const rateLimit = await checkRateLimit(
      `booking-payment-status:${getClientIp(request)}:${validation.data.confirmationNumber.toLowerCase()}`,
      'booking:create'
    )
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many payment status checks. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 30) } }
      )
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: { startsWith: validation.data.confirmationNumber.toLowerCase() },
        customerEmail: validation.data.customerEmail.toLowerCase(),
      },
      select: {
        id: true,
        status: true,
        requiresDeposit: true,
        depositAmount: true,
        depositPaid: true,
        depositPaidAt: true,
        totalAmount: true,
        paymentStatus: true,
        payments: {
          where: { purpose: 'BOOKING_DEPOSIT' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            providerCheckoutSessionId: true,
            expiresAt: true,
            failureCode: true,
            failureMessage: true,
            paidAt: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const currentPayment = appointment.payments[0]
    const requestedSessionId = validation.data.checkoutSessionId
    if (
      requestedSessionId &&
      currentPayment?.providerCheckoutSessionId &&
      requestedSessionId !== currentPayment.providerCheckoutSessionId
    ) {
      return NextResponse.json(
        { success: false, error: 'Payment session not found' },
        { status: 404 }
      )
    }

    if (requestedSessionId && currentPayment?.providerCheckoutSessionId === requestedSessionId) {
      try {
        await reconcileCheckoutSession(requestedSessionId)
      } catch (error) {
        logApiError('booking-payment-reconciliation', error, { bookingId: appointment.id })
      }
    }

    const refreshed = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      select: {
        status: true,
        requiresDeposit: true,
        depositAmount: true,
        depositPaid: true,
        depositPaidAt: true,
        totalAmount: true,
        paymentStatus: true,
        payments: {
          where: { purpose: 'BOOKING_DEPOSIT' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            status: true,
            amount: true,
            expiresAt: true,
            failureCode: true,
            failureMessage: true,
            paidAt: true,
          },
        },
      },
    })

    if (!refreshed) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const payment = refreshed.payments[0]
    const depositAmount = refreshed.depositAmount === null ? null : Number(refreshed.depositAmount)
    const totalAmount = Number(refreshed.totalAmount)

    return NextResponse.json({
      success: true,
      data: {
        appointmentStatus: refreshed.status,
        paymentStatus: refreshed.paymentStatus,
        depositRequired: refreshed.requiresDeposit,
        depositPaid: refreshed.depositPaid,
        depositPaidAt: refreshed.depositPaidAt,
        depositAmount,
        remainingAmount:
          refreshed.depositPaid && depositAmount !== null
            ? Math.max(0, totalAmount - depositAmount)
            : totalAmount,
        checkoutStatus: payment?.status || null,
        checkoutExpiresAt: payment?.expiresAt || null,
        failureCode: payment?.failureCode || null,
        failureMessage: payment?.failureMessage || null,
      },
    })
  } catch (error) {
    logApiError('booking-payment-status-api', error, { area: 'booking' })
    return NextResponse.json(
      { success: false, error: 'Failed to check the booking payment status' },
      { status: 500 }
    )
  }
}
