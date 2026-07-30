import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { isSameOriginRequest } from '@/lib/api/same-origin'
import { logger } from '@/lib/observability/logger'
import { sendPushTestNotification } from '@/lib/push/test-delivery'

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

    const result = await sendPushTestNotification(user.id)

    if (result.total === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This account has no active push subscription. Repair or enable this device first.',
          data: result,
        },
        { status: 409 }
      )
    }

    if (result.delivered === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'OnPrez could not reach any enabled device. Repair this device, then send another test alert.',
          data: result,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test alert delivered to ${result.delivered} device${result.delivered === 1 ? '' : 's'}.`,
      data: result,
    })
  } catch (error) {
    logger.error('push.test_delivery.unhandled_failure', { error })
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'OnPrez could not send the test notification.',
      },
      { status: 500 }
    )
  }
}
