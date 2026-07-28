import {
  PushNotificationDeliveryStatus,
  PushNotificationEventType,
  PushNotificationOutboxStatus,
} from '@prisma/client'
import webpush from 'web-push'

import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
import { getVapidDetails, isPushConfigured } from '@/lib/push/config'
import { parseBookingPushPayload } from '@/lib/push/outbox'
import { pruneExpiredPushSubscriptions } from '@/lib/push/subscriptions'

const MAX_DELIVERY_ATTEMPTS = 4
const MAX_OUTBOX_ATTEMPTS = 5
const PROCESSING_LEASE_MS = 10 * 60_000
const BATCH_SIZE = 25
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000] as const

type PreferenceField = 'newBookingEnabled' | 'cancellationEnabled' | 'rescheduleEnabled'

export interface PushOutboxBatchResult {
  processed: number
  delivered: number
  partial: number
  failed: number
  noRecipients: number
}

function preferenceField(eventType: PushNotificationEventType): PreferenceField {
  switch (eventType) {
    case PushNotificationEventType.NEW_BOOKING:
      return 'newBookingEnabled'
    case PushNotificationEventType.BOOKING_CANCELLED:
      return 'cancellationEnabled'
    case PushNotificationEventType.BOOKING_RESCHEDULED:
      return 'rescheduleEnabled'
  }
}

function errorDetails(error: unknown): {
  statusCode?: number
  code: string
  message: string
  retryable: boolean
  expired: boolean
} {
  const candidate = error as {
    statusCode?: number
    code?: string
    message?: string
  }
  const statusCode = typeof candidate?.statusCode === 'number' ? candidate.statusCode : undefined
  const code = candidate?.code || (statusCode ? `HTTP_${statusCode}` : 'PUSH_PROVIDER_ERROR')
  const message = candidate?.message || 'Push provider request failed'
  const expired = statusCode === 404 || statusCode === 410
  const retryable = !statusCode || statusCode === 408 || statusCode === 429 || statusCode >= 500

  return { statusCode, code, message, retryable, expired }
}

function retryDelay(attempts: number): number {
  return RETRY_DELAYS_MS[Math.min(Math.max(attempts - 1, 0), RETRY_DELAYS_MS.length - 1)]
}

async function createDeliveries(
  outboxId: string,
  businessId: string,
  eventType: PushNotificationEventType
) {
  await pruneExpiredPushSubscriptions()

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      ownerId: true,
      members: { select: { userId: true } },
    },
  })

  if (!business) return 0

  const recipientIds = [
    ...new Set([business.ownerId, ...business.members.map(member => member.userId)]),
  ]
  const preference = preferenceField(eventType)
  const users = await prisma.user.findMany({
    where: { id: { in: recipientIds } },
    select: {
      id: true,
      pushNotificationPreference: {
        select: {
          newBookingEnabled: true,
          cancellationEnabled: true,
          rescheduleEnabled: true,
        },
      },
      pushSubscriptions: {
        select: {
          id: true,
          deviceName: true,
        },
      },
    },
  })

  const deliveries = users.flatMap(user => {
    const enabled = user.pushNotificationPreference?.[preference] ?? true
    if (!enabled) return []

    return user.pushSubscriptions.map(subscription => ({
      outboxId,
      userId: user.id,
      subscriptionId: subscription.id,
      deviceName: subscription.deviceName,
    }))
  })

  if (deliveries.length === 0) return 0

  const result = await prisma.pushNotificationDelivery.createMany({
    data: deliveries,
    skipDuplicates: true,
  })
  return result.count
}

