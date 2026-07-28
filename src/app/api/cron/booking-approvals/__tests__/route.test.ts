/** @jest-environment node */

import { NextRequest } from 'next/server'

import { expirePendingBookingApprovals } from '@/lib/booking-protection/approval'
import { POST } from '../route'

jest.mock('@/lib/booking-protection/approval', () => ({
  expirePendingBookingApprovals: jest.fn(),
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { error: jest.fn() },
}))

const mockedExpire = expirePendingBookingApprovals as jest.Mock
const originalSecret = process.env.CRON_SECRET

describe('booking approval expiry cron', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = 'a-secure-cron-secret-that-is-long-enough'
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = originalSecret
  })

  it('rejects unauthorised dispatches', async () => {
    const response = await POST(
      new NextRequest('https://onprez.test/api/cron/booking-approvals', { method: 'POST' })
    )

    expect(response.status).toBe(401)
    expect(mockedExpire).not.toHaveBeenCalled()
  })

  it('expires due approvals with the shared cron secret', async () => {
    mockedExpire.mockResolvedValue({ selected: 1, expired: 1 })
    const response = await POST(
      new NextRequest('https://onprez.test/api/cron/booking-approvals', {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
    )

    expect(response.status).toBe(200)
    expect(mockedExpire).toHaveBeenCalledTimes(1)
  })
})
