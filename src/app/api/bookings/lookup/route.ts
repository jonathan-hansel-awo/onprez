import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { logApiError } from '@/lib/api/error-response'
import { withRequestLogging } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/services/rate-limit'

const confirmationLookupSchema = z.object({
  confirmationNumber: z
    .string()
    .trim()
    .min(8)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/),
  customerEmail: z.string().trim().email().max(254),
})

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

async function handlePost(request: NextRequest) {
  try {
    const validation = confirmationLookupSchema.safeParse(await request.json())

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Confirmation number and customer email are required' },
        { status: 400 }
      )
    }

    const confirmationNumber = validation.data.confirmationNumber.toLowerCase()
    const customerEmail = validation.data.customerEmail.toLowerCase()
    const rateLimit = await checkRateLimit(
      `booking-lookup:${getClientIp(request)}:${confirmationNumber}`,
      'booking:create'
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many booking lookups. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 30) } }
      )
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: { startsWith: confirmationNumber }, customerEmail },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        duration: true,
        customerNotes: true,
        requiresDeposit: true,
        depositAmount: true,
        depositPaid: true,
        depositPaidAt: true,
        paymentStatus: true,
        createdAt: true,
        service: { select: { name: true, price: true, duration: true, currency: true } },
        customer: { select: { name: true, email: true } },
        business: { select: { name: true, timezone: true, address: true, slug: true } },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        confirmationNumber: appointment.id.slice(0, 8).toUpperCase(),
        status: appointment.status,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration: appointment.duration,
        service: {
          name: appointment.service.name,
          price: Number(appointment.service.price),
          duration: appointment.service.duration,
        },
        customer: {
          name: appointment.customer.name,
          email: appointment.customer.email,
        },
        business: {
          name: appointment.business.name,
          timezone: appointment.business.timezone,
          address: appointment.business.address,
          ...(appointment.business.slug && { slug: appointment.business.slug }),
        },
        notes: appointment.customerNotes,
        createdAt: appointment.createdAt,
        payment: {
          requiresDeposit: Boolean(appointment.requiresDeposit),
          depositAmount:
            appointment.depositAmount === null ? null : Number(appointment.depositAmount),
          depositPaid: Boolean(appointment.depositPaid),
          depositPaidAt: appointment.depositPaidAt || null,
          status: appointment.paymentStatus || 'UNPAID',
          remainingAmount:
            appointment.depositPaid && appointment.depositAmount !== null
              ? Math.max(0, Number(appointment.service.price) - Number(appointment.depositAmount))
              : Number(appointment.service.price),
        },
      },
    })
  } catch (error) {
    logApiError('booking-lookup-api', error, { area: 'booking' })
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 })
  }
}

export function POST(request: NextRequest) {
  return withRequestLogging(request, () => handlePost(request))
}
