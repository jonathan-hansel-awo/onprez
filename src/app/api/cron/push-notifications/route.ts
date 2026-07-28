import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/observability/logger'
import { processDuePushOutbox } from '@/lib/push/delivery'

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
    const result = await processDuePushOutbox()
    logger.info('push.cron.completed', { ...result })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('push.cron.failed', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to process booking alerts' },
      { status: 500 }
    )
  }
}
