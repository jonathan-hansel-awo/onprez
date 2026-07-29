import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'
import {
  mergeNotificationPreferences,
  readNotificationPreferences,
} from '@/lib/notifications/preferences'
import { prisma } from '@/lib/prisma'

const notificationPreferencesSchema = z
  .object({
    bookingOwnerEmail: z.boolean(),
    inquiryOwnerEmail: z.boolean(),
    customerReminders: z.boolean(),
    customerInquiryAcknowledgements: z.boolean(),
    marketingEmails: z.boolean(),
  })
  .strict()

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = request.nextUrl.searchParams.get('businessId')
    const context = await resolveReadableBusinessContext(user.id, businessId || request)
    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: { id: true, settings: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        businessId: business.id,
        preferences: readNotificationPreferences(business.settings),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification preferences' },
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
    const { businessId: _businessId, ...preferencesBody } = body
    const validation = notificationPreferencesSchema.safeParse(preferencesBody)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, businessId || request)
    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: { id: true, settings: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const updatedSettings = mergeNotificationPreferences(business.settings, validation.data)

    await prisma.business.update({
      where: { id: business.id },
      data: { settings: updatedSettings as Prisma.InputJsonValue },
    })

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        businessId: business.id,
        preferences: readNotificationPreferences(updatedSettings),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
