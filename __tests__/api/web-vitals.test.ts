/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { POST } from '@/app/api/monitoring/web-vitals/route'
import { logger } from '@/lib/observability/logger'

jest.mock('@sentry/nextjs', () => ({
  withScope: jest.fn((callback: (scope: unknown) => void) =>
    callback({
      setFingerprint: jest.fn(),
      setTag: jest.fn(),
      setExtra: jest.fn(),
    })
  ),
  captureMessage: jest.fn(),
}))

jest.mock('@/lib/observability/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  withRequestLogging: jest.fn((_request: NextRequest, handler: () => Promise<Response>) =>
    handler()
  ),
}))

const mockLoggerInfo = jest.mocked(logger.info)
const mockCaptureMessage = jest.mocked(Sentry.captureMessage)

function createRequest(body: unknown, contentLength?: number) {
  return new NextRequest('https://onprez.test/api/monitoring/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(contentLength ? { 'Content-Length': String(contentLength) } : {}),
    },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  id: 'v5-123',
  name: 'LCP',
  value: 2_400,
  delta: 2_400,
  rating: 'good',
  pageGroup: 'public_presence',
  deviceClass: 'mobile',
  navigationType: 'navigate',
}

describe('POST /api/monitoring/web-vitals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs a valid production metric without creating an alert when it meets the threshold', async () => {
    const response = await POST(createRequest(validPayload))

    expect(response.status).toBe(204)
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0')
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'web_vital.reported',
      expect.objectContaining({
        metricName: 'LCP',
        rating: 'good',
        pageGroup: 'public_presence',
        deviceClass: 'mobile',
        goodThreshold: 2_500,
        poorThreshold: 4_000,
      })
    )
    expect(mockCaptureMessage).not.toHaveBeenCalled()
  })

  it('recomputes the rating server-side and raises a grouped warning for a poor result', async () => {
    const response = await POST(
      createRequest({
        ...validPayload,
        value: 4_501,
        rating: 'good',
        pageGroup: 'dashboard',
        deviceClass: 'desktop',
      })
    )

    expect(response.status).toBe(204)
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'web_vital.reported',
      expect.objectContaining({ rating: 'poor', poorThreshold: 4_500 })
    )
    expect(mockCaptureMessage).toHaveBeenCalledWith('Core Web Vital threshold breached', 'warning')
  })

  it('rejects invalid or oversized reports without logging them', async () => {
    const invalidResponse = await POST(createRequest({ ...validPayload, name: 'FID' }))
    const oversizedResponse = await POST(createRequest(validPayload, 4_097))

    expect(invalidResponse.status).toBe(400)
    await expect(invalidResponse.json()).resolves.toEqual({
      success: false,
      error: 'Invalid web vital payload',
    })
    expect(oversizedResponse.status).toBe(413)
    expect(mockLoggerInfo).not.toHaveBeenCalled()
  })
})
