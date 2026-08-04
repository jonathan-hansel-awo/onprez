/** @jest-environment node */

import { NextRequest } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'
import { getStripeClient, isStripeConnectConfigured } from '@/lib/stripe/config'
import { GET } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({ businessAuthErrorResponse: jest.fn() }))
jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveWritableBusinessContext: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    stripeConnectedAccount: { findUnique: jest.fn() },
    bookingPayment: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
  },
}))
jest.mock('@/lib/stripe/config', () => ({
  getStripeClient: jest.fn(),
  isStripeConnectConfigured: jest.fn(),
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveBusiness = resolveWritableBusinessContext as jest.Mock
const mockedFindConnectedAccount = prisma.stripeConnectedAccount.findUnique as jest.Mock
const mockedFindPayments = prisma.bookingPayment.findMany as jest.Mock
const mockedAggregatePayments = prisma.bookingPayment.aggregate as jest.Mock
const mockedCountPayments = prisma.bookingPayment.count as jest.Mock
const mockedGetStripeClient = getStripeClient as jest.Mock
const mockedStripeConfigured = isStripeConnectConfigured as jest.Mock

const decimal = (value: string) => ({ toString: () => value })

function request() {
  return new NextRequest('https://onprez.test/api/dashboard/money')
}

function configureLocalPaymentData() {
  mockedFindConnectedAccount.mockResolvedValue({
    stripeAccountId: 'acct_louise',
    status: 'READY',
    chargesEnabled: true,
    payoutsEnabled: true,
    defaultCurrency: 'gbp',
    lastSyncedAt: new Date('2026-08-04T20:00:00.000Z'),
  })
  mockedFindPayments.mockResolvedValue([
    {
      id: 'payment-1',
      appointmentId: 'appointment-1',
      status: 'SUCCEEDED',
      amount: decimal('5.00'),
      currency: 'GBP',
      providerPaymentIntentId: 'pi_booking_1234567890',
      providerChargeId: 'ch_booking_1234567890',
      refundStatus: 'NOT_REQUESTED',
      refundReason: null,
      paidAt: new Date('2026-08-01T10:30:00.000Z'),
      failedAt: null,
      refundedAt: null,
      createdAt: new Date('2026-08-01T10:29:00.000Z'),
      updatedAt: new Date('2026-08-01T10:30:00.000Z'),
      appointment: {
        customerName: 'Jonathan',
        startTime: new Date('2026-08-08T12:00:00.000Z'),
        service: { name: 'Swedish Massage' },
      },
    },
  ])
  mockedAggregatePayments
    .mockResolvedValueOnce({ _sum: { amount: decimal('5.00') }, _count: { _all: 1 } })
    .mockResolvedValueOnce({ _sum: { amount: null }, _count: { _all: 0 } })
  mockedCountPayments.mockResolvedValueOnce(0).mockResolvedValueOnce(0)
}

describe('GET /api/dashboard/money', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockedResolveBusiness.mockResolvedValue({
      businessId: 'business-1',
      business: { id: 'business-1', name: 'Heavenly Pamper Palace', slug: 'louise' },
      isOwner: true,
      role: 'OWNER',
    })
    mockedStripeConfigured.mockReturnValue(true)
    configureLocalPaymentData()
  })

  it('requires authentication', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await GET(request())

    expect(response.status).toBe(401)
    expect(mockedResolveBusiness).not.toHaveBeenCalled()
  })

  it('returns owner-scoped booking fees, balance and payout history', async () => {
    mockedGetStripeClient.mockReturnValue({
      balance: {
        retrieve: jest.fn().mockResolvedValue({
          available: [{ amount: 0, currency: 'gbp' }],
          pending: [{ amount: 0, currency: 'gbp' }],
          livemode: true,
        }),
      },
      payouts: {
        list: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'po_123',
              amount: 500,
              currency: 'gbp',
              status: 'in_transit',
              created: 1_775_000_000,
              arrival_date: 1_775_172_800,
              method: 'standard',
              type: 'bank_account',
              automatic: true,
              statement_descriptor: null,
              failure_code: null,
              failure_message: null,
            },
          ],
        }),
      },
    })

    const response = await GET(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mockedResolveBusiness).toHaveBeenCalledWith('user-1', expect.any(NextRequest), [])
    expect(payload.data.summary.verifiedGrossMinor).toBe(500)
    expect(payload.data.balance.available[0].amountMinor).toBe(0)
    expect(payload.data.payouts[0]).toEqual(
      expect.objectContaining({ amountMinor: 500, status: 'in_transit' })
    )
    expect(payload.data.payments[0]).toEqual(
      expect.objectContaining({
        customerName: 'Jonathan',
        serviceName: 'Swedish Massage',
        amountMinor: 500,
        status: 'SUCCEEDED',
      })
    )
  })

  it('keeps local payment history visible when Stripe is unavailable', async () => {
    mockedGetStripeClient.mockReturnValue({
      balance: { retrieve: jest.fn().mockRejectedValue(new Error('Stripe unavailable')) },
      payouts: { list: jest.fn().mockRejectedValue(new Error('Stripe unavailable')) },
    })

    const response = await GET(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.balance).toBeNull()
    expect(payload.data.payouts).toEqual([])
    expect(payload.data.summary.verifiedGrossMinor).toBe(500)
    expect(payload.data.payments).toHaveLength(1)
    expect(payload.data.warnings).toHaveLength(2)
  })

  it('does not call Stripe when the business has no connected account', async () => {
    mockedFindConnectedAccount.mockResolvedValue(null)

    const response = await GET(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.account.connected).toBe(false)
    expect(mockedGetStripeClient).not.toHaveBeenCalled()
  })
})
