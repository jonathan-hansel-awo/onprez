import { NextRequest, NextResponse } from 'next/server'
import { DataLifecycleRequestStatus, DataLifecycleRequestType } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { recordLifecycleAction } from '@/lib/data-lifecycle/audit'
import {
  enforceLifecycleRateLimit,
  verifyLifecyclePassword,
} from '@/lib/data-lifecycle/verification'
import { prisma } from '@/lib/prisma'

const passwordSchema = z.object({ password: z.string().min(1).max(256) })
const ACTIVE_STATUSES: DataLifecycleRequestStatus[] = [
  DataLifecycleRequestStatus.REQUESTED,
  DataLifecycleRequestStatus.SCHEDULED,
  DataLifecycleRequestStatus.REVIEW_REQUIRED,
]

function requestView(request: {
  id: string
  status: DataLifecycleRequestStatus
  scheduledFor: Date | null
  holdReason: string | null
  requestedAt: Date
  cancelledAt: Date | null
}) {
  return {
    ...request,
    canCancel: ACTIVE_STATUSES.includes(request.status),
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const [deletionRequest, businesses] = await Promise.all([
    prisma.dataLifecycleRequest.findFirst({
      where: { subjectUserId: user.id, type: DataLifecycleRequestType.ACCOUNT_DELETION },
      select: {
        id: true,
        status: true,
        scheduledFor: true,
        holdReason: true,
        requestedAt: true,
        cancelledAt: true,
      },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.business.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return NextResponse.json(
    {
      success: true,
      data: {
        deletionRequest: deletionRequest ? requestView(deletionRequest) : null,
        ownedBusinesses: businesses,
        coolingOffDays: 14,
      },
    },
    { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = await enforceLifecycleRateLimit(request, user.id, 'delete-request')
    if (rateLimitResponse) return rateLimitResponse

    const validation = passwordSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 })
    }

    if (!(await verifyLifecyclePassword(user.id, validation.data.password))) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    const existing = await prisma.dataLifecycleRequest.findFirst({
      where: {
        subjectUserId: user.id,
        type: DataLifecycleRequestType.ACCOUNT_DELETION,
        status: { in: ACTIVE_STATUSES },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account deletion request is already active' },
        { status: 409 }
      )
    }

    const ownedBusinesses = await prisma.business.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    })
    const businessIds = ownedBusinesses.map(business => business.id)
    const now = new Date()

    const [futureBookingCount, retainedPaymentCount] =
      businessIds.length === 0
        ? [0, 0]
        : await Promise.all([
            prisma.appointment.count({
              where: {
                businessId: { in: businessIds },
                startTime: { gte: now },
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            }),
            prisma.bookingPayment.count({ where: { businessId: { in: businessIds } } }),
          ])

    const requiresReview =
      businessIds.length > 0 || futureBookingCount > 0 || retainedPaymentCount > 0
    const scheduledFor = new Date(now)
    scheduledFor.setUTCDate(scheduledFor.getUTCDate() + 14)
    const holdReason = requiresReview
      ? 'Owned business, booking, or payment records require a retention and ownership review before erasure.'
      : null

    const deletionRequest = await prisma.dataLifecycleRequest.create({
      data: {
        type: DataLifecycleRequestType.ACCOUNT_DELETION,
        status: requiresReview
          ? DataLifecycleRequestStatus.REVIEW_REQUIRED
          : DataLifecycleRequestStatus.SCHEDULED,
        requestedByUserId: user.id,
        subjectUserId: user.id,
        scheduledFor,
        holdReason,
        metadata: {
          coolingOffDays: 14,
          ownedBusinessCount: businessIds.length,
          futureBookingCount,
          retainedPaymentCount,
          policy: 'Preserve transactional records while deleting or anonymising unnecessary PII.',
        },
      },
      select: {
        id: true,
        status: true,
        scheduledFor: true,
        holdReason: true,
        requestedAt: true,
        cancelledAt: true,
      },
    })

    await recordLifecycleAction({
      userId: user.id,
      action: 'account_deletion_requested',
      request,
      details: {
        requestId: deletionRequest.id,
        status: deletionRequest.status,
        ownedBusinessCount: businessIds.length,
        futureBookingCount,
        retainedPaymentCount,
      },
      severity: 'warning',
    })

    return NextResponse.json(
      { success: true, data: { deletionRequest: requestView(deletionRequest) } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Account deletion request failed:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to create the account deletion request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = await enforceLifecycleRateLimit(request, user.id, 'delete-cancel')
    if (rateLimitResponse) return rateLimitResponse

    const validation = passwordSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 })
    }

    if (!(await verifyLifecyclePassword(user.id, validation.data.password))) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    const active = await prisma.dataLifecycleRequest.findFirst({
      where: {
        subjectUserId: user.id,
        type: DataLifecycleRequestType.ACCOUNT_DELETION,
        status: { in: ACTIVE_STATUSES },
      },
    })

    if (!active) {
      return NextResponse.json(
        { success: false, message: 'No active account deletion request was found' },
        { status: 404 }
      )
    }

    const cancelledAt = new Date()
    await prisma.dataLifecycleRequest.update({
      where: { id: active.id },
      data: { status: DataLifecycleRequestStatus.CANCELLED, cancelledAt },
    })

    await recordLifecycleAction({
      userId: user.id,
      action: 'account_deletion_cancelled',
      request,
      details: { requestId: active.id },
    })

    return NextResponse.json({ success: true, data: { requestId: active.id, cancelledAt } })
  } catch (error) {
    console.error('Account deletion cancellation failed:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to cancel the account deletion request' },
      { status: 500 }
    )
  }
}
