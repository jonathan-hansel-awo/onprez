import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import {
  buildGoogleCalendarAuthorizationUrl,
  GOOGLE_CALENDAR_OAUTH_COOKIE,
  getGoogleCalendarOAuthConfig,
} from '@/lib/integrations/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined
    const context = await resolveWritableBusinessContext(user.id, businessId || request)
    const config = getGoogleCalendarOAuthConfig()
    if (!config.configured) {
      return NextResponse.json(
        { success: false, error: 'Google Calendar has not been configured for this environment' },
        { status: 503 }
      )
    }

    const state = randomBytes(32).toString('hex')
    const response = NextResponse.json({
      success: true,
      data: { url: buildGoogleCalendarAuthorizationUrl(state, user.email) },
    })
    response.cookies.set(
      GOOGLE_CALENDAR_OAUTH_COOKIE,
      Buffer.from(JSON.stringify({ state, businessId: context.businessId })).toString('base64url'),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 10 * 60,
      }
    )
    return response
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Start Google Calendar connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start Google Calendar connection' },
      { status: 500 }
    )
  }
}
