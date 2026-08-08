/**
 * @jest-environment node
 */

import { buildGoogleCalendarAuthorizationUrl } from '@/lib/integrations/google-calendar'

jest.mock('@/lib/prisma', () => ({
  prisma: {},
}))

describe('Google Calendar OAuth', () => {
  beforeEach(() => {
    process.env.GOOGLE_CALENDAR_CLIENT_ID = 'google-client-id'
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'google-client-secret'
    process.env.GOOGLE_CALENDAR_REDIRECT_URI =
      'https://onprez.com/api/business/calendar/google/callback'
  })

  it('requests event access only for calendars owned by the connected account', () => {
    const authorizationUrl = new URL(buildGoogleCalendarAuthorizationUrl('oauth-state'))
    const scopes = authorizationUrl.searchParams.get('scope')?.split(' ')

    expect(scopes).toEqual([
      'https://www.googleapis.com/auth/calendar.events.owned',
      'openid',
      'email',
    ])
    expect(scopes).not.toContain('https://www.googleapis.com/auth/calendar.events')
  })
})
