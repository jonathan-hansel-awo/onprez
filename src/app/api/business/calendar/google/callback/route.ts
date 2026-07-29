import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import {
  exchangeGoogleCalendarCode,
  GOOGLE_CALENDAR_OAUTH_COOKIE,
  storeGoogleCalendarConnection,
} from '@/lib/integrations/google-calendar'

function redirect(request: NextRequest, result: string) {
  const url = new URL('/dashboard/settings/calendar', request.nextUrl.origin)
  url.searchParams.set('google', result)
  const response = NextResponse.redirect(url)
  response.cookies.delete(GOOGLE_CALENDAR_OAUTH_COOKIE)
  return response
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return redirect(request, 'unauthorized')

    if (request.nextUrl.searchParams.get('error')) return redirect(request, 'cancelled')
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const encoded = request.cookies.get(GOOGLE_CALENDAR_OAUTH_COOKIE)?.value
    if (!code || !state || !encoded) return redirect(request, 'invalid')

    const stored = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      state?: string
      businessId?: string
    }
    if (stored.state !== state || !stored.businessId) return redirect(request, 'invalid')

    const context = await resolveWritableBusinessContext(user.id, stored.businessId)
    const tokens = await exchangeGoogleCalendarCode(code)
    if (!tokens.refresh_token) return redirect(request, 'refresh-token-missing')

    await storeGoogleCalendarConnection({
      businessId: context.businessId,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      scopes: tokens.scope,
    })
    return redirect(request, 'connected')
  } catch (error) {
    console.error('Google Calendar callback error:', error)
    return redirect(request, 'error')
  }
}
