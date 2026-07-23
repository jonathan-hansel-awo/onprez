import { FeatureKey } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { getFeatureEntitlement, isFeatureEntitlementActive } from '@/lib/features/entitlements'
import { prisma } from '@/lib/prisma'
import { getStripeConfigurationStatus, isStripeConnectConfigured } from '@/lib/stripe/config'
import { retrieveAndSyncStripeConnectedAccount } from '@/lib/stripe/connect-accounts'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveWritableBusinessContext(user.id, request, [])
    const entitlement = await getFeatureEntitlement(context.businessId, FeatureKey.BOOKING_DEPOSITS)
    const entitled = isFeatureEntitlementActive(entitlement)
    const configuration = getStripeConfigurationStatus()

    let connectedAccount = await prisma.stripeConnectedAccount.findUnique({
      where: { businessId: context.businessId },
    })
    let syncWarning: string | null = null

    if (connectedAccount && isStripeConnectConfigured()) {
      try {
        connectedAccount = await retrieveAndSyncStripeConnectedAccount(context.businessId)
      } catch (error) {
        console.error('Stripe connected account sync error:', error)
        syncWarning = 'Stripe account status could not be refreshed. Showing the last known state.'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        business: {
          id: context.business.id,
          name: context.business.name,
          slug: context.business.slug,
        },
        ownerOnly: true,
        entitlement: {
          enabled: entitled,
          source: entitlement?.source || null,
          expiresAt: entitlement?.expiresAt?.toISOString() || null,
        },
        platform: {
          connectConfigured: configuration.secretKeyConfigured,
          webhookConfigured: configuration.webhookSecretConfigured,
        },
        account: connectedAccount
          ? {
              stripeAccountId: connectedAccount.stripeAccountId,
              country: connectedAccount.country,
              defaultCurrency: connectedAccount.defaultCurrency,
              detailsSubmitted: connectedAccount.detailsSubmitted,
              chargesEnabled: connectedAccount.chargesEnabled,
              payoutsEnabled: connectedAccount.payoutsEnabled,
              status: connectedAccount.status,
              disabledReason: connectedAccount.disabledReason,
              requirementsDue: connectedAccount.requirementsDue,
              requirementsPastDue: connectedAccount.requirementsPastDue,
              requirementsEventuallyDue: connectedAccount.requirementsEventuallyDue,
              lastSyncedAt: connectedAccount.lastSyncedAt?.toISOString() || null,
            }
          : null,
        syncWarning,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get Stripe onboarding status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load payment connection status' },
      { status: 500 }
    )
  }
}
