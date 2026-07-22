/** @jest-environment node */

import { StripeConnectedAccountStatus } from '@prisma/client'
import type Stripe from 'stripe'

import { prisma } from '@/lib/prisma'
import {
  buildStripeOnboardingUrls,
  deriveStripeConnectedAccountStatus,
  syncStripeConnectedAccount,
} from '@/lib/stripe/connect-accounts'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    stripeConnectedAccount: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

const stripeConnectedAccount = prisma.stripeConnectedAccount as unknown as {
  findUnique: jest.Mock
  upsert: jest.Mock
}

function account(overrides: Partial<Stripe.Account> = {}): Stripe.Account {
  return {
    id: 'acct_onprez_test',
    object: 'account',
    business_profile: null,
    business_type: null,
    capabilities: {},
    charges_enabled: false,
    controller: undefined,
    country: 'GB',
    created: 1,
    default_currency: 'gbp',
    details_submitted: false,
    email: null,
    external_accounts: { object: 'list', data: [], has_more: false, url: '' },
    future_requirements: null,
    individual: null,
    metadata: { onprezBusinessId: 'business-1' },
    payouts_enabled: false,
    requirements: {
      alternatives: [],
      current_deadline: null,
      currently_due: [],
      disabled_reason: null,
      errors: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
    },
    settings: {} as Stripe.Account.Settings,
    tos_acceptance: null,
    type: 'standard',
    ...overrides,
  } as Stripe.Account
}

describe('Stripe connected account orchestration', () => {
  beforeEach(() => {
    stripeConnectedAccount.findUnique.mockReset()
    stripeConnectedAccount.upsert.mockReset()
  })

  it('marks an account ready only when charges and payouts are enabled', () => {
    expect(
      deriveStripeConnectedAccountStatus(
        account({ charges_enabled: true, payouts_enabled: true })
      )
    ).toBe(StripeConnectedAccountStatus.READY)
  })

  it('marks accounts with past-due requirements as restricted', () => {
    expect(
      deriveStripeConnectedAccountStatus(
        account({
          requirements: {
            alternatives: [],
            current_deadline: null,
            currently_due: ['individual.verification.document'],
            disabled_reason: 'requirements.past_due',
            errors: [],
            eventually_due: [],
            past_due: ['individual.verification.document'],
            pending_verification: [],
          },
        })
      )
    ).toBe(StripeConnectedAccountStatus.RESTRICTED)
  })

  it('keeps incomplete accounts pending when Stripe has not restricted them', () => {
    expect(deriveStripeConnectedAccountStatus(account())).toBe(
      StripeConnectedAccountStatus.PENDING
    )
  })

  it('builds only same-origin return and refresh URLs', () => {
    expect(
      buildStripeOnboardingUrls('https://preview.onprez.com/some/path', 'business / 1')
    ).toEqual({
      refreshUrl:
        'https://preview.onprez.com/api/business/payments/stripe/refresh?businessId=business%20%2F%201',
      returnUrl:
        'https://preview.onprez.com/api/business/payments/stripe/return?businessId=business%20%2F%201',
    })
  })

  it('persists only operational Stripe account readiness and requirements', async () => {
    const stripeAccount = account({
      details_submitted: true,
      requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: ['company.tax_id', 'company.tax_id'],
        disabled_reason: null,
        errors: [],
        eventually_due: ['representative.id_number'],
        past_due: [],
        pending_verification: [],
      },
    })

    stripeConnectedAccount.findUnique.mockResolvedValue(null)
    stripeConnectedAccount.upsert.mockResolvedValue({ id: 'connection-1' })

    await syncStripeConnectedAccount(stripeAccount)

    expect(stripeConnectedAccount.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: 'business-1' },
        create: expect.objectContaining({
          businessId: 'business-1',
          stripeAccountId: 'acct_onprez_test',
          detailsSubmitted: true,
          requirementsDue: ['company.tax_id'],
          requirementsEventuallyDue: ['representative.id_number'],
        }),
      })
    )
  })
})
