import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import { bookingSettingsSchema } from '@/lib/validation/business'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    // Get business
    const business = await prisma.business.findFirst({
      where: businessId ? { id: businessId, ownerId: payload.userId } : { ownerId: payload.userId },
      select: {
        id: true,
        name: true,
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const settings = (business.settings as Record<string, unknown>) || {}
    const bookingSettings = (settings.booking as Record<string, unknown>) || {}

    // Return with defaults
    const response = {
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

    return NextResponse.json({
      success: true,
      data: {
        businessId: business.id,
        businessName: business.name,
        settings: response,
      },
    })
  } catch (error) {
    console.error('Get booking settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get booking settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, ...settingsData } = body

    // Validate settings
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

    // Get business
    const business = await prisma.business.findFirst({
      where: businessId ? { id: businessId, ownerId: payload.userId } : { ownerId: payload.userId },
      select: {
        id: true,
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Merge with existing settings
    const currentSettings = (business.settings as Record<string, unknown>) || {}
    const currentBooking = (currentSettings.booking as Record<string, unknown>) || {}

    const updatedSettings = {
      ...currentSettings,
      booking: {
        ...currentBooking,
        ...validation.data,
        updatedAt: new Date().toISOString(),
      },
    }

    // Update business
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

    const newBookingSettings = (updated.settings as Record<string, unknown>)?.booking || {}

    return NextResponse.json({
      success: true,
      data: {
        businessId: updated.id,
        businessName: updated.name,
        settings: newBookingSettings,
      },
      message: 'Booking settings updated successfully',
    })
  } catch (error) {
    console.error('Update booking settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update booking settings' },
      { status: 500 }
    )
  }
}
