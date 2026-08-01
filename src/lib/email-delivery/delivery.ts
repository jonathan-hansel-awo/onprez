import { createHmac } from 'node:crypto'
import {
  EmailDeliveryAudience,
  EmailDeliveryCategory,
  EmailDeliveryEventSource,
  EmailDeliveryStatus,
  Prisma,
  type AppointmentStatus,
} from '@prisma/client'
import { env } from '@/lib/config/env'
import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
import { sendEmail, type EmailResult, type SendEmailOptions } from '@/lib/services/email'

const RETRYABLE_STATUSES: EmailDeliveryStatus[] = [
  EmailDeliveryStatus.FAILED,
  EmailDeliveryStatus.DELAYED,
]

const SUCCESS_STATUSES: EmailDeliveryStatus[] = [
  EmailDeliveryStatus.SENT,
  EmailDeliveryStatus.DELIVERED,
]

export interface TrackedEmailContext {
  businessId: string
  appointmentId?: string
  inquiryId?: string
  dedupeKey: string
  category: EmailDeliveryCategory
  audience: EmailDeliveryAudience
  appointmentStatus?: AppointmentStatus
  reminderType?: string
  maxAttempts?: number
}

export class EmailDeliveryRetryError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_FOUND'
      | 'NOT_RETRYABLE'
      | 'RETRY_LIMIT'
      | 'RECIPIENT_CHANGED'
      | 'CONTEXT_CHANGED'
  ) {
    super(message)
    this.name = 'EmailDeliveryRetryError'
  }
}

function normalizeRecipient(options: SendEmailOptions): string {
  if (Array.isArray(options.to)) {
    if (options.to.length !== 1) {
      throw new Error('Tracked emails require exactly one recipient')
    }
    return options.to[0].trim().toLowerCase()
  }

  return options.to.trim().toLowerCase()
}

export function hashEmailRecipient(recipient: string): string {
  return createHmac('sha256', env.JWT_SECRET).update(recipient.trim().toLowerCase()).digest('hex')
}

export function maskEmailRecipient(recipient: string): string {
  const normalized = recipient.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at <= 0) return 'Recipient unavailable'

  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)
  const visibleLocal = local.slice(0, Math.min(2, local.length))
  return `${visibleLocal}${'*'.repeat(Math.max(3, Math.min(8, local.length - visibleLocal.length)))}@${domain}`
}

export function sanitizeEmailDeliveryError(error?: string | null): string | null {
  if (!error) return null

  return error
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/https?:\/\/\S+/gi, '[redacted-url]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240)
}

async function appendApplicationEvent(
  deliveryId: string,
  type: string,
  status: EmailDeliveryStatus,
  errorCode?: string | null,
  errorMessage?: string | null
) {
  await prisma.emailDeliveryEvent.create({
    data: {
      deliveryId,
      type,
      status,
      source: EmailDeliveryEventSource.APPLICATION,
      errorCode,
      errorMessage: sanitizeEmailDeliveryError(errorMessage),
      occurredAt: new Date(),
    },
  })
}

async function attemptDelivery(
  delivery: {
    id: string
    recipientHash: string
  },
  options: SendEmailOptions
): Promise<EmailResult> {
  const recipient = normalizeRecipient(options)
  const recipientHash = hashEmailRecipient(recipient)

  if (recipientHash !== delivery.recipientHash) {
    throw new EmailDeliveryRetryError(
      'The recipient has changed. Send a fresh notification from the booking or inquiry instead.',
      'RECIPIENT_CHANGED'
    )
  }

  const suppression = await prisma.emailSuppression.findUnique({
    where: { recipientHash },
    select: { active: true, reason: true },
  })

  if (suppression?.active) {
    const error = 'Recipient is suppressed after a delivery or complaint event'
    await prisma.$transaction([
      prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: EmailDeliveryStatus.SUPPRESSED,
          lastErrorCode: suppression.reason,
          lastError: error,
        },
      }),
      prisma.emailDeliveryEvent.create({
        data: {
          deliveryId: delivery.id,
          type: 'application.suppressed',
          status: EmailDeliveryStatus.SUPPRESSED,
          source: EmailDeliveryEventSource.APPLICATION,
          errorCode: suppression.reason,
          errorMessage: error,
          occurredAt: new Date(),
        },
      }),
    ])
    return { success: false, error }
  }

  const result = await sendEmail(options)
  const now = new Date()

  if (result.success) {
    await prisma.$transaction([
      prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: EmailDeliveryStatus.SENT,
          providerMessageId: result.messageId,
          sentAt: now,
          lastErrorCode: null,
          lastError: null,
        },
      }),
      prisma.emailDeliveryEvent.create({
        data: {
          deliveryId: delivery.id,
          type: 'application.sent',
          status: EmailDeliveryStatus.SENT,
          source: EmailDeliveryEventSource.APPLICATION,
          occurredAt: now,
        },
      }),
    ])
    return result
  }

  const safeError = sanitizeEmailDeliveryError(result.error) || 'Email provider rejected the send'
  await prisma.$transaction([
    prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: EmailDeliveryStatus.FAILED,
        lastErrorCode: 'SEND_FAILED',
        lastError: safeError,
      },
    }),
    prisma.emailDeliveryEvent.create({
      data: {
        deliveryId: delivery.id,
        type: 'application.failed',
        status: EmailDeliveryStatus.FAILED,
        source: EmailDeliveryEventSource.APPLICATION,
        errorCode: 'SEND_FAILED',
        errorMessage: safeError,
        occurredAt: now,
      },
    }),
  ])

  return { ...result, error: safeError }
}

