const mockDeliveryFindUnique = jest.fn()
const mockDeliveryUpdate = jest.fn()
const mockEventCreate = jest.fn()
const mockSuppressionUpsert = jest.fn()

const transactionClient = {
  emailDelivery: { update: (...args: unknown[]) => mockDeliveryUpdate(...args) },
  emailDeliveryEvent: { create: (...args: unknown[]) => mockEventCreate(...args) },
  emailSuppression: { upsert: (...args: unknown[]) => mockSuppressionUpsert(...args) },
}

jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailDelivery: {
      findUnique: (...args: unknown[]) => mockDeliveryFindUnique(...args),
    },
    $transaction: jest.fn(async (callback: (tx: typeof transactionClient) => unknown) =>
      callback(transactionClient)
    ),
  },
}))

jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import { EmailDeliveryStatus } from '@prisma/client'
import type { WebhookEventPayload } from 'resend'
import { processResendWebhookEvent } from '@/lib/email-delivery/resend-webhook'

const delivery = {
  id: 'delivery-1',
  status: EmailDeliveryStatus.SENT,
  recipientHash: 'recipient-hash',
  recipientMasked: 'ad***@example.com',
  providerMessageId: 'email-1',
}

describe('Resend webhook delivery events', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeliveryFindUnique.mockResolvedValue(delivery)
    mockEventCreate.mockResolvedValue({})
    mockDeliveryUpdate.mockResolvedValue({})
    mockSuppressionUpsert.mockResolvedValue({})
  })

  it('marks a matched message delivered using the signed event ID', async () => {
    const event = {
      type: 'email.delivered',
      created_at: '2026-08-01T16:00:00.000Z',
      data: {
        email_id: 'email-1',
        created_at: '2026-08-01T15:59:00.000Z',
        from: 'OnPrez <noreply@onprez.com>',
        to: ['ada@example.com'],
        subject: 'Booking confirmed',
      },
    } as WebhookEventPayload

    await expect(processResendWebhookEvent(event, 'svix-1')).resolves.toBe('processed')
    expect(mockEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ providerEventId: 'svix-1' }) })
    )
    expect(mockDeliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: EmailDeliveryStatus.DELIVERED }),
      })
    )
  })

  it('records a hard bounce and activates keyed recipient suppression', async () => {
    const event = {
      type: 'email.bounced',
      created_at: '2026-08-01T16:00:00.000Z',
      data: {
        email_id: 'email-1',
        created_at: '2026-08-01T15:59:00.000Z',
        from: 'OnPrez <noreply@onprez.com>',
        to: ['ada@example.com'],
        subject: 'Booking confirmed',
        bounce: { type: 'Permanent', subType: 'General', message: 'Mailbox rejected' },
      },
    } as WebhookEventPayload

    await processResendWebhookEvent(event, 'svix-2')

    expect(mockDeliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: EmailDeliveryStatus.BOUNCED }),
      })
    )
    expect(mockSuppressionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientHash: 'recipient-hash' },
        create: expect.objectContaining({ reason: 'BOUNCE' }),
      })
    )
  })

  it('acknowledges valid events for untracked provider messages without storing their PII', async () => {
    mockDeliveryFindUnique.mockResolvedValue(null)
    const event = {
      type: 'email.sent',
      created_at: '2026-08-01T16:00:00.000Z',
      data: {
        email_id: 'untracked',
        created_at: '2026-08-01T15:59:00.000Z',
        from: 'OnPrez <noreply@onprez.com>',
        to: ['private@example.com'],
        subject: 'Security message',
      },
    } as WebhookEventPayload

    await expect(processResendWebhookEvent(event, 'svix-3')).resolves.toBe('unmatched')
    expect(mockEventCreate).not.toHaveBeenCalled()
  })
})
