/** @jest-environment node */

import {
  getStripeClient,
  getStripeConfigurationStatus,
  getStripeWebhookSecret,
  isStripeConfigured,
  isStripeConnectConfigured,
  isStripeWebhookConfigured,
  resetStripeClientForTests,
} from '@/lib/stripe/config'

const originalEnvironment = { ...process.env }

describe('Stripe server configuration', () => {
  beforeEach(() => {
    process.env = { ...originalEnvironment }
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    resetStripeClientForTests()
  })

  afterAll(() => {
    process.env = originalEnvironment
  })

  it('does not require Stripe credentials during builds that do not use payments', () => {
    expect(getStripeConfigurationStatus()).toEqual({
      secretKeyConfigured: false,
      webhookSecretConfigured: false,
      publishableKeyConfigured: false,
    })
    expect(isStripeConnectConfigured()).toBe(false)
    expect(isStripeWebhookConfigured()).toBe(false)
    expect(isStripeConfigured()).toBe(false)
    expect(() => getStripeClient()).toThrow('STRIPE_SECRET_KEY is not configured')
    expect(() => getStripeWebhookSecret()).toThrow('STRIPE_WEBHOOK_SECRET is not configured')
  })

  it('allows hosted onboarding when the secret key exists before the webhook is configured', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_onprez_foundation'

    expect(isStripeConnectConfigured()).toBe(true)
    expect(isStripeWebhookConfigured()).toBe(false)
    expect(isStripeConfigured()).toBe(false)
  })

  it('creates one reusable server client when credentials are configured', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_onprez_foundation'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_onprez_foundation'
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_onprez_foundation'

    const firstClient = getStripeClient()
    const secondClient = getStripeClient()

    expect(firstClient).toBe(secondClient)
    expect(getStripeWebhookSecret()).toBe('whsec_onprez_foundation')
    expect(getStripeConfigurationStatus()).toEqual({
      secretKeyConfigured: true,
      webhookSecretConfigured: true,
      publishableKeyConfigured: true,
    })
    expect(isStripeConnectConfigured()).toBe(true)
    expect(isStripeWebhookConfigured()).toBe(true)
    expect(isStripeConfigured()).toBe(true)
  })
})
