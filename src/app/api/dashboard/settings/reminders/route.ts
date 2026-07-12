import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'

const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  emailEnabled: z.boolean(),
  defaultMessage: z.string().max(500).optional(),
})

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

const defaultReminders = {
  enabled: true,
  emailEnabled: true,
  defaultMessage: '',
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id, request)

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: { id: true, settings: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const settings = toRecord(business.settings)
    const reminders = settings.reminders || defaultReminders

    return NextResponse.json({
      success: true,
      data: reminders,
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = reminderSettingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, request)

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: { id: true, settings: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const currentSettings = toRecord(business.settings)

    const updatedSettings = {
      ...currentSettings,
      reminders: validation.data,
    }

    await prisma.business.update({
      where: { id: context.businessId },
      data: { settings: updatedSettings },
    })

    return NextResponse.json({
      success: true,
      data: validation.data,
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update reminder settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update reminder settings' },
      { status: 500 }
    )
  }
}
