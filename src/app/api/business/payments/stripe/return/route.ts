import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { retrieveAndSyncStripeConnectedAccount } from '@/lib/stripe/connect-accounts'

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

  if (!businessId) {
    return NextResponse.redirect(paymentsSettingsUrl(request, 'missing-business'))
  }

  try {
    await resolveWritableBusinessContext(user.id, businessId, [])
    const account = await retrieveAndSyncStripeConnectedAccount(businessId)

    return NextResponse.redirect(
      paymentsSettingsUrl(request, account?.status === 'READY' ? 'ready' : 'returned')
    )
  } catch (error) {
    console.error('Stripe onboarding return error:', error)
    return NextResponse.redirect(paymentsSettingsUrl(request, 'error'))
  }
}
