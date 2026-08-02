import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'
import { getCurrentUser } from '@/lib/auth/get-user'
import {
  BusinessHandleConflictError,
  BusinessHandleNotFoundError,
  BusinessHandleValidationError,
  changeBusinessHandle,
  getBusinessHandleHistory,
} from '@/lib/business/handle-changes'
import { invalidatePublicPresence } from '@/lib/presence/public-presence-cache'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/services/rate-limit'

function clientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = new URL(request.url).searchParams.get('businessId')
    const context = await resolveReadableBusinessContext(user.id, businessId || request)
    const history = await getBusinessHandleHistory(context.businessId)

    return NextResponse.json({
      success: true,
      data: {
        ...history,
        access: { role: context.role, isOwner: context.isOwner },
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse
    if (error instanceof BusinessHandleNotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
    console.error('Get business handle history error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch handle history' },
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

    const rateLimit = await checkRateLimit(`handle-update:${user.id}`, 'handle:update')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many handle changes. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      )
    }

    const body = (await request.json()) as { businessId?: unknown; handle?: unknown }
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined
    const context = await resolveWritableBusinessContext(user.id, businessId || request)

    if (!context.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only the business owner can change the handle' },
        { status: 403 }
      )
    }

    if (typeof body.handle !== 'string') {
      return NextResponse.json({ success: false, error: 'Handle is required' }, { status: 400 })
    }

    const result = await changeBusinessHandle({
      businessId: context.businessId,
      nextHandle: body.handle,
    })

    const handlesToInvalidate = new Set([
      result.oldHandle,
      result.business.slug,
      ...result.previousHandles.map(item => item.sourceHandle),
    ])
    handlesToInvalidate.forEach(handle => invalidatePublicPresence(handle))

    if (result.changed) {
      try {
        await prisma.securityLog.create({
          data: {
            userId: user.id,
            action: 'business_handle_changed',
            details: {
              businessId: result.business.id,
              fromHandle: result.oldHandle,
              toHandle: result.business.slug,
            },
            ipAddress: clientIp(request),
            userAgent: request.headers.get('user-agent') || undefined,
            severity: 'info',
          },
        })
      } catch (error) {
        // The handle transaction is already durable. Do not tell the owner it
        // failed and encourage a duplicate retry because secondary audit
        // persistence was unavailable.
        console.error('Business handle audit logging failed:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: result.changed ? 'Handle changed successfully' : 'Handle is unchanged',
      data: result,
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse
    if (error instanceof BusinessHandleValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    if (error instanceof BusinessHandleConflictError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2002' || error.code === 'P2034')
    ) {
      return NextResponse.json(
        { success: false, error: 'Handle changed concurrently. Refresh and try again.' },
        { status: 409 }
      )
    }
    if (error instanceof BusinessHandleNotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
    console.error('Change business handle error:', error)
    return NextResponse.json({ success: false, error: 'Failed to change handle' }, { status: 500 })
  }
}
