/** @jest-environment node */

import { apiError } from '@/lib/api/error-response'
import { getApiErrorMessage } from '@/lib/api/error-message'

describe('API error contract', () => {
  it.each([
    ['BAD_REQUEST', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['RATE_LIMITED', 429],
    ['INTERNAL_ERROR', 500],
  ] as const)('returns the standard envelope for %s', async (code, status) => {
    const response = apiError(code, 'Safe public message', status)

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Safe public message',
      error: { code, message: 'Safe public message' },
    })
  })

  it('supports structured validation details and response headers', async () => {
    const details = { email: ['Enter a valid email address'] }
    const response = apiError('VALIDATION_ERROR', 'Invalid request', 400, {
      details,
      headers: { 'Retry-After': '60' },
    })

    expect(response.headers.get('Retry-After')).toBe('60')
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details },
    })
  })
})

describe('getApiErrorMessage', () => {
  it('reads the standard envelope', () => {
    expect(getApiErrorMessage({ error: { code: 'FORBIDDEN', message: 'No access' } })).toBe(
      'No access'
    )
  })

  it('supports legacy message and string error responses during migration', () => {
    expect(getApiErrorMessage({ message: 'Legacy message' })).toBe('Legacy message')
    expect(getApiErrorMessage({ error: 'Legacy error' })).toBe('Legacy error')
  })

  it('uses a safe fallback for malformed responses', () => {
    expect(getApiErrorMessage(null, 'Please retry')).toBe('Please retry')
  })
})
