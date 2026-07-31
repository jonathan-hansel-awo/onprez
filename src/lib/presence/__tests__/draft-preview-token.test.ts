/**
 * @jest-environment node
 */

import {
  createPresenceDraftPreviewToken,
  DraftPreviewTokenError,
  isPresenceDraftPreviewVersionCurrent,
  verifyPresenceDraftPreviewToken,
} from '@/lib/presence/draft-preview-token'

describe('presence draft preview tokens', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-07-31T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('binds an expiring link to one business, page, and publication version', () => {
    const generated = createPresenceDraftPreviewToken({
      businessId: 'business-1',
      pageId: 'page-1',
      pageVersion: 4,
    })
    const verified = verifyPresenceDraftPreviewToken(generated.token)

    expect(verified).toEqual({
      businessId: 'business-1',
      pageId: 'page-1',
      pageVersion: 4,
      expiresAt: new Date('2026-08-01T12:00:00.000Z'),
    })
    expect(generated.expiresAt).toEqual(verified.expiresAt)
  })

  it('rejects a modified token', () => {
    const generated = createPresenceDraftPreviewToken({
      businessId: 'business-1',
      pageId: 'page-1',
      pageVersion: 2,
    })
    const tamperedToken = `${generated.token.slice(0, -1)}x`

    expect(() => verifyPresenceDraftPreviewToken(tamperedToken)).toThrow(DraftPreviewTokenError)
  })

  it('rejects an expired preview link', () => {
    const generated = createPresenceDraftPreviewToken({
      businessId: 'business-1',
      pageId: 'page-1',
      pageVersion: 2,
      expiresInSeconds: 60,
    })

    jest.setSystemTime(new Date('2026-07-31T12:01:01.000Z'))

    try {
      verifyPresenceDraftPreviewToken(generated.token)
      throw new Error('Expected the expired token to be rejected')
    } catch (error) {
      expect(error).toBeInstanceOf(DraftPreviewTokenError)
      expect((error as DraftPreviewTokenError).code).toBe('EXPIRED')
    }
  })

  it('invalidates an existing link when publishing increments the page version', () => {
    expect(isPresenceDraftPreviewVersionCurrent(4, 4)).toBe(true)
    expect(isPresenceDraftPreviewVersionCurrent(4, 5)).toBe(false)
  })
})
