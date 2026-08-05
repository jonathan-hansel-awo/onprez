import { render, screen } from '@testing-library/react'

import MoneyDashboardPage from '@/app/dashboard/money/page'

const baseData = {
  business: {
    id: 'business-1',
    name: 'Heavenly Pamper Palace',
    slug: 'louise',
  },
  account: {
    connected: true,
    status: 'READY' as const,
    chargesEnabled: true,
    payoutsEnabled: true,
    defaultCurrency: 'GBP',
    lastSyncedAt: '2026-08-04T20:00:00.000Z',
  },
  summary: {
    verifiedGrossMinor: 500,
    refundedMinor: 0,
    retainedAfterRefundsMinor: 500,
    verifiedCount: 1,
    refundedCount: 0,
    pendingCount: 0,
    failedCount: 0,
  },
  balance: {
    available: [{ amountMinor: 0, currency: 'GBP' }],
    pending: [{ amountMinor: 0, currency: 'GBP' }],
    livemode: true,
  },
  payouts: [
    {
      id: 'po_123',
      amountMinor: 500,
      currency: 'GBP',
      status: 'in_transit',
      createdAt: '2026-08-04T10:00:00.000Z',
      expectedArrivalAt: '2026-08-05T10:00:00.000Z',
      method: 'standard',
      type: 'bank_account',
      automatic: true,
      statementDescriptor: null,
      failureCode: null,
      failureMessage: null,
    },
  ],
  payments: [
    {
      id: 'payment-1',
      appointmentId: 'appointment-1',
      customerName: 'Jonathan',
      serviceName: 'Swedish Massage',
      appointmentStartTime: '2026-08-08T12:00:00.000Z',
      amountMinor: 500,
      currency: 'GBP',
      status: 'SUCCEEDED',
      refundStatus: 'NOT_REQUESTED',
      refundedAmountMinor: 0,
      refundReason: null,
      reference: '1234567890',
      paidAt: '2026-08-01T10:30:00.000Z',
      failedAt: null,
      refundedAt: null,
      createdAt: '2026-08-01T10:29:00.000Z',
      updatedAt: '2026-08-01T10:30:00.000Z',
    },
  ],
  liveStripeDataAvailable: true,
  warnings: [],
  generatedAt: '2026-08-05T00:00:00.000Z',
}

function mockMoneyResponse(data: unknown = baseData) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data }),
  }) as jest.Mock
}

describe('MoneyDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows verified booking fees even when Stripe has moved the available balance into a payout', async () => {
    mockMoneyResponse()

    render(<MoneyDashboardPage />)

    expect(await screen.findByRole('heading', { name: 'Money' })).toBeInTheDocument()
    expect(screen.getByText('Swedish Massage')).toBeInTheDocument()
    expect(screen.getByText('Jonathan')).toBeInTheDocument()
    expect(screen.getAllByText('£5.00')).toHaveLength(4)
    expect(screen.getAllByText('£0.00')).toHaveLength(2)
    expect(screen.getAllByText('On the way')).toHaveLength(2)
    expect(screen.getByText(/Why can the available balance show £0/i)).toBeInTheDocument()
    expect(
      screen.getByText(/OnPrez never receives, holds or controls your money or bank payouts/i)
    ).toBeInTheDocument()
  })

  it('keeps local booking-fee evidence visible when live Stripe data is unavailable', async () => {
    const warning =
      'Stripe could not refresh the live balance. Your verified OnPrez booking-fee history is still shown.'

    mockMoneyResponse({
      ...baseData,
      balance: null,
      payouts: [],
      liveStripeDataAvailable: false,
      warnings: [warning],
    })

    render(<MoneyDashboardPage />)

    expect(await screen.findByText(warning)).toBeInTheDocument()
    expect(screen.getByText('Swedish Massage')).toBeInTheDocument()
    expect(screen.getByText('Paid and verified')).toBeInTheDocument()
    expect(screen.getAllByText('Unavailable')).toHaveLength(2)
  })
})
