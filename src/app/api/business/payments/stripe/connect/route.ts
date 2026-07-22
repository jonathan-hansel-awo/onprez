import { FeatureKey } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { FeatureNotEntitledError, requireFeatureEntitlement } from '@/lib/features/entitlements'
import { isStripeConnectConfigured } from '@/lib/stripe/config'
import {
  createOrRetrieveStripeConnectedAccount,
  createStripeOnboardingLink,
} from '@/lib/stripe/connect-accounts'

function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  return !origin || origin === request.nextUrl.origin
}

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json({ success: false, error: 'Invalid request origin' }, { status: 403 })
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined
    const context = await resolveWritableBusinessContext(user.id, businessId || request, [])

    await requireFeatureEntitlement(context.businessId, FeatureKey.BOOKING_DEPOSITS)

    if (!isStripeConnectConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe Connect is not configured for this environment',
        },
        { status: 503 }
      )
    }

    const connectedAccount = await createOrRetrieveStripeConnectedAccount(context.businessId)
    const accountLink = await createStripeOnboardingLink({
      stripeAccountId: connectedAccount.stripeAccountId,
      businessId: context.businessId,
      origin: request.nextUrl.origin,
    })

    return NextResponse.json({
      success: true,
      data: {
        url: accountLink.url,
        expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
        accountStatus: connectedAccount.status,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof FeatureNotEntitledError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking Protection is not enabled for this business',
          code: error.code,
        },
        { status: 403 }
      )
    }

    console.error('Start Stripe onboarding error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start Stripe onboarding' },
      { status: 500 }
    )
  }
}
