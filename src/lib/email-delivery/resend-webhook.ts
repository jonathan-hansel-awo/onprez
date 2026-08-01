import {
  EmailDeliveryEventSource,
  EmailDeliveryStatus,
  EmailSuppressionReason,
  Prisma,
} from '@prisma/client'
import type { WebhookEventPayload } from 'resend'
import { sanitizeEmailDeliveryError } from '@/lib/email-delivery/delivery'
import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'

const EVENT_STATUS: Partial<Record<WebhookEventPayload['type'], EmailDeliveryStatus>> = {
  'email.sent': EmailDeliveryStatus.SENT,
  'email.delivered': EmailDeliveryStatus.DELIVERED,
  'email.delivery_delayed': EmailDeliveryStatus.DELAYED,
  'email.bounced': EmailDeliveryStatus.BOUNCED,
  'email.complained': EmailDeliveryStatus.COMPLAINED,
  'email.failed': EmailDeliveryStatus.FAILED,
  'email.suppressed': EmailDeliveryStatus.SUPPRESSED,
}

const STATUS_PRIORITY: Record<EmailDeliveryStatus, number> = {
  PENDING: 0,
  SENT: 1,
  DELAYED: 2,
  FAILED: 3,
  DELIVERED: 4,
  SUPPRESSED: 5,
  BOUNCED: 6,
  COMPLAINED: 7,
}

function isEmailEvent(
  event: WebhookEventPayload
): event is Extract<WebhookEventPayload, { data: { email_id: string } }> {
  return event.type.startsWith('email.') && 'email_id' in event.data
}

function eventFailure(event: WebhookEventPayload): { code?: string; message?: string } {
  if (event.type === 'email.bounced') {
    return {
      code: `${event.data.bounce.type}:${event.data.bounce.subType}`.slice(0, 80),
      message: sanitizeEmailDeliveryError(event.data.bounce.message) || undefined,
    }
  }
  if (event.type === 'email.failed') {
    return {
      code: 'PROVIDER_FAILED',
      message: sanitizeEmailDeliveryError(event.data.failed.reason) || undefined,
    }
  }
  if (event.type === 'email.suppressed') {
    return {
      code: event.data.suppressed.type.slice(0, 80),
      message: sanitizeEmailDeliveryError(event.data.suppressed.message) || undefined,
    }
  }
  if (event.type === 'email.complained') {
    return { code: 'RECIPIENT_COMPLAINT', message: 'Recipient marked the email as spam' }
  }
  if (event.type === 'email.delivery_delayed') {
    return { code: 'DELIVERY_DELAYED', message: 'Recipient server temporarily delayed delivery' }
  }
  return {}
}

function suppressionReason(event: WebhookEventPayload): EmailSuppressionReason | null {
  if (event.type === 'email.bounced') return EmailSuppressionReason.BOUNCE
  if (event.type === 'email.complained') return EmailSuppressionReason.COMPLAINT
  if (event.type === 'email.suppressed') return EmailSuppressionReason.PROVIDER_SUPPRESSION
  return null
}

export async function processResendWebhookEvent(
  event: WebhookEventPayload,
  providerEventId: string
): Promise<'processed' | 'duplicate' | 'ignored' | 'unmatched'> {
  if (!isEmailEvent(event)) return 'ignored'

  const delivery = await prisma.emailDelivery.findUnique({
    where: { providerMessageId: event.data.email_id },
    select: {
      id: true,
      status: true,
      recipientHash: true,
      recipientMasked: true,
      providerMessageId: true,
    },
  })

  if (!delivery) {
    logger.info('email.webhook.unmatched', { type: event.type })
    return 'unmatched'
  }

  const mappedStatus = EVENT_STATUS[event.type] || delivery.status
  const nextStatus =
    STATUS_PRIORITY[mappedStatus] >= STATUS_PRIORITY[delivery.status]
      ? mappedStatus
      : delivery.status
  const occurredAt = new Date(event.created_at)
  const safeOccurredAt = Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt
  const failure = eventFailure(event)
  const suppression = suppressionReason(event)

  try {
    await prisma.$transaction(async tx => {
      await tx.emailDeliveryEvent.create({
        data: {
          deliveryId: delivery.id,
          providerEventId,
          type: event.type,
          status: mappedStatus,
          source: EmailDeliveryEventSource.RESEND,
          errorCode: failure.code,
          errorMessage: failure.message,
          occurredAt: safeOccurredAt,
        },
      })

      await tx.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: nextStatus,
          ...(mappedStatus === EmailDeliveryStatus.DELIVERED
            ? { deliveredAt: safeOccurredAt, lastErrorCode: null, lastError: null }
            : {}),
          ...(failure.code ? { lastErrorCode: failure.code, lastError: failure.message } : {}),
        },
      })

      if (suppression) {
        await tx.emailSuppression.upsert({
          where: { recipientHash: delivery.recipientHash },
          create: {
            recipientHash: delivery.recipientHash,
            recipientMasked: delivery.recipientMasked,
            reason: suppression,
            providerMessageId: delivery.providerMessageId,
            occurredAt: safeOccurredAt,
          },
          update: {
            recipientMasked: delivery.recipientMasked,
            reason: suppression,
            providerMessageId: delivery.providerMessageId,
            active: true,
            occurredAt: safeOccurredAt,
          },
        })
      }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return 'duplicate'
    }
    throw error
  }

  logger.info('email.webhook.processed', { deliveryId: delivery.id, type: event.type })
  return 'processed'
}