export async function sendTrackedEmail(
  context: TrackedEmailContext,
  options: SendEmailOptions
): Promise<EmailResult> {
  const recipient = normalizeRecipient(options)
  const recipientHash = hashEmailRecipient(recipient)
  let delivery: { id: string; recipientHash: string }

  try {
    delivery = await prisma.emailDelivery.create({
      data: {
        businessId: context.businessId,
        appointmentId: context.appointmentId,
        inquiryId: context.inquiryId,
        dedupeKey: context.dedupeKey,
        category: context.category,
        audience: context.audience,
        recipientHash,
        recipientMasked: maskEmailRecipient(recipient),
        appointmentStatus: context.appointmentStatus,
        reminderType: context.reminderType,
        maxAttempts: context.maxAttempts ?? 3,
        events: {
          create: {
            type: 'application.queued',
            status: EmailDeliveryStatus.PENDING,
            source: EmailDeliveryEventSource.APPLICATION,
            occurredAt: new Date(),
          },
        },
      },
      select: { id: true, recipientHash: true },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.emailDelivery.findUnique({
        where: { dedupeKey: context.dedupeKey },
        select: { status: true, providerMessageId: true },
      })

      if (existing && SUCCESS_STATUSES.includes(existing.status)) {
        return { success: true, messageId: existing.providerMessageId || undefined }
      }

      if (existing) {
        return { success: true }
      }
    }

    if (error instanceof EmailDeliveryRetryError) throw error

    // Email availability remains independent of the audit store. This fallback is intentionally
    // visible in structured logs and should be investigated because the send will lack history.
    logger.error('email.delivery.tracking_failed', {
      businessId: context.businessId,
      category: context.category,
      errorType: error instanceof Error ? error.name : typeof error,
    })
    return sendEmail(options)
  }

  return attemptDelivery(delivery, options)
}

export async function retryTrackedEmail(
  deliveryId: string,
  retriedByUserId: string,
  options: SendEmailOptions,
  expectedAppointmentStatus?: AppointmentStatus
): Promise<EmailResult> {
  const delivery = await prisma.emailDelivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      status: true,
      attempts: true,
      maxAttempts: true,
      recipientHash: true,
      appointmentStatus: true,
    },
  })

  if (!delivery) throw new EmailDeliveryRetryError('Email delivery not found', 'NOT_FOUND')
  if (!RETRYABLE_STATUSES.includes(delivery.status)) {
    throw new EmailDeliveryRetryError(
      'This delivery status cannot be retried safely',
      'NOT_RETRYABLE'
    )
  }
  if (delivery.attempts >= delivery.maxAttempts) {
    throw new EmailDeliveryRetryError('This delivery has reached its retry limit', 'RETRY_LIMIT')
  }
  if (
    delivery.appointmentStatus &&
    expectedAppointmentStatus &&
    delivery.appointmentStatus !== expectedAppointmentStatus
  ) {
    throw new EmailDeliveryRetryError(
      'The booking status has changed. Send a fresh notification from the booking instead.',
      'CONTEXT_CHANGED'
    )
  }

  const claimed = await prisma.emailDelivery.updateMany({
    where: {
      id: delivery.id,
      status: delivery.status,
      attempts: delivery.attempts,
    },
    data: {
      status: EmailDeliveryStatus.PENDING,
      attempts: { increment: 1 },
      lastAttemptAt: new Date(),
      retriedByUserId,
    },
  })

  if (claimed.count !== 1) {
    throw new EmailDeliveryRetryError('This delivery is already being retried', 'NOT_RETRYABLE')
  }

  await appendApplicationEvent(delivery.id, 'application.retry_queued', EmailDeliveryStatus.PENDING)
  return attemptDelivery(delivery, options)
}

export function canRetryEmailDelivery(status: EmailDeliveryStatus, attempts: number, max: number) {
  return RETRYABLE_STATUSES.includes(status) && attempts < max
}
