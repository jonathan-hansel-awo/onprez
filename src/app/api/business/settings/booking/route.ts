import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bookingSettingsSchema } from '@/lib/validation/business'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function getBookingSettings(settings: Record<string, unknown>) {
  const bookingSettings = toRecord(settings.booking)

  return {
    bufferTime: bookingSettings.bufferTime ?? 0,
    slotInterval: bookingSettings.slotInterval ?? 15,
    advanceBookingDays: bookingSettings.advanceBookingDays ?? 30,
    sameDayBooking: bookingSettings.sameDayBooking ?? true,
    sameDayLeadTime: bookingSettings.sameDayLeadTime ?? 60,
    requireApproval: bookingSettings.requireApproval ?? false,
    autoConfirm: bookingSettings.autoConfirm ?? true,
    cancellationDeadline: bookingSettings.cancellationDeadline ?? 24,
    allowRescheduling: bookingSettings.allowRescheduling ?? true,
    rescheduleDeadline: bookingSettings.rescheduleDeadline ?? 24,
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    const context = await resolveReadableBusinessContext(user.id, businessId || request)

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        name: true,
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const settings = toRecord(business.settings)

    return NextResponse.json({
      success: true,
      data: {
        businessId: business.id,
        businessName: business.name,
        settings: getBookingSettings(settings),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get booking settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get booking settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined
    const { businessId: _businessId, ...settingsData } = body

    const validation = bookingSettingsSchema.safeParse(settingsData)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, businessId || request)

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        name: true,
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const currentSettings = toRecord(business.settings)
    const currentBooking = toRecord(currentSettings.booking)

    const updatedSettings = {
      ...currentSettings,
      booking: {
        ...currentBooking,
        ...validation.data,
        updatedAt: new Date().toISOString(),
      },
    }

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: {
        settings: updatedSettings,
      },
      select: {
        id: true,
        name: true,
        settings: true,
      },
    })

    const newSettings = toRecord(updated.settings)

    return NextResponse.json({
      success: true,
      data: {
        businessId: updated.id,
        businessName: updated.name,
        settings: getBookingSettings(newSettings),
      },
      message: 'Booking settings updated successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update booking settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update booking settings' },
      { status: 500 }
    )
  }
}
