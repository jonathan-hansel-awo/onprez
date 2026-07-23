/** @jest-environment node */

import { NextRequest } from 'next/server'

import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe/config'
import { syncStripeConnectedAccount } from '@/lib/stripe/connect-accounts'
import { releaseCheckoutSession, settleCheckoutSession } from '@/lib/booking-protection/checkout'
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

const mockedGetStripeClient = getStripeClient as jest.Mock
const mockedGetWebhookSecret = getStripeWebhookSecret as jest.Mock
const mockedSyncAccount = syncStripeConnectedAccount as jest.Mock
const mockedSettleCheckout = settleCheckoutSession as jest.Mock
const mockedReleaseCheckout = releaseCheckoutSession as jest.Mock
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

  it('synchronises connected account updates', async () => {
    const account = { id: 'acct_test', metadata: { onprezBusinessId: 'business-1' } }
    constructEvent.mockReturnValue({
      id: 'evt_account_updated',
      type: 'account.updated',
      data: { object: account },
    })

    const response = await POST(request('valid-signature'))

    expect(response.status).toBe(200)
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

  it('acknowledges unrelated Stripe events without mutating account state', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_other',
      type: 'customer.created',
      data: { object: { id: 'cus_test' } },
    })

    const response = await POST(request('valid-signature'))

    expect(response.status).toBe(200)
    expect(mockedSyncAccount).not.toHaveBeenCalled()
  })
})
