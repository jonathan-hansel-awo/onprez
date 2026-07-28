import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

import { expirePendingBookingApprovals } from '@/lib/booking-protection/approval'
import { logger } from '@/lib/observability/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')
  const provided = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : ''

  if (!secret || !provided) return false
  const expectedBuffer = Buffer.from(secret)
  const providedBuffer = Buffer.from(provided)
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  )
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expirePendingBookingApprovals()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('booking.approval.cron_failed', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to expire booking approvals' },
      { status: 500 }
    )
  }
}