async function deliverToSubscription(
  delivery: {
    id: string
    attempts: number
    subscription: {
      id: string
      endpoint: string
      p256dh: string
      auth: string
    } | null
  },
  payload: string
) {
  const now = new Date()
  const attempts = delivery.attempts + 1

  if (!delivery.subscription) {
    await prisma.pushNotificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: PushNotificationDeliveryStatus.EXPIRED,
        attempts,
        lastAttemptAt: now,
        failureCode: 'SUBSCRIPTION_REMOVED',
        lastError: 'The browser subscription is no longer available.',
      },
    })
    return
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: delivery.subscription.endpoint,
        keys: {
          p256dh: delivery.subscription.p256dh,
          auth: delivery.subscription.auth,
        },
      },
      payload,
      { TTL: 5 * 60, urgency: 'high' }
    )

    await prisma.$transaction([
      prisma.pushNotificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: PushNotificationDeliveryStatus.DELIVERED,
          attempts,
          lastAttemptAt: now,
          deliveredAt: now,
          failureCode: null,
          lastError: null,
        },
      }),
      prisma.pushSubscription.update({
        where: { id: delivery.subscription.id },
        data: {
          failureCount: 0,
          lastFailureAt: null,
        },
      }),
    ])
  } catch (error) {
    const failure = errorDetails(error)
    const status = failure.expired
      ? PushNotificationDeliveryStatus.EXPIRED
      : failure.retryable && attempts < MAX_DELIVERY_ATTEMPTS
        ? PushNotificationDeliveryStatus.RETRY
        : PushNotificationDeliveryStatus.FAILED

    await prisma.pushNotificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status,
        attempts,
        lastAttemptAt: now,
        failureCode: failure.code,
        lastError: failure.message.slice(0, 1_000),
      },
    })

    if (failure.expired) {
      await prisma.pushSubscription.deleteMany({
        where: { id: delivery.subscription.id },
      })
    } else {
      await prisma.pushSubscription.updateMany({
        where: { id: delivery.subscription.id },
        data: {
          failureCount: { increment: 1 },
          lastFailureAt: now,
        },
      })
    }
  }
}

async function finalizeOutbox(outboxId: string) {
  const deliveries = await prisma.pushNotificationDelivery.findMany({
    where: { outboxId },
    select: { status: true, attempts: true },
  })
  const delivered = deliveries.filter(
    delivery => delivery.status === PushNotificationDeliveryStatus.DELIVERED
  ).length
  const retrying = deliveries.filter(
    delivery => delivery.status === PushNotificationDeliveryStatus.RETRY
  )
  const permanentlyFailed = deliveries.length - delivered - retrying.length
  const now = new Date()

  if (retrying.length > 0) {
    const nextAttempt = Math.min(...retrying.map(delivery => delivery.attempts))
    await prisma.pushNotificationOutbox.update({
      where: { id: outboxId },
      data: {
        status: PushNotificationOutboxStatus.PENDING,
        availableAt: new Date(now.getTime() + retryDelay(nextAttempt)),
        lastError: `${retrying.length} device delivery attempt(s) will be retried.`,
      },
    })
    return PushNotificationOutboxStatus.PENDING
  }

  const status =
    delivered === deliveries.length
      ? PushNotificationOutboxStatus.DELIVERED
      : delivered > 0 && permanentlyFailed > 0
        ? PushNotificationOutboxStatus.PARTIAL
        : PushNotificationOutboxStatus.FAILED

  await prisma.pushNotificationOutbox.update({
    where: { id: outboxId },
    data: {
      status,
      processedAt: now,
      lastError:
        permanentlyFailed > 0
          ? `${permanentlyFailed} device delivery attempt(s) could not be completed.`
          : null,
    },
  })
  return status
}

