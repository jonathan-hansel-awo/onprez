import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { isSameOriginRequest } from '@/lib/api/same-origin'
import { prisma } from '@/lib/prisma'
import { getPushNotificationPreferences } from '@/lib/push/subscriptions'

const preferencesSchema = z
  .object({
    newBookingEnabled: z.boolean(),
    cancellationEnabled: z.boolean(),
    rescheduleEnabled: z.boolean(),
  })
  .strict()

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await getPushNotificationPreferences(user.id)
    return NextResponse.json(
      { success: true, data: { preferences } },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Get notification preferences API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request origin' },
        { status: 403 }
      )
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const validation = preferencesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification preferences' },
        { status: 400 }
      )
    }

    const preferences = await prisma.pushNotificationPreference.upsert({
      where: { userId: user.id },
      update: validation.data,
      create: { userId: user.id, ...validation.data },
      select: {
        newBookingEnabled: true,
        cancellationEnabled: true,
        rescheduleEnabled: true,
      },
    })

    return NextResponse.json(
      { success: true, data: { preferences } },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Update notification preferences API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
