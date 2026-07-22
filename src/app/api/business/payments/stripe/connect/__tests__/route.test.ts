/** @jest-environment node */

import { FeatureKey } from '@prisma/client'
import { NextRequest } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { FeatureNotEntitledError, requireFeatureEntitlement } from '@/lib/features/entitlements'
import { isStripeConnectConfigured } from '@/lib/stripe/config'
import {
  createOrRetrieveStripeConnectedAccount,
  createStripeOnboardingLink,
} from '@/lib/stripe/connect-accounts'
import { POST } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({ businessAuthErrorResponse: jest.fn() }))
jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveWritableBusinessContext: jest.fn(),
}))
jest.mock('@/lib/features/entitlements', () => ({
  FeatureNotEntitledError: class FeatureNotEntitledError extends Error {
    readonly code = 'FEATURE_NOT_ENTITLED'

    constructor(
      readonly businessId: string,
      readonly feature: FeatureKey
    ) {
      super('Not entitled')
    }
  },
  requireFeatureEntitlement: jest.fn(),
}))
jest.mock('@/lib/stripe/config', () => ({ isStripeConnectConfigured: jest.fn() }))
jest.mock('@/lib/stripe/connect-accounts', () => ({
  createOrRetrieveStripeConnectedAccount: jest.fn(),
  createStripeOnboardingLink: jest.fn(),
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveBusiness = resolveWritableBusinessContext as jest.Mock
const mockedRequireEntitlement = requireFeatureEntitlement as jest.Mock
const mockedStripeConfigured = isStripeConnectConfigured as jest.Mock
const mockedCreateAccount = createOrRetrieveStripeConnectedAccount as jest.Mock
const mockedCreateLink = createStripeOnboardingLink as jest.Mock

function request(origin = 'https://onprez.test') {
  return new NextRequest('https://onprez.test/api/business/payments/stripe/connect', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
    },
    body: JSON.stringify({ businessId: 'business-1' }),
  })
}

describe('POST /api/business/payments/stripe/connect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockedResolveBusiness.mockResolvedValue({
      businessId: 'business-1',
      business: { id: 'business-1', name: 'Test Business', slug: 'test-business' },
      isOwner: true,
      role: 'OWNER',
    })
    mockedRequireEntitlement.mockResolvedValue({ enabled: true })
    mockedStripeConfigured.mockReturnValue(true)
    mockedCreateAccount.mockResolvedValue({
      stripeAccountId: 'acct_test',
      status: 'PENDING',
    })
    mockedCreateLink.mockResolvedValue({
      url: 'https://connect.stripe.test/setup',
      expires_at: 2_000_000_000,
    })
  })

  it('rejects cross-origin attempts before creating financial connections', async () => {
    const response = await POST(request('https://attacker.test'))

    expect(response.status).toBe(403)
    expect(mockedGetCurrentUser).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await POST(request())

    expect(response.status).toBe(401)
  })

  it('uses an owner-only business context', async () => {
    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(mockedResolveBusiness).toHaveBeenCalledWith('user-1', 'business-1', [])
  })

  it('blocks businesses without Booking Protection entitlement', async () => {
    mockedRequireEntitlement.mockRejectedValue(
      new FeatureNotEntitledError('business-1', FeatureKey.BOOKING_DEPOSITS)
    )

    const response = await POST(request())
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe('FEATURE_NOT_ENTITLED')
    expect(mockedCreateAccount).not.toHaveBeenCalled()
  })

  it('returns a single-use Stripe hosted onboarding URL', async () => {
    const response = await POST(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.url).toBe('https://connect.stripe.test/setup')
    expect(mockedRequireEntitlement).toHaveBeenCalledWith('business-1', FeatureKey.BOOKING_DEPOSITS)
    expect(mockedCreateLink).toHaveBeenCalledWith({
      stripeAccountId: 'acct_test',
      businessId: 'business-1',
      origin: 'https://onprez.test',
    })
  })
})
