import { FeatureKey } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { requireFeatureEntitlement } from '@/lib/features/entitlements'
import { isStripeConnectConfigured } from '@/lib/stripe/config'
import {
  createOrRetrieveStripeConnectedAccount,
  createStripeOnboardingLink,
} from '@/lib/stripe/connect-accounts'

function paymentsSettingsUrl(request: NextRequest, result: string) {
  const url = new URL('/dashboard/settings/payments', request.url)
  url.searchParams.set('stripe', result)
  return url
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', '/dashboard/settings/payments')
    return NextResponse.redirect(loginUrl)
  }

  const businessId = request.nextUrl.searchParams.get('businessId')?.trim()

  if (!businessId || !isStripeConnectConfigured()) {
    return NextResponse.redirect(paymentsSettingsUrl(request, 'error'))
  }

  try {
    await resolveWritableBusinessContext(user.id, businessId, [])
    await requireFeatureEntitlement(businessId, FeatureKey.BOOKING_DEPOSITS)

    const connectedAccount = await createOrRetrieveStripeConnectedAccount(businessId)
    const accountLink = await createStripeOnboardingLink({
      stripeAccountId: connectedAccount.stripeAccountId,
      businessId,
      origin: request.nextUrl.origin,
    })

    return NextResponse.redirect(accountLink.url)
  } catch (error) {
    console.error('Refresh Stripe onboarding link error:', error)
    return NextResponse.redirect(paymentsSettingsUrl(request, 'error'))
  }
}
