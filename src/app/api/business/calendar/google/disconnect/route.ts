import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { disconnectGoogleCalendar } from '@/lib/integrations/google-calendar'

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined
    const context = await resolveWritableBusinessContext(user.id, businessId || request)
    await disconnectGoogleCalendar(context.businessId)
    return NextResponse.json({ success: true, message: 'Google Calendar disconnected' })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Disconnect Google Calendar error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    )
  }
}
