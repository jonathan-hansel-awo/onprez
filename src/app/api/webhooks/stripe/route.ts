import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { releaseCheckoutSession, settleCheckoutSession } from '@/lib/booking-protection/checkout'
import {
  applyStripeRefund,
  reconcileBookingPaymentByPaymentIntent,
} from '@/lib/booking-protection/operations'
import { logger } from '@/lib/observability/logger'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe/config'
import { syncStripeConnectedAccount } from '@/lib/stripe/connect-accounts'
import { processStripeWebhookEvent } from '@/lib/stripe/webhook-events'

export const runtime = 'nodejs'

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'account.updated':
      await syncStripeConnectedAccount(event.data.object as Stripe.Account)
      break
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await settleCheckoutSession(event.data.object as Stripe.Checkout.Session)
      break
    case 'checkout.session.expired':
      await releaseCheckoutSession(event.data.object as Stripe.Checkout.Session)
      break
    case 'checkout.session.async_payment_failed':
      await releaseCheckoutSession(event.data.object as Stripe.Checkout.Session, 'PAYMENT_FAILED')
      break
    case 'refund.created':
    case 'refund.updated':
    case 'refund.failed':
      await applyStripeRefund(event.data.object as Stripe.Refund)
      break
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id
      if (paymentIntentId) {
        await reconcileBookingPaymentByPaymentIntent(paymentIntentId, 'CHARGE_REFUNDED_WEBHOOK')
      }
      break
    }
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
      await reconcileBookingPaymentByPaymentIntent(
        (event.data.object as Stripe.PaymentIntent).id,
        event.type.toUpperCase()
      )
      break
    default:
      break
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ success: false, error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const payload = await request.text()
    event = getStripeClient().webhooks.constructEvent(payload, signature, getStripeWebhookSecret())
  } catch (error) {
    logger.warn('stripe.webhook.signature_rejected', {
      error: error instanceof Error ? error.message : 'Invalid signature',
    })
    return NextResponse.json({ success: false, error: 'Invalid Stripe signature' }, { status: 400 })
  }

  try {
    const result = await processStripeWebhookEvent(event, () => handleStripeEvent(event))
    return NextResponse.json({ received: true, duplicate: result.duplicate })
  } catch (error) {
    logger.error('stripe.webhook.processing_failed', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Webhook processing failed',
    })
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