export async function processPushOutboxEvent(
  outboxId: string
): Promise<PushNotificationOutboxStatus | null> {
  if (!isPushConfigured()) {
    logger.warn('push.delivery.skipped_unconfigured', { outboxId })
    return null
  }

  const now = new Date()
  const staleBefore = new Date(now.getTime() - PROCESSING_LEASE_MS)
  const claimed = await prisma.pushNotificationOutbox.updateMany({
    where: {
      id: outboxId,
      attempts: { lt: MAX_OUTBOX_ATTEMPTS },
      OR: [
        {
          status: PushNotificationOutboxStatus.PENDING,
          availableAt: { lte: now },
        },
        {
          status: PushNotificationOutboxStatus.PROCESSING,
          lastAttemptAt: { lte: staleBefore },
        },
      ],
    },
    data: {
      status: PushNotificationOutboxStatus.PROCESSING,
      attempts: { increment: 1 },
      lastAttemptAt: now,
    },
  })

  if (claimed.count !== 1) return null

  try {
    const outbox = await prisma.pushNotificationOutbox.findUniqueOrThrow({
      where: { id: outboxId },
      select: {
        id: true,
        businessId: true,
        eventType: true,
        payload: true,
      },
    })
    const payload = parseBookingPushPayload(outbox.payload)

    await createDeliveries(outbox.id, outbox.businessId, outbox.eventType)
    const deliveries = await prisma.pushNotificationDelivery.findMany({
      where: {
        outboxId,
        status: {
          in: [PushNotificationDeliveryStatus.PENDING, PushNotificationDeliveryStatus.RETRY],
        },
        attempts: { lt: MAX_DELIVERY_ATTEMPTS },
      },
      select: {
        id: true,
        attempts: true,
        subscription: {
          select: {
            id: true,
            endpoint: true,
            p256dh: true,
            auth: true,
          },
        },
      },
    })

    if (deliveries.length === 0) {
      const deliveryCount = await prisma.pushNotificationDelivery.count({ where: { outboxId } })
      if (deliveryCount === 0) {
        await prisma.pushNotificationOutbox.update({
          where: { id: outboxId },
          data: {
            status: PushNotificationOutboxStatus.NO_RECIPIENTS,
            processedAt: new Date(),
            lastError: null,
          },
        })
        return PushNotificationOutboxStatus.NO_RECIPIENTS
      }
      return finalizeOutbox(outboxId)
    }

    const vapid = getVapidDetails()
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)
    const serializedPayload = JSON.stringify(payload)

    await Promise.all(
      deliveries.map(delivery => deliverToSubscription(delivery, serializedPayload))
    )
    const status = await finalizeOutbox(outboxId)
    logger.info('push.delivery.completed', {
      outboxId,
      eventType: outbox.eventType,
      status,
      deviceCount: deliveries.length,
    })
    return status
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Push delivery failed'
    const current = await prisma.pushNotificationOutbox.findUnique({
      where: { id: outboxId },
      select: { attempts: true },
    })
    const exhausted = (current?.attempts || 0) >= MAX_OUTBOX_ATTEMPTS
    await prisma.pushNotificationOutbox.update({
      where: { id: outboxId },
      data: {
        status: exhausted
          ? PushNotificationOutboxStatus.FAILED
          : PushNotificationOutboxStatus.PENDING,
        availableAt: exhausted ? undefined : new Date(Date.now() + retryDelay(1)),
        processedAt: exhausted ? new Date() : null,
        lastError: message.slice(0, 1_000),
      },
    })
    logger.error('push.delivery.failed', { outboxId, error })
    return exhausted ? PushNotificationOutboxStatus.FAILED : PushNotificationOutboxStatus.PENDING
  }
}

export async function deliverPushOutboxSafely(
  outboxId: string
): Promise<PushNotificationOutboxStatus | null> {
  try {
    return await processPushOutboxEvent(outboxId)
  } catch (error) {
    logger.error('push.delivery.unhandled_failure', { outboxId, error })
    return null
  }
}

export async function processDuePushOutbox(): Promise<PushOutboxBatchResult> {
  const now = new Date()
  const staleBefore = new Date(now.getTime() - PROCESSING_LEASE_MS)
  const due = await prisma.pushNotificationOutbox.findMany({
    where: {
      attempts: { lt: MAX_OUTBOX_ATTEMPTS },
      OR: [
        {
          status: PushNotificationOutboxStatus.PENDING,
          availableAt: { lte: now },
        },
        {
          status: PushNotificationOutboxStatus.PROCESSING,
          lastAttemptAt: { lte: staleBefore },
        },
      ],
    },
    orderBy: { availableAt: 'asc' },
    take: BATCH_SIZE,
    select: { id: true },
  })

  const statuses = await Promise.all(due.map(item => deliverPushOutboxSafely(item.id)))

  return statuses.reduce<PushOutboxBatchResult>(
    (result, status) => {
      if (!status) return result
      result.processed += 1
      if (status === PushNotificationOutboxStatus.DELIVERED) result.delivered += 1
      if (status === PushNotificationOutboxStatus.PARTIAL) result.partial += 1
      if (status === PushNotificationOutboxStatus.FAILED) result.failed += 1
      if (status === PushNotificationOutboxStatus.NO_RECIPIENTS) result.noRecipients += 1
      return result
    },
    { processed: 0, delivered: 0, partial: 0, failed: 0, noRecipients: 0 }
  )
}
