import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'

const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  emailEnabled: z.boolean(),
  defaultMessage: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true, settings: true },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    const settings = business.settings as Record<string, unknown> || {}
    const reminders = settings.reminders || {
      enabled: true,
      emailEnabled: true,
      defaultMessage: '',
    }

    return NextResponse.json({
      success: true,
      data: reminders,
    })
  } catch (error) {
    console.error('Get reminder settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get reminder settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = reminderSettingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true, settings: true },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    const currentSettings = business.settings as Record<string, unknown> || {}
    const updatedSettings = {
      ...currentSettings,
      reminders: validation.data,
    }

    await prisma.business.update({
      where: { id: business.id },
      data: { settings: updatedSettings },
    })

    return NextResponse.json({
      success: true,
      data: validation.data,
    })
  } catch (error) {
    console.error('Update reminder settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update reminder settings' },
      { status: 500 }
    )
  }
}
