import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { releaseCheckoutSession, settleCheckoutSession } from '@/lib/booking-protection/checkout'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe/config'
import { syncStripeConnectedAccount } from '@/lib/stripe/connect-accounts'

export const runtime = 'nodejs'

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
    console.error('Stripe webhook verification error:', error)
    return NextResponse.json({ success: false, error: 'Invalid Stripe signature' }, { status: 400 })
  }

  try {
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
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Stripe webhook processing error for ${event.id}:`, error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
