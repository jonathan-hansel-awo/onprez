import webpush from 'web-push'

import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
import { getVapidDetails, isPushConfigured } from '@/lib/push/config'
import { pruneExpiredPushSubscriptions } from '@/lib/push/subscriptions'

interface PushProviderError {
  statusCode?: number
  code?: string
  message?: string
}

export interface PushTestDeliveryResult {
  total: number
  delivered: number
  failed: number
  expired: number
}

function providerError(error: unknown) {
  const candidate = error as PushProviderError
  const statusCode = typeof candidate?.statusCode === 'number' ? candidate.statusCode : undefined

  return {
    statusCode,
    code: candidate?.code || (statusCode ? `HTTP_${statusCode}` : 'PUSH_PROVIDER_ERROR'),
    message: candidate?.message || 'Push provider request failed',
    expired: statusCode === 404 || statusCode === 410,
  }
}

export async function sendPushTestNotification(userId: string): Promise<PushTestDeliveryResult> {
  if (!isPushConfigured()) {
    throw new Error('Web Push is not configured with a valid matching VAPID key pair.')
  }

  await pruneExpiredPushSubscriptions(userId)

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  })

  if (subscriptions.length === 0) {
    return { total: 0, delivered: 0, failed: 0, expired: 0 }
  }

  const vapid = getVapidDetails()
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)
  const payload = JSON.stringify({
    title: 'OnPrez booking alerts are working',
    body: 'This device can receive new booking, cancellation, and reschedule notifications.',
    url: '/dashboard/settings/app',
    tag: 'onprez-push-test',
  })

  const outcomes = await Promise.all(
    subscriptions.map(async subscription => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
          { TTL: 60, urgency: 'high' }
        )

        await prisma.pushSubscription.updateMany({
          where: { id: subscription.id },
          data: {
            failureCount: 0,
            lastFailureAt: null,
            lastSeenAt: new Date(),
          },
        })

        return 'delivered' as const
      } catch (error) {
        const failure = providerError(error)

        if (failure.expired) {
          await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } })
          return 'expired' as const
        }

        await prisma.pushSubscription.updateMany({
          where: { id: subscription.id },
          data: {
            failureCount: { increment: 1 },
            lastFailureAt: new Date(),
          },
        })
        logger.warn('push.test_delivery.failed', {
          userId,
          subscriptionId: subscription.id,
          statusCode: failure.statusCode,
          failureCode: failure.code,
          error: failure.message,
        })
        return 'failed' as const
      }
    })
  )

  return {
    total: outcomes.length,
    delivered: outcomes.filter(outcome => outcome === 'delivered').length,
    failed: outcomes.filter(outcome => outcome === 'failed').length,
    expired: outcomes.filter(outcome => outcome === 'expired').length,
  }
}
