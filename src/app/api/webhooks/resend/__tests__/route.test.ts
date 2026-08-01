/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/webhooks/resend/route'
import { processResendWebhookEvent } from '@/lib/email-delivery/resend-webhook'
import { verifyResendWebhook } from '@/lib/services/email'

jest.mock('@/lib/config/env', () => ({
  env: { RESEND_WEBHOOK_SECRET: 'whsec_test' },
}))

jest.mock('@/lib/services/email', () => ({
  verifyResendWebhook: jest.fn(),
}))

jest.mock('@/lib/email-delivery/resend-webhook', () => ({
  processResendWebhookEvent: jest.fn(),
}))

jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const mockedVerify = jest.mocked(verifyResendWebhook)
const mockedProcess = jest.mocked(processResendWebhookEvent)

function request(headers: Record<string, string> = {}) {
  return new NextRequest('https://onprez.test/api/webhooks/resend', {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'email.delivered' }),
  })
}

describe('POST /api/webhooks/resend', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rejects requests without all Svix signature headers', async () => {
    const response = await POST(request())

    expect(response.status).toBe(400)
    expect(mockedVerify).not.toHaveBeenCalled()
  })

  it('verifies the raw body before processing a delivery event', async () => {
    const event = {
      type: 'email.delivered',
      created_at: '2026-08-01T16:00:00.000Z',
      data: {
        email_id: 'email-1',
        created_at: '2026-08-01T15:59:00.000Z',
        from: 'OnPrez <noreply@onprez.com>',
        to: ['customer@example.com'],
        subject: 'Booking confirmed',
      },
    } as ReturnType<typeof verifyResendWebhook>
    mockedVerify.mockReturnValue(event)
    mockedProcess.mockResolvedValue('processed')

    const response = await POST(
      request({
        'svix-id': 'svix-1',
        'svix-timestamp': '1785600000',
        'svix-signature': 'v1,test',
      })
    )

    expect(response.status).toBe(200)
    expect(mockedVerify).toHaveBeenCalledWith(JSON.stringify({ type: 'email.delivered' }), {
      id: 'svix-1',
      timestamp: '1785600000',
      signature: 'v1,test',
    })
    expect(mockedProcess).toHaveBeenCalledWith(event, 'svix-1')
  })

  it('returns a retriable server error when persistence fails after verification', async () => {
    mockedVerify.mockReturnValue({
      type: 'email.sent',
      created_at: '2026-08-01T16:00:00.000Z',
      data: {
        email_id: 'email-1',
        created_at: '2026-08-01T15:59:00.000Z',
        from: 'OnPrez <noreply@onprez.com>',
        to: ['customer@example.com'],
        subject: 'Booking confirmed',
      },
    })
    mockedProcess.mockRejectedValue(new Error('database unavailable'))

    const response = await POST(
      request({
        'svix-id': 'svix-2',
        'svix-timestamp': '1785600000',
        'svix-signature': 'v1,test',
      })
    )

    expect(response.status).toBe(500)
  })
})
