/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'

const featureSettingsSchema = z.object({
  faqEnabled: z.boolean(),
  inquiryEnabled: z.boolean(),
  inquiryNotificationEmail: z.string().email().optional().nullable(),
  inquiryAutoReply: z.string().max(500).optional().nullable(),
  bookingNotifications: z.boolean().optional(),
  emailReminders: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { settings: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const settings = (business.settings as any) || {}
    const features = {
      faqEnabled: settings.faqEnabled ?? true,
      inquiryEnabled: settings.inquiryEnabled ?? true,
      inquiryNotificationEmail: settings.inquiryNotificationEmail ?? null,
      inquiryAutoReply: settings.inquiryAutoReply ?? null,
      bookingNotifications: settings.bookingNotifications ?? true,
      emailReminders: settings.emailReminders ?? true,
    }

    return NextResponse.json({ success: true, data: { features } })
  } catch (error) {
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
    const validation = featureSettingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Merge with existing settings
    const currentSettings = (business.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      ...validation.data,
    }

    await prisma.business.update({
      where: { id: business.id },
      data: { settings: updatedSettings },
    })

    return NextResponse.json({
      success: true,
      message: 'Feature settings updated successfully',
      data: { features: validation.data },
    })
  } catch (error) {
    console.error('Update feature settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
