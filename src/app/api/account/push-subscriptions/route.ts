import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { isSameOriginRequest } from '@/lib/api/same-origin'
import { prisma } from '@/lib/prisma'
import { getPublicVapidKey, isPushConfigured } from '@/lib/push/config'
import {
  getPushNotificationPreferences,
  MAX_PUSH_SUBSCRIPTIONS_PER_USER,
  pruneExpiredPushSubscriptions,
} from '@/lib/push/subscriptions'

const subscriptionSchema = z
  .object({
    endpoint: z
      .string()
      .url()
      .max(2048)
      .refine(value => value.startsWith('https://')),
    expirationTime: z.number().int().positive().nullable().optional(),
    keys: z.object({
      p256dh: z
        .string()
        .min(16)
        .max(256)
        .regex(/^[A-Za-z0-9_-]+$/),
      auth: z
        .string()
        .min(8)
        .max(128)
        .regex(/^[A-Za-z0-9_-]+$/),
    }),
    deviceName: z.string().trim().min(1).max(80).optional(),
  })
  .strict()

const subscriptionSelection = {
  id: true,
  endpoint: true,
  deviceName: true,
  expiresAt: true,
  lastSeenAt: true,
  createdAt: true,
} as const

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await pruneExpiredPushSubscriptions(user.id)

    const [subscriptions, preferences] = await Promise.all([
      prisma.pushSubscription.findMany({
        where: { userId: user.id },
        orderBy: { lastSeenAt: 'desc' },
        select: subscriptionSelection,
      }),
      getPushNotificationPreferences(user.id),
    ])

    return NextResponse.json(
      {
        success: true,
        data: {
          configured: isPushConfigured(),
          vapidPublicKey: getPublicVapidKey(),
          subscriptions,
          preferences,
          subscriptionLimit: MAX_PUSH_SUBSCRIPTIONS_PER_USER,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Get push subscriptions API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!isPushConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Booking alerts are not configured yet' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => null)
    const validation = subscriptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid push subscription' },
        { status: 400 }
      )
    }

    const { endpoint, expirationTime, keys, deviceName } = validation.data
    const expiresAt = expirationTime ? new Date(expirationTime) : null

    if (expiresAt && expiresAt <= new Date()) {
      return NextResponse.json(
        { success: false, message: 'Push subscription has already expired' },
        { status: 400 }
      )
    }

    await pruneExpiredPushSubscriptions(user.id)

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: { id: true, userId: true },
    })

    if (existing && existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Unable to register this push subscription' },
        { status: 409 }
      )
    }

    if (!existing) {
      const subscriptionCount = await prisma.pushSubscription.count({
        where: { userId: user.id },
      })

      if (subscriptionCount >= MAX_PUSH_SUBSCRIPTIONS_PER_USER) {
        return NextResponse.json(
          {
            success: false,
            message: `Remove an existing device before adding more than ${MAX_PUSH_SUBSCRIPTIONS_PER_USER}`,
          },
          { status: 409 }
        )
      }
    }

    const userAgent = request.headers.get('user-agent')?.slice(0, 512) || null
    const now = new Date()
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        deviceName,
        userAgent,
        expiresAt,
        lastSeenAt: now,
        failureCount: 0,
        lastFailureAt: null,
      },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        deviceName,
        userAgent,
        expiresAt,
        lastSeenAt: now,
      },
      select: subscriptionSelection,
    })

    return NextResponse.json(
      { success: true, data: { subscription } },
      { status: existing ? 200 : 201, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Save push subscription API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
