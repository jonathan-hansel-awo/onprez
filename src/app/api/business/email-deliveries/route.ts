import { EmailDeliveryStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import { getCurrentUser } from '@/lib/auth/get-user'
import { canRetryEmailDelivery } from '@/lib/email-delivery/delivery'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const context = await resolveReadableBusinessContext(user.id, request)
    const requestedStatus = request.nextUrl.searchParams.get('status')
    const status = Object.values(EmailDeliveryStatus).includes(
      requestedStatus as EmailDeliveryStatus
    )
      ? (requestedStatus as EmailDeliveryStatus)
      : undefined

    const deliveries = await prisma.emailDelivery.findMany({
      where: { businessId: context.businessId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        category: true,
        audience: true,
        status: true,
        recipientMasked: true,
        attempts: true,
        maxAttempts: true,
        lastAttemptAt: true,
        sentAt: true,
        deliveredAt: true,
        lastErrorCode: true,
        lastError: true,
        createdAt: true,
        events: {
          orderBy: { occurredAt: 'desc' },
          take: 5,
          select: { id: true, type: true, status: true, occurredAt: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        businessId: context.businessId,
        deliveries: deliveries.map(delivery => ({
          ...delivery,
          canRetry: canRetryEmailDelivery(delivery.status, delivery.attempts, delivery.maxAttempts),
        })),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse
    return NextResponse.json(
      { success: false, error: 'Failed to load email delivery history' },
      { status: 500 }
    )
  }
}
