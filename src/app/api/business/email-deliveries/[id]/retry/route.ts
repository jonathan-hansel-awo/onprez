import { NextRequest, NextResponse } from 'next/server'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { EmailDeliveryRetryError } from '@/lib/email-delivery/delivery'
import { retryEmailDelivery } from '@/lib/email-delivery/retry'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/services/rate-limit'

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).origin === request.nextUrl.origin
  } catch {
    return false
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const delivery = await prisma.emailDelivery.findUnique({
      where: { id },
      select: { businessId: true },
    })
    if (!delivery) {
      return NextResponse.json(
        { success: false, error: 'Email delivery not found' },
        { status: 404 }
      )
    }

    await requireBusinessRole(user.id, delivery.businessId, ['ADMIN', 'MANAGER', 'STAFF'])
    const rateLimit = await checkRateLimit(`email-retry:${user.id}:${id}`, 'email:send')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many email retries. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      )
    }

    const result = await retryEmailDelivery(id, user.id)
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Email delivery not found' },
        { status: 404 }
      )
    }
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Email retry failed' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, message: 'Email retry queued successfully' })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse
    if (error instanceof EmailDeliveryRetryError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409
      return NextResponse.json({ success: false, error: error.message }, { status })
    }
    return NextResponse.json({ success: false, error: 'Failed to retry email' }, { status: 500 })
  }
}
