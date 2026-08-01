/** @jest-environment node */

import { logger } from '@/lib/observability/logger'

describe('structured logger privacy boundary', () => {
  afterEach(() => jest.restoreAllMocks())

  it('redacts direct identifiers, network identifiers, and sensitive URL values', () => {
    const output = jest.spyOn(console, 'info').mockImplementation(() => undefined)

    logger.info('privacy.audit.fixture', {
      customerEmail: 'ada@example.com',
      customerName: 'Ada Okoro',
      ipAddress: '203.0.113.12',
      safeBookingId: 'booking-123',
      error: new Error(
        'Request failed for ada@example.com at https://onprez.com/status?customerEmail=ada%40example.com'
      ),
    })

    const entry = String(output.mock.calls[0]?.[0])
    expect(entry).not.toContain('ada@example.com')
    expect(entry).not.toContain('Ada Okoro')
    expect(entry).not.toContain('203.0.113.12')
    expect(entry).not.toContain('ada%40example.com')
    expect(entry).toContain('booking-123')
  })
})
