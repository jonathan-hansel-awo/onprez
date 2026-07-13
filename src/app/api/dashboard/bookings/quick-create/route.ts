import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { createBooking } from '@/lib/services/booking'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { z } from 'zod'

const quickCreateSchema = z
  .object({
    serviceId: z.string().cuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    customerId: z.string().cuid().optional(),
    customerName: z.string().min(1).max(100).optional(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().max(20).optional(),
    customerNotes: z.string().max(1000).optional(),
    businessNotes: z.string().max(1000).optional(),
    sendConfirmation: z.boolean().default(true),
  })
  .refine(data => data.customerId || (data.customerName && data.customerEmail), {
    message: 'Either customerId or customer name and email are required',
  })

export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get('idempotency-key')?.trim()
    if (idempotencyKey && !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Idempotency-Key header' },
        { status: 400 }
      )
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const validation = quickCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, request, [
      'ADMIN',
      'MANAGER',
      'STAFF',
    ])

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        name: true,
        timezone: true,
        email: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const {
      serviceId,
      date,
      startTime,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerNotes,
      businessNotes,
      sendConfirmation,
    } = validation.data

    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          businessId: business.id,
        },
        select: {
          id: true,
        },
      })

      if (!customer) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
      }
    }

    const adminNote = `[${new Date().toISOString()}] Created manually by ${user.email}`
    const fullBusinessNotes = businessNotes ? `${adminNote}\n${businessNotes}` : adminNote

    const result = await createBooking(
      business.id,
      serviceId,
      date,
      startTime,
      {
        name: customerName || '',
        email: customerEmail || '',
        phone: customerPhone || null,
        notes: customerNotes || null,
      },
      {
        customerId,
        businessNotes: fullBusinessNotes,
        status: 'CONFIRMED',
        bookingSource: 'dashboard',
        idempotencyKey,
      }
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create booking',
          conflicts: result.conflicts,
        },
        { status: result.conflicts || result.idempotencyConflict ? 409 : 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          appointment: result.appointment,
          isNewCustomer: !customerId,
          confirmationSent: sendConfirmation,
        },
      },
      {
        status: 200,
        headers: result.replayed ? { 'Idempotency-Replayed': 'true' } : undefined,
      }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Quick create booking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 })
  }
}
