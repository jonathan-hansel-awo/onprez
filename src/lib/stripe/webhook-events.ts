import { StripeWebhookEventStatus } from '@prisma/client'
import type Stripe from 'stripe'

import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'

const STALE_PROCESSING_EVENT_MS = 5 * 60 * 1000

function getStripeObjectId(event: Stripe.Event): string | null {
  const object = event.data.object as { id?: unknown }
  return typeof object?.id === 'string' ? object.id : null
}

function getObjectKey(event: Stripe.Event, objectId: string | null): string | null {
  return objectId ? `${event.type}:${objectId}` : null
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown Stripe webhook processing error'
}

export interface StripeWebhookProcessingResult {
  duplicate: boolean
  eventRecordId: string
}

export async function processStripeWebhookEvent(
  event: Stripe.Event,
  handler: () => Promise<void>
): Promise<StripeWebhookProcessingResult> {
  const objectId = getStripeObjectId(event)
  const objectKey = getObjectKey(event, objectId)
  const stripeCreatedAt = event.created ? new Date(event.created * 1000) : null
  let eventRecordId = event.id

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        objectKey,
        objectId,
        accountId: typeof event.account === 'string' ? event.account : null,
        livemode: event.livemode,
        stripeCreatedAt,
      },
    })
  } catch (error) {
    if ((error as { code?: string }).code !== 'P2002') throw error

    const existing = await prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
    })

    if (!existing) throw error
    eventRecordId = existing.id

    if (existing.status === StripeWebhookEventStatus.SUCCEEDED) {
      logger.info('stripe.webhook.duplicate_ignored', {
        eventId: event.id,
        eventType: event.type,
        eventRecordId,
        objectId,
      })
      return { duplicate: true, eventRecordId }
    }

    const retry = await prisma.stripeWebhookEvent.updateMany({
      where: {
        id: existing.id,
        OR: [
          { status: StripeWebhookEventStatus.FAILED },
          {
            status: StripeWebhookEventStatus.PROCESSING,
            updatedAt: { lt: new Date(Date.now() - STALE_PROCESSING_EVENT_MS) },
          },
        ],
      },
      data: {
        status: StripeWebhookEventStatus.PROCESSING,
        attempts: { increment: 1 },
        lastError: null,
        processedAt: null,
      },
    })

    if (retry.count === 0) {
      logger.info('stripe.webhook.processing_duplicate_ignored', {
        eventId: event.id,
        eventType: event.type,
        eventRecordId,
        objectId,
      })
      return { duplicate: true, eventRecordId }
    }
  }

  try {
    await handler()
    await prisma.stripeWebhookEvent.update({
      where: { id: eventRecordId },
      data: {
        status: StripeWebhookEventStatus.SUCCEEDED,
        processedAt: new Date(),
        lastError: null,
      },
    })

    logger.info('stripe.webhook.processed', {
      eventId: event.id,
      eventType: event.type,
      eventRecordId,
      objectId,
    })
    return { duplicate: false, eventRecordId }
  } catch (error) {
    const message = errorMessage(error)
    await prisma.stripeWebhookEvent.updateMany({
      where: { id: eventRecordId },
      data: {
        status: StripeWebhookEventStatus.FAILED,
        lastError: message.slice(0, 1_000),
      },
    })

    logger.error('stripe.webhook.failed', {
      eventId: event.id,
      eventType: event.type,
      eventRecordId,
      objectId,
      error: message,
    })
    throw error
  }
}
