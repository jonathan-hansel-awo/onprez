import Stripe from 'stripe'

let stripeClient: Stripe | null = null

function readEnvironmentValue(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

export function getStripeConfigurationStatus() {
  return {
    secretKeyConfigured: Boolean(readEnvironmentValue('STRIPE_SECRET_KEY')),
    webhookSecretConfigured: Boolean(readEnvironmentValue('STRIPE_WEBHOOK_SECRET')),
    publishableKeyConfigured: Boolean(readEnvironmentValue('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')),
  }
}

export function isStripeConnectConfigured(): boolean {
  return getStripeConfigurationStatus().secretKeyConfigured
}

export function isStripeWebhookConfigured(): boolean {
  const status = getStripeConfigurationStatus()
  return status.secretKeyConfigured && status.webhookSecretConfigured
}

export function isStripeConfigured(): boolean {
  return isStripeWebhookConfigured()
}

export function getStripeClient(): Stripe {
  const secretKey = readEnvironmentValue('STRIPE_SECRET_KEY')

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      appInfo: {
        name: 'OnPrez',
        version: '0.1.0',
        url: 'https://onprez.com',
      },
      httpClient: Stripe.createNodeHttpClient(),
      maxNetworkRetries: 2,
      timeout: 20_000,
      typescript: true,
    })
  }

  return stripeClient
}

export function getStripeWebhookSecret(): string {
  const webhookSecret = readEnvironmentValue('STRIPE_WEBHOOK_SECRET')

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  return webhookSecret
}

export function resetStripeClientForTests(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Stripe client reset is only available in the test environment')
  }

  stripeClient = null
}
