/** @jest-environment node */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { getPushNotificationPreferences } from '@/lib/push/subscriptions'
import { GET, PUT } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    pushNotificationPreference: { upsert: jest.fn() },
  },
}))
jest.mock('@/lib/push/subscriptions', () => ({
  getPushNotificationPreferences: jest.fn(),
}))

const mockedUser = getCurrentUser as jest.Mock
const mockedPreferences = getPushNotificationPreferences as jest.Mock
const mockedUpsert = prisma.pushNotificationPreference.upsert as jest.Mock

function request(body: unknown, origin = 'https://onprez.test') {
  return new NextRequest('https://onprez.test/api/account/notification-preferences', {
    method: 'PUT',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  })
}

const preferences = {
  newBookingEnabled: true,
  cancellationEnabled: false,
  rescheduleEnabled: true,
}

describe('push notification preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUser.mockResolvedValue({ id: 'user-1' })
    mockedPreferences.mockResolvedValue(preferences)
    mockedUpsert.mockResolvedValue(preferences)
  })

  it('returns defaults or the authenticated user preferences', async () => {
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mockedPreferences).toHaveBeenCalledWith('user-1')
    expect(payload.data.preferences).toEqual(preferences)
  })

  it('updates all push-event preferences atomically', async () => {
    const response = await PUT(request(preferences))

    expect(response.status).toBe(200)
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        update: preferences,
        create: { userId: 'user-1', ...preferences },
      })
    )
  })

  it('rejects partial preference payloads', async () => {
    const response = await PUT(request({ newBookingEnabled: true }))

    expect(response.status).toBe(400)
    expect(mockedUpsert).not.toHaveBeenCalled()
  })

  it('rejects cross-origin updates before authentication', async () => {
    const response = await PUT(request(preferences, 'https://attacker.test'))

    expect(response.status).toBe(403)
    expect(mockedUser).not.toHaveBeenCalled()
  })
})
