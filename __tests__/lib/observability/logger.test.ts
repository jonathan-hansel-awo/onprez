/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server'

import { logger, withRequestLogging } from '@/lib/observability/logger'

describe('structured logger', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('emits JSON and redacts sensitive fields recursively', () => {
    const info = jest.spyOn(console, 'info').mockImplementation()

    logger.info('security.test', {
      userId: 'user-123',
      password: 'never-log-this',
      nested: {
        accessToken: 'secret-token',
        cookie: 'session=secret',
      },
      error: new Error('Provider failed: token=embedded-secret'),
    })

    const entry = JSON.parse(info.mock.calls[0][0] as string)
    expect(entry).toMatchObject({
      level: 'info',
      service: 'onprez',
      event: 'security.test',
      userId: 'user-123',
      password: '[REDACTED]',
      nested: {
        accessToken: '[REDACTED]',
        cookie: '[REDACTED]',
      },
    })
    expect(info.mock.calls[0][0]).not.toContain('never-log-this')
    expect(info.mock.calls[0][0]).not.toContain('secret-token')
    expect(info.mock.calls[0][0]).not.toContain('embedded-secret')
  })

  it('correlates request logs and exposes trace IDs on the response', async () => {
    const info = jest.spyOn(console, 'info').mockImplementation()
    const request = new NextRequest('https://onprez.com/api/bookings', {
      method: 'POST',
      headers: {
        'x-request-id': 'request-12345678',
        'x-correlation-id': 'booking-flow-12345678',
      },
    })

    const response = await withRequestLogging(request, async () => {
      logger.info('booking.database.test', { bookingId: 'booking-123' })
      return NextResponse.json({ success: true }, { status: 201 })
    })

    expect(response.headers.get('x-request-id')).toBe('request-12345678')
    expect(response.headers.get('x-correlation-id')).toBe('booking-flow-12345678')

    const entries = info.mock.calls.map(([message]) => JSON.parse(message as string))
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'booking.database.test',
          requestId: 'request-12345678',
          correlationId: 'booking-flow-12345678',
          bookingId: 'booking-123',
        }),
        expect.objectContaining({ event: 'api.request.completed', status: 201 }),
      ])
    )
  })
})
