/** @jest-environment node */

import { NextRequest } from 'next/server'

import { releaseCheckoutSession, settleCheckoutSession } from '@/lib/booking-protection/checkout'
import {
  applyStripeRefund,
  reconcileBookingPaymentByPaymentIntent,
} from '@/lib/booking-protection/operations'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe/config'
import { syncStripeConnectedAccount } from '@/lib/stripe/connect-accounts'
import { processStripeWebhookEvent } from '@/lib/stripe/webhook-events'
import { POST } from '../route'

jest.mock('@/lib/stripe/config', () => ({
  getStripeClient: jest.fn(),
  getStripeWebhookSecret: jest.fn(),
}))
jest.mock('@/lib/stripe/connect-accounts', () => ({
  syncStripeConnectedAccount: jest.fn(),
}))
jest.mock('@/lib/booking-protection/checkout', () => ({
  releaseCheckoutSession: jest.fn(),
  settleCheckoutSession: jest.fn(),
}))
jest.mock('@/lib/booking-protection/operations', () => ({
  applyStripeRefund: jest.fn(),
  reconcileBookingPaymentByPaymentIntent: jest.fn(),
}))
jest.mock('@/lib/stripe/webhook-events', () => ({
  processStripeWebhookEvent: jest.fn(),
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const mockedGetStripeClient = getStripeClient as jest.Mock
const mockedGetWebhookSecret = getStripeWebhookSecret as jest.Mock
const mockedSyncAccount = syncStripeConnectedAccount as jest.Mock
const mockedSettleCheckout = settleCheckoutSession as jest.Mock
const mockedReleaseCheckout = releaseCheckoutSession as jest.Mock
const mockedApplyRefund = applyStripeRefund as jest.Mock
const mockedReconcileIntent = reconcileBookingPaymentByPaymentIntent as jest.Mock
const mockedProcessEvent = processStripeWebhookEvent as jest.Mock
const constructEvent = jest.fn()

function request(signature?: string) {
  return new NextRequest('https://onprez.test/api/webhooks/stripe', {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : {},
    body: JSON.stringify({ id: 'evt_test' }),
  })
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetWebhookSecret.mockReturnValue('whsec_test')
    mockedGetStripeClient.mockReturnValue({ webhooks: { constructEvent } })
    mockedProcessEvent.mockImplementation(async (_event, handler) => {
      await handler()
      return { duplicate: false, eventRecordId: 'evt_test' }
    })
  })

  it('rejects requests without a Stripe signature', async () => {
    const response = await POST(request())

    expect(response.status).toBe(400)
    expect(constructEvent).not.toHaveBeenCalled()
  })

  it('rejects invalid webhook signatures', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const response = await POST(request('bad-signature'))

    expect(response.status).toBe(400)
    expect(mockedSyncAccount).not.toHaveBeenCalled()
  })

  it('synchronises connected account updates through the idempotency guard', async () => {
    const account = { id: 'acct_test', metadata: { onprezBusinessId: 'business-1' } }
    const event = {
      id: 'evt_account_updated',
      type: 'account.updated',
      data: { object: account },
    }
    constructEvent.mockReturnValue(event)

    const response = await POST(request('valid-signature'))

    expect(response.status).toBe(200)
    expect(mockedProcessEvent).toHaveBeenCalledWith(event, expect.any(Function))
    expect(mockedSyncAccount).toHaveBeenCalledWith(account)
  })

  it('settles a paid Checkout Session', async () => {
    const session = { id: 'cs_test', payment_status: 'paid' }
    constructEvent.mockReturnValue({
      id: 'evt_checkout_completed',
      type: 'checkout.session.completed',
      data: { object: session },
    })

    const response = await POST(request('valid-signature'))

    expect(response.status).toBe(200)
    expect(mockedSettleCheckout).toHaveBeenCalledWith(session)
  })

  it('releases an expired Checkout reservation', async () => {
    const session = { id: 'cs_expired', status: 'expired' }
    constructEvent.mockReturnValue({
      id: 'evt_checkout_expired',
      type: 'checkout.session.expired',
      data: { object: session },
    })

    const response = await POST(request('valid-signature'))

    expect(response.status).toBe(200)
    expect(mockedReleaseCheckout).toHaveBeenCalledWith(session)
  })

  it('reconciles refund lifecycle events', async () => {
    const refund = { id: 're_test', status: 'succeeded' }
    constructEvent.mockReturnValue({
      id: 'evt_refund_updated',
      type: 'refund.updated',
      data: { object: refund },
    })

    const response = await POST(request('valid-signature'))

    expect(response.status).toBe(200)
    expect(mockedApplyRefund).toHaveBeenCalledWith(refund)
  })

  it('reconciles charge refund fallback events using the PaymentIntent', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_charge_refunded',
      type: 'charge.refunded',
      data: { object: { id: 'ch_test', payment_intent: 'pi_test' } },
    })

    const response = await POST(request('valid-signature'))

    expect(response.status).toBe(200)
    expect(mockedReconcileIntent).toHaveBeenCalledWith('pi_test', 'CHARGE_REFUNDED_WEBHOOK')
  })

  it('acknowledges durable duplicates without running the handler', async () => {
    const event = { id: 'evt_duplicate', type: 'customer.created', data: { object: {} } }
    constructEvent.mockReturnValue(event)
    mockedProcessEvent.mockResolvedValue({ duplicate: true, eventRecordId: 'evt_original' })

    const response = await POST(request('valid-signature'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({ received: true, duplicate: true })
  })
})
