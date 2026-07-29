/** @jest-environment node */

import webpush from 'web-push'

import { prisma } from '@/lib/prisma'
import { sendPushTestNotification } from '@/lib/push/test-delivery'

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  },
}))
jest.mock('@/lib/push/config', () => ({
  isPushConfigured: jest.fn(() => true),
  getVapidDetails: jest.fn(() => ({
    subject: 'mailto:support@onprez.com',
    publicKey: 'public-key',
    privateKey: 'private-key',
  })),
}))
jest.mock('@/lib/push/subscriptions', () => ({
  pruneExpiredPushSubscriptions: jest.fn().mockResolvedValue(0),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { warn: jest.fn() },
}))

const mockedFindMany = prisma.pushSubscription.findMany as jest.Mock
const mockedUpdateMany = prisma.pushSubscription.updateMany as jest.Mock
const mockedDeleteMany = prisma.pushSubscription.deleteMany as jest.Mock
const mockedSend = webpush.sendNotification as jest.Mock

const subscription = {
  id: 'subscription-1',
  endpoint: 'https://push.example.test/subscription',
  p256dh: 'p256dh',
  auth: 'auth',
}

describe('push test delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedFindMany.mockResolvedValue([subscription])
    mockedUpdateMany.mockResolvedValue({ count: 1 })
    mockedDeleteMany.mockResolvedValue({ count: 1 })
    mockedSend.mockResolvedValue({})
  })

  it('delivers a visible test payload and resets device failures', async () => {
    await expect(sendPushTestNotification('user-1')).resolves.toEqual({
      total: 1,
      delivered: 1,
      failed: 0,
      expired: 0,
    })

    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: subscription.endpoint }),
      expect.stringContaining('OnPrez booking alerts are working'),
      { TTL: 60, urgency: 'high' }
    )
    expect(mockedUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: subscription.id },
        data: expect.objectContaining({ failureCount: 0, lastFailureAt: null }),
      })
    )
  })

  it('removes an expired provider subscription', async () => {
    mockedSend.mockRejectedValue(Object.assign(new Error('Gone'), { statusCode: 410 }))

    await expect(sendPushTestNotification('user-1')).resolves.toEqual({
      total: 1,
      delivered: 0,
      failed: 0,
      expired: 1,
    })
    expect(mockedDeleteMany).toHaveBeenCalledWith({ where: { id: subscription.id } })
  })

  it('records a provider failure without deleting the subscription', async () => {
    mockedSend.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))

    await expect(sendPushTestNotification('user-1')).resolves.toEqual({
      total: 1,
      delivered: 0,
      failed: 1,
      expired: 0,
    })
    expect(mockedDeleteMany).not.toHaveBeenCalled()
    expect(mockedUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failureCount: { increment: 1 } }),
      })
    )
  })
})
