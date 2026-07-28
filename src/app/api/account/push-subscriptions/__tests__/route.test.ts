/** @jest-environment node */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { getPublicVapidKey, isPushConfigured } from '@/lib/push/config'
import {
  getPushNotificationPreferences,
  pruneExpiredPushSubscriptions,
} from '@/lib/push/subscriptions'
import { GET, POST } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))
jest.mock('@/lib/push/config', () => ({
  getPublicVapidKey: jest.fn(),
  isPushConfigured: jest.fn(),
}))
jest.mock('@/lib/push/subscriptions', () => ({
  MAX_PUSH_SUBSCRIPTIONS_PER_USER: 10,
  getPushNotificationPreferences: jest.fn(),
  pruneExpiredPushSubscriptions: jest.fn(),
}))

const mockedUser = getCurrentUser as jest.Mock
const mockedFindMany = prisma.pushSubscription.findMany as jest.Mock
const mockedFindUnique = prisma.pushSubscription.findUnique as jest.Mock
const mockedCount = prisma.pushSubscription.count as jest.Mock
const mockedUpsert = prisma.pushSubscription.upsert as jest.Mock
const mockedConfigured = isPushConfigured as jest.Mock
const mockedPublicKey = getPublicVapidKey as jest.Mock
const mockedPreferences = getPushNotificationPreferences as jest.Mock
const mockedPrune = pruneExpiredPushSubscriptions as jest.Mock

function postRequest(body: unknown, origin = 'https://onprez.test'): NextRequest {
  return new NextRequest('https://onprez.test/api/account/push-subscriptions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
      'user-agent': 'OnPrez test browser',
    },
    body: JSON.stringify(body),
  })
}

const validSubscription = {
  endpoint: 'https://push.example.test/subscription-1',
  expirationTime: null,
  keys: {
    p256dh: 'public_key-material',
    auth: 'auth_key-material',
  },
  deviceName: 'Test phone',
}

describe('push subscriptions API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUser.mockResolvedValue({ id: 'user-1' })
    mockedConfigured.mockReturnValue(true)
    mockedPublicKey.mockReturnValue('public_key-material')
    mockedPreferences.mockResolvedValue({
      newBookingEnabled: true,
      cancellationEnabled: true,
      rescheduleEnabled: true,
    })
    mockedPrune.mockResolvedValue(0)
    mockedFindMany.mockResolvedValue([])
    mockedFindUnique.mockResolvedValue(null)
    mockedCount.mockResolvedValue(0)
    mockedUpsert.mockResolvedValue({
      id: 'subscription-1',
      endpoint: validSubscription.endpoint,
      deviceName: 'Test phone',
    })
  })

  it('returns subscriptions, preferences, and the public application key', async () => {
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mockedPrune).toHaveBeenCalledWith('user-1')
    expect(payload.data).toMatchObject({
      configured: true,
      vapidPublicKey: 'public_key-material',
      subscriptionLimit: 10,
    })
  })

  it('rejects cross-origin subscription writes before authentication', async () => {
    const response = await POST(postRequest(validSubscription, 'https://attacker.test'))

    expect(response.status).toBe(403)
    expect(mockedUser).not.toHaveBeenCalled()
    expect(mockedUpsert).not.toHaveBeenCalled()
  })

  it('refuses subscriptions until VAPID is fully configured', async () => {
    mockedConfigured.mockReturnValue(false)

    const response = await POST(postRequest(validSubscription))

    expect(response.status).toBe(503)
    expect(mockedUpsert).not.toHaveBeenCalled()
  })

  it('creates a new subscription without exposing another user account', async () => {
    const response = await POST(postRequest(validSubscription))

    expect(response.status).toBe(201)
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { endpoint: validSubscription.endpoint },
        create: expect.objectContaining({
          userId: 'user-1',
          endpoint: validSubscription.endpoint,
        }),
      })
    )
  })

  it('does not reassign an existing endpoint owned by another user', async () => {
    mockedFindUnique.mockResolvedValue({ id: 'subscription-2', userId: 'user-2' })

    const response = await POST(postRequest(validSubscription))

    expect(response.status).toBe(409)
    expect(mockedUpsert).not.toHaveBeenCalled()
  })

  it('enforces the per-user device limit', async () => {
    mockedCount.mockResolvedValue(10)

    const response = await POST(postRequest(validSubscription))

    expect(response.status).toBe(409)
    expect(mockedUpsert).not.toHaveBeenCalled()
  })
})
