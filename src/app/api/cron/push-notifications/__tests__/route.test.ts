/** @jest-environment node */

import { NextRequest } from 'next/server'

import { processDuePushOutbox } from '@/lib/push/delivery'
import { POST } from '../route'

jest.mock('@/lib/push/delivery', () => ({
  processDuePushOutbox: jest.fn(),
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

const mockedProcess = processDuePushOutbox as jest.Mock
const originalSecret = process.env.CRON_SECRET

function request(token?: string) {
  return new NextRequest('https://onprez.test/api/cron/push-notifications', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })
}

describe('push notification retry endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = 'a-secure-cron-secret-that-is-long-enough'
    mockedProcess.mockResolvedValue({
      processed: 2,
      delivered: 1,
      partial: 0,
      failed: 0,
      noRecipients: 1,
    })
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = originalSecret
  })

  it('rejects missing and incorrect bearer credentials', async () => {
    await expect(POST(request())).resolves.toMatchObject({ status: 401 })
    await expect(POST(request('wrong-secret'))).resolves.toMatchObject({ status: 401 })
    expect(mockedProcess).not.toHaveBeenCalled()
  })

  it('processes due retries with the configured secret', async () => {
    const response = await POST(request(process.env.CRON_SECRET))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ success: true, data: { processed: 2, delivered: 1 } })
    expect(mockedProcess).toHaveBeenCalledTimes(1)
  })
})
