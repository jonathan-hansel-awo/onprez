const mockSendEmail = jest.fn()
const mockEmailDeliveryCreate = jest.fn()
const mockEmailDeliveryFindUnique = jest.fn()
const mockEmailDeliveryUpdate = jest.fn()
const mockEmailDeliveryUpdateMany = jest.fn()
const mockEventCreate = jest.fn()
const mockSuppressionFindUnique = jest.fn()

jest.mock('@/lib/config/env', () => ({
  env: { JWT_SECRET: `test-${'x'.repeat(32)}` },
}))

jest.mock('@/lib/services/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailDelivery: {
      create: (...args: unknown[]) => mockEmailDeliveryCreate(...args),
      findUnique: (...args: unknown[]) => mockEmailDeliveryFindUnique(...args),
      update: (...args: unknown[]) => mockEmailDeliveryUpdate(...args),
      updateMany: (...args: unknown[]) => mockEmailDeliveryUpdateMany(...args),
    },
    emailDeliveryEvent: {
      create: (...args: unknown[]) => mockEventCreate(...args),
    },
    emailSuppression: {
      findUnique: (...args: unknown[]) => mockSuppressionFindUnique(...args),
    },
    $transaction: jest.fn(async (operations: unknown[]) => Promise.all(operations)),
  },
}))

import { EmailDeliveryAudience, EmailDeliveryCategory, EmailDeliveryStatus } from '@prisma/client'
import {
  hashEmailRecipient,
  maskEmailRecipient,
  retryTrackedEmail,
  sanitizeEmailDeliveryError,
  sendTrackedEmail,
} from '@/lib/email-delivery/delivery'

const context = {
  businessId: 'business-1',
  appointmentId: 'appointment-1',
  dedupeKey: 'booking:appointment-1:created:customer',
  category: EmailDeliveryCategory.BOOKING_CUSTOMER_CONFIRMATION,
  audience: EmailDeliveryAudience.CUSTOMER,
}

const options = {
  to: 'Ada.Customer@Example.com',
  subject: 'Booking confirmed',
  html: '<p>Confirmed</p>',
}

describe('tracked email delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEmailDeliveryCreate.mockResolvedValue({
      id: 'delivery-1',
      recipientHash: hashEmailRecipient('ada.customer@example.com'),
    })
    mockSuppressionFindUnique.mockResolvedValue(null)
    mockEmailDeliveryUpdate.mockResolvedValue({})
    mockEmailDeliveryUpdateMany.mockResolvedValue({ count: 1 })
    mockEventCreate.mockResolvedValue({})
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'resend-1' })
  })

  it('uses a normalized keyed recipient hash and a masked dashboard label', () => {
    expect(hashEmailRecipient(' Ada.Customer@Example.com ')).toBe(
      hashEmailRecipient('ada.customer@example.com')
    )
    expect(maskEmailRecipient('ada.customer@example.com')).toBe('ad********@example.com')
  })

  it('persists the send lifecycle without storing the message body', async () => {
    const result = await sendTrackedEmail(context, options)

    expect(result).toEqual({ success: true, messageId: 'resend-1' })
    expect(mockEmailDeliveryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'business-1',
          recipientMasked: 'ad********@example.com',
          recipientHash: expect.any(String),
        }),
      })
    )
    const persisted = mockEmailDeliveryCreate.mock.calls[0][0].data
    expect(JSON.stringify(persisted)).not.toContain('Booking confirmed')
    expect(JSON.stringify(persisted)).not.toContain('<p>Confirmed</p>')
    expect(mockEmailDeliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EmailDeliveryStatus.SENT,
          providerMessageId: 'resend-1',
        }),
      })
    )
  })

  it('blocks a suppressed recipient before calling the provider', async () => {
    mockSuppressionFindUnique.mockResolvedValue({ active: true, reason: 'BOUNCE' })

    const result = await sendTrackedEmail(context, options)

    expect(result.success).toBe(false)
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockEmailDeliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: EmailDeliveryStatus.SUPPRESSED }),
      })
    )
  })

  it('scrubs recipient addresses and URLs from stored provider errors', () => {
    expect(
      sanitizeEmailDeliveryError(
        'Mailbox ada@example.com rejected https://provider.example/messages/private-id'
      )
    ).toBe('Mailbox [redacted-email] rejected [redacted-url]')
  })

  it('refuses retries after a hard bounce', async () => {
    mockEmailDeliveryFindUnique.mockResolvedValue({
      id: 'delivery-1',
      status: EmailDeliveryStatus.BOUNCED,
      attempts: 1,
      maxAttempts: 3,
      recipientHash: hashEmailRecipient('ada.customer@example.com'),
      appointmentStatus: null,
    })

    await expect(retryTrackedEmail('delivery-1', 'user-1', options)).rejects.toMatchObject({
      code: 'NOT_RETRYABLE',
    })
    expect(mockEmailDeliveryUpdateMany).not.toHaveBeenCalled()
  })
})
