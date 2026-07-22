import { StripeConnectedAccountStatus, type StripeConnectedAccount } from '@prisma/client'
import type Stripe from 'stripe'

import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe/config'

function uniqueRequirements(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

export function deriveStripeConnectedAccountStatus(
  account: Pick<Stripe.Account, 'charges_enabled' | 'payouts_enabled' | 'requirements'>
): StripeConnectedAccountStatus {
  if (account.charges_enabled && account.payouts_enabled) {
    return StripeConnectedAccountStatus.READY
  }

  const requirements = account.requirements
  const restricted = Boolean(requirements?.disabled_reason) || Boolean(requirements?.past_due?.length)

  return restricted
    ? StripeConnectedAccountStatus.RESTRICTED
    : StripeConnectedAccountStatus.PENDING
}

export async function syncStripeConnectedAccount(
  account: Stripe.Account,
  fallbackBusinessId?: string
): Promise<StripeConnectedAccount> {
  const existing = await prisma.stripeConnectedAccount.findUnique({
    where: { stripeAccountId: account.id },
    select: { businessId: true },
  })

  const businessId =
    existing?.businessId || account.metadata?.onprezBusinessId || fallbackBusinessId?.trim()

  if (!businessId) {
    throw new Error(`Stripe account ${account.id} is not linked to an OnPrez business`)
  }

  const requirements = account.requirements

  return prisma.stripeConnectedAccount.upsert({
    where: { businessId },
    create: {
      businessId,
      stripeAccountId: account.id,
      country: account.country || null,
      defaultCurrency: account.default_currency || null,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      status: deriveStripeConnectedAccountStatus(account),
      disabledReason: requirements?.disabled_reason || null,
      requirementsDue: uniqueRequirements(requirements?.currently_due || []),
      requirementsPastDue: uniqueRequirements(requirements?.past_due || []),
      requirementsEventuallyDue: uniqueRequirements(requirements?.eventually_due || []),
      lastSyncedAt: new Date(),
    },
    update: {
      stripeAccountId: account.id,
      country: account.country || null,
      defaultCurrency: account.default_currency || null,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      status: deriveStripeConnectedAccountStatus(account),
      disabledReason: requirements?.disabled_reason || null,
      requirementsDue: uniqueRequirements(requirements?.currently_due || []),
      requirementsPastDue: uniqueRequirements(requirements?.past_due || []),
      requirementsEventuallyDue: uniqueRequirements(requirements?.eventually_due || []),
      lastSyncedAt: new Date(),
    },
  })
}

export async function retrieveAndSyncStripeConnectedAccount(
  businessId: string
): Promise<StripeConnectedAccount | null> {
  const connectedAccount = await prisma.stripeConnectedAccount.findUnique({
    where: { businessId },
  })

  if (!connectedAccount) return null

  const account = await getStripeClient().accounts.retrieve(connectedAccount.stripeAccountId)

  if (account.deleted) {
    return prisma.stripeConnectedAccount.update({
      where: { businessId },
      data: {
        status: StripeConnectedAccountStatus.DISCONNECTED,
        chargesEnabled: false,
        payoutsEnabled: false,
        disabledReason: 'account_deleted',
        lastSyncedAt: new Date(),
      },
    })
  }

  return syncStripeConnectedAccount(account, businessId)
}

export async function createOrRetrieveStripeConnectedAccount(
  businessId: string
): Promise<StripeConnectedAccount> {
  const existing = await retrieveAndSyncStripeConnectedAccount(businessId)
  if (existing) return existing

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      country: true,
      email: true,
      website: true,
      owner: { select: { email: true } },
    },
  })

  if (!business) {
    throw new Error('Business not found')
  }

  const account = await getStripeClient().accounts.create({
    type: 'standard',
    country: business.country === 'UK' ? 'GB' : business.country || 'GB',
    email: business.email || business.owner.email,
    business_profile: {
      name: business.name,
      url: business.website || undefined,
    },
    metadata: {
      onprezBusinessId: business.id,
    },
  })

  return syncStripeConnectedAccount(account, business.id)
}

export function buildStripeOnboardingUrls(origin: string, businessId: string) {
  const safeOrigin = new URL(origin).origin
  const encodedBusinessId = encodeURIComponent(businessId)

  return {
    refreshUrl: `${safeOrigin}/api/business/payments/stripe/refresh?businessId=${encodedBusinessId}`,
    returnUrl: `${safeOrigin}/api/business/payments/stripe/return?businessId=${encodedBusinessId}`,
  }
}

export async function createStripeOnboardingLink({
  stripeAccountId,
  businessId,
  origin,
}: {
  stripeAccountId: string
  businessId: string
  origin: string
}): Promise<Stripe.AccountLink> {
  const { refreshUrl, returnUrl } = buildStripeOnboardingUrls(origin, businessId)

  return getStripeClient().accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
}
