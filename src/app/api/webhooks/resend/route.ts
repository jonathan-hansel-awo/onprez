import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/config/env'
import { processResendWebhookEvent } from '@/lib/email-delivery/resend-webhook'
import { logger } from '@/lib/observability/logger'
import { verifyResendWebhook } from '@/lib/services/email'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!env.RESEND_WEBHOOK_SECRET) {
    logger.error('email.webhook.not_configured')
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signature = request.headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 })
  }

  const payload = await request.text()
  let event
  try {
    event = verifyResendWebhook(payload, { id, timestamp, signature })
  } catch (error) {
    logger.warn('email.webhook.signature_rejected', {
      errorType: error instanceof Error ? error.name : typeof error,
    })
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    const result = await processResendWebhookEvent(event, id)

    return NextResponse.json({ received: true, result })
  } catch (error) {
    logger.error('email.webhook.processing_failed', {
      errorType: error instanceof Error ? error.name : typeof error,
    })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
