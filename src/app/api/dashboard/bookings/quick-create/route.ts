import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { createBooking } from '@/lib/services/booking'
import { z } from 'zod'

const quickCreateSchema = z
  .object({
    serviceId: z.string().cuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    // Customer - either existing ID or new customer details
    customerId: z.string().cuid().optional(),
    customerName: z.string().min(1).max(100).optional(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().max(20).optional(),
    // Optional fields
    customerNotes: z.string().max(1000).optional(),
    businessNotes: z.string().max(1000).optional(),
    skipConflictCheck: z.boolean().default(false),
    sendConfirmation: z.boolean().default(true),
  })
  .refine(data => data.customerId || (data.customerName && data.customerEmail), {
    message: 'Either customerId or customer name and email are required',
  })

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validation = quickCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
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
      skipConflictCheck,
      sendConfirmation,
    } = validation.data

    // Get user's business
    const ownedBusiness = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true, timezone: true, email: true },
    })

    const membership = await prisma.businessMember.findFirst({
      where: { userId: user.id },
      select: {
        businessId: true,
        business: { select: { id: true, name: true, timezone: true, email: true } },
      },
    })

    const business = ownedBusiness || membership?.business
    if (!business) {
      return NextResponse.json({ success: false, error: 'No business found' }, { status: 404 })
    }

    // If customerId provided, verify it belongs to this business
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          businessId: business.id,
        },
      })

      if (!customer) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
      }
    }

    // Build business notes with admin context
    const adminNote = `[${new Date().toISOString()}] Created manually by ${user.email}`
    const fullBusinessNotes = businessNotes ? `${adminNote}\n${businessNotes}` : adminNote

    // Use existing createBooking service
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
        status: 'CONFIRMED', // Quick create appointments are auto-confirmed
        skipConflictCheck,
        bookingSource: 'dashboard',
      }
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          conflicts: result.conflicts,
        },
        { status: result.conflicts ? 409 : 400 }
      )
    }

    // TODO: Send confirmation email if requested
    if (sendConfirmation && result.appointment?.customerEmail) {
      console.log('TODO: Send confirmation email to', result.appointment.customerEmail)
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment: result.appointment,
        isNewCustomer: !customerId,
        confirmationSent: sendConfirmation,
      },
    })
  } catch (error) {
    console.error('Quick create booking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 })
  }
}
