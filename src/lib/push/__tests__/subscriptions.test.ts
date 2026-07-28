/** @jest-environment node */

import { prisma } from '@/lib/prisma'
import {
  DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
  getPushNotificationPreferences,
  pruneExpiredPushSubscriptions,
} from '@/lib/push/subscriptions'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: { deleteMany: jest.fn() },
    pushNotificationPreference: { findUnique: jest.fn() },
  },
}))

const mockedDeleteMany = prisma.pushSubscription.deleteMany as jest.Mock
const mockedFindPreference = prisma.pushNotificationPreference.findUnique as jest.Mock

describe('push subscription persistence helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deletes only expired subscriptions for the selected user', async () => {
    mockedDeleteMany.mockResolvedValue({ count: 2 })

    await expect(pruneExpiredPushSubscriptions('user-1')).resolves.toBe(2)
    expect(mockedDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        expiresAt: { lte: expect.any(Date) },
      },
    })
  })

  it('uses safe defaults until a user saves preferences', async () => {
    mockedFindPreference.mockResolvedValue(null)

    await expect(getPushNotificationPreferences('user-1')).resolves.toEqual(
      DEFAULT_PUSH_NOTIFICATION_PREFERENCES
    )
  })
})
