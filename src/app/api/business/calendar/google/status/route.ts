import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import {
  getGoogleCalendarOAuthConfig,
  readGoogleCalendarConnection,
} from '@/lib/integrations/google-calendar'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const businessId = request.nextUrl.searchParams.get('businessId')
    const context = await resolveReadableBusinessContext(user.id, businessId || request)
    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: { id: true, name: true, settings: true },
    })
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const connection = readGoogleCalendarConnection(business.settings)
    return NextResponse.json({
      success: true,
      data: {
        business: { id: business.id, name: business.name },
        configured: getGoogleCalendarOAuthConfig().configured,
        connected: Boolean(connection),
        connection: connection
          ? {
              accountEmail: connection.accountEmail,
              calendarId: connection.calendarId,
              connectedAt: connection.connectedAt,
              lastSyncedAt: connection.lastSyncedAt,
              lastError: connection.lastError,
            }
          : null,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Google Calendar status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load Google Calendar status' },
      { status: 500 }
    )
  }
}
