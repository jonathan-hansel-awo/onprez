/** @jest-environment node */

import { StripeWebhookEventStatus } from '@prisma/client'
import type Stripe from 'stripe'

import { prisma } from '@/lib/prisma'
import { processStripeWebhookEvent } from '@/lib/stripe/webhook-events'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    stripeWebhookEvent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const mockedEvents = prisma.stripeWebhookEvent as unknown as Record<string, jest.Mock>

function stripeEvent(overrides: Partial<Stripe.Event> = {}): Stripe.Event {
  return {
    id: 'evt_test',
    object: 'event',
    api_version: null,
    created: 1_785_000_000,
    data: { object: { id: 'cs_test', object: 'checkout.session' } } as never,
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: 'checkout.session.completed',
    ...overrides,
  } as Stripe.Event
}

describe('Stripe webhook event idempotency', () => {
  beforeEach(() => jest.clearAllMocks())

  it('processes and records a new event once', async () => {
    const handler = jest.fn().mockResolvedValue(undefined)

    const result = await processStripeWebhookEvent(stripeEvent(), handler)

    expect(result).toEqual({ duplicate: false, eventRecordId: 'evt_test' })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(mockedEvents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'evt_test',
          objectKey: 'checkout.session.completed:cs_test',
        }),
      })
    )
    expect(mockedEvents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: StripeWebhookEventStatus.SUCCEEDED }),
      })
    )
  })

  it('ignores an already successful duplicate event', async () => {
    mockedEvents.create.mockRejectedValue({ code: 'P2002' })
    mockedEvents.findUnique.mockResolvedValue({
      id: 'evt_test',
      status: StripeWebhookEventStatus.SUCCEEDED,
    })
    const handler = jest.fn()

    const result = await processStripeWebhookEvent(stripeEvent(), handler)

    expect(result).toEqual({ duplicate: true, eventRecordId: 'evt_test' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('retries a previously failed event', async () => {
    mockedEvents.create.mockRejectedValue({ code: 'P2002' })
    mockedEvents.findUnique.mockResolvedValue({
      id: 'evt_test',
      status: StripeWebhookEventStatus.FAILED,
    })
    mockedEvents.updateMany.mockResolvedValue({ count: 1 })
    const handler = jest.fn().mockResolvedValue(undefined)

    const result = await processStripeWebhookEvent(stripeEvent(), handler)

    expect(result.duplicate).toBe(false)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(mockedEvents.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attempts: { increment: 1 } }) })
    )
  })

  it('records handler failures so Stripe can retry', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Database unavailable'))

    await expect(processStripeWebhookEvent(stripeEvent(), handler)).rejects.toThrow(
      'Database unavailable'
    )
    expect(mockedEvents.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: StripeWebhookEventStatus.FAILED,
          lastError: 'Database unavailable',
        }),
      })
    )
  })
})
