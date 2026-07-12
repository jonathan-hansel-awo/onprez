import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'

const featureSettingsSchema = z.object({
  faqEnabled: z.boolean(),
  inquiryEnabled: z.boolean(),
  inquiryNotificationEmail: z.string().email().optional().nullable(),
  inquiryAutoReply: z.string().max(500).optional().nullable(),
  bookingNotifications: z.boolean().optional(),
  emailReminders: z.boolean().optional(),
})

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function getFeatures(settings: Record<string, unknown>) {
  return {
    faqEnabled: settings.faqEnabled ?? true,
    inquiryEnabled: settings.inquiryEnabled ?? true,
    inquiryNotificationEmail: settings.inquiryNotificationEmail ?? null,
    inquiryAutoReply: settings.inquiryAutoReply ?? null,
    bookingNotifications: settings.bookingNotifications ?? true,
    emailReminders: settings.emailReminders ?? true,
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
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const features = getFeatures(toRecord(business.settings))

    return NextResponse.json({
      success: true,
      data: {
        businessId: business.id,
        features,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get feature settings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
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
    const { businessId: _businessId, ...featureBody } = body

    const validation = featureSettingsSchema.safeParse(featureBody)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, businessId || request)

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const updatedSettings = {
      ...toRecord(business.settings),
      ...validation.data,
    }

    await prisma.business.update({
      where: { id: business.id },
      data: { settings: updatedSettings },
    })

    return NextResponse.json({
      success: true,
      message: 'Feature settings updated successfully',
      data: {
        businessId: business.id,
        features: getFeatures(updatedSettings),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update feature settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
