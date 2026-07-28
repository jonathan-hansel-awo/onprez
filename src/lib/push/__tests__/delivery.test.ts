/** @jest-environment node */

import {
  PushNotificationDeliveryStatus,
  PushNotificationEventType,
  PushNotificationOutboxStatus,
} from '@prisma/client'
import webpush from 'web-push'

import { prisma } from '@/lib/prisma'
import { processPushOutboxEvent } from '@/lib/push/delivery'

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
    business: { findUnique: jest.fn() },
    user: { findMany: jest.fn() },
    pushNotificationOutbox: {
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    pushNotificationDelivery: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    pushSubscription: {
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const mockedPrisma = prisma as unknown as {
  business: { findUnique: jest.Mock }
  user: { findMany: jest.Mock }
  pushNotificationOutbox: {
    updateMany: jest.Mock
    findUniqueOrThrow: jest.Mock
    update: jest.Mock
  }
  pushNotificationDelivery: {
    createMany: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
    count: jest.Mock
  }
  pushSubscription: {
    update: jest.Mock
    updateMany: jest.Mock
    deleteMany: jest.Mock
  }
  $transaction: jest.Mock
}
const mockedSend = webpush.sendNotification as jest.Mock

const payload = {
  title: 'New booking from Ada',
  body: 'Ada · Massage · Monday, 10 August 2026 at 10:00',
  url: '/dashboard/bookings?businessId=business-1&bookingId=appointment-1',
  tag: 'booking-appointment-1-new_booking',
  eventType: PushNotificationEventType.NEW_BOOKING,
  bookingId: 'appointment-1',
}
const pendingDelivery = {
  id: 'delivery-1',
  attempts: 0,
  subscription: {
    id: 'subscription-1',
    endpoint: 'https://push.example.test/subscription',
    p256dh: 'p256dh',
    auth: 'auth',
  },
}

describe('push outbox delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedPrisma.pushNotificationOutbox.updateMany.mockResolvedValue({ count: 1 })
    mockedPrisma.pushNotificationOutbox.findUniqueOrThrow.mockResolvedValue({
      id: 'outbox-1',
      businessId: 'business-1',
      eventType: PushNotificationEventType.NEW_BOOKING,
      payload,
    })
    mockedPrisma.business.findUnique.mockResolvedValue({
      ownerId: 'user-1',
      members: [],
    })
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        pushNotificationPreference: { newBookingEnabled: true },
        pushSubscriptions: [{ id: 'subscription-1', deviceName: 'iPhone' }],
      },
    ])
    mockedPrisma.pushNotificationDelivery.createMany.mockResolvedValue({ count: 1 })
    mockedPrisma.pushNotificationDelivery.findMany
      .mockResolvedValueOnce([pendingDelivery])
      .mockResolvedValueOnce([{ status: PushNotificationDeliveryStatus.DELIVERED, attempts: 1 }])
    mockedPrisma.$transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations)
    )
    mockedSend.mockResolvedValue({})
  })

  it('delivers a safe payload and records per-device success', async () => {
    await expect(processPushOutboxEvent('outbox-1')).resolves.toBe(
      PushNotificationOutboxStatus.DELIVERED
    )

    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: pendingDelivery.subscription.endpoint }),
      JSON.stringify(payload),
      { TTL: 300, urgency: 'high' }
    )
    expect(mockedPrisma.pushNotificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PushNotificationDeliveryStatus.DELIVERED,
          attempts: 1,
        }),
      })
    )
    expect(mockedPrisma.pushNotificationOutbox.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PushNotificationOutboxStatus.DELIVERED }),
      })
    )
  })

  it('removes a 410 subscription while retaining an expired delivery record', async () => {
    mockedSend.mockRejectedValue(
      Object.assign(new Error('Subscription is gone'), { statusCode: 410 })
    )
    mockedPrisma.pushNotificationDelivery.findMany
      .mockReset()
      .mockResolvedValueOnce([pendingDelivery])
      .mockResolvedValueOnce([{ status: PushNotificationDeliveryStatus.EXPIRED, attempts: 1 }])

    await expect(processPushOutboxEvent('outbox-1')).resolves.toBe(
      PushNotificationOutboxStatus.FAILED
    )

    expect(mockedPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { id: 'subscription-1' },
    })
    expect(mockedPrisma.pushNotificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PushNotificationDeliveryStatus.EXPIRED,
          failureCode: 'HTTP_410',
        }),
      })
    )
  })

  it('schedules a bounded retry after a transient provider failure', async () => {
    mockedSend.mockRejectedValue(
      Object.assign(new Error('Push provider unavailable'), { statusCode: 503 })
    )
    mockedPrisma.pushNotificationDelivery.findMany
      .mockReset()
      .mockResolvedValueOnce([pendingDelivery])
      .mockResolvedValueOnce([{ status: PushNotificationDeliveryStatus.RETRY, attempts: 1 }])

    await expect(processPushOutboxEvent('outbox-1')).resolves.toBe(
      PushNotificationOutboxStatus.PENDING
    )

    expect(mockedPrisma.pushNotificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PushNotificationDeliveryStatus.RETRY,
          failureCode: 'HTTP_503',
        }),
      })
    )
    expect(mockedPrisma.pushNotificationOutbox.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PushNotificationOutboxStatus.PENDING,
          availableAt: expect.any(Date),
        }),
      })
    )
  })

  it('records a no-recipient outcome when preferences disable the event', async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        pushNotificationPreference: { newBookingEnabled: false },
        pushSubscriptions: [{ id: 'subscription-1', deviceName: 'iPhone' }],
      },
    ])
    mockedPrisma.pushNotificationDelivery.findMany.mockReset().mockResolvedValueOnce([])
    mockedPrisma.pushNotificationDelivery.count.mockResolvedValue(0)

    await expect(processPushOutboxEvent('outbox-1')).resolves.toBe(
      PushNotificationOutboxStatus.NO_RECIPIENTS
    )

    expect(mockedSend).not.toHaveBeenCalled()
  })
})
