import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

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
    if (event.type === 'account.updated') {
      await syncStripeConnectedAccount(event.data.object as Stripe.Account)
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
