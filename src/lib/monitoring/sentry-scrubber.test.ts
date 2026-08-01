/** @jest-environment node */

import { scrubSentryEvent } from './sentry-scrubber'

describe('Sentry event scrubbing', () => {
  it('removes identity, request bodies, query strings, and embedded identifiers', () => {
    const scrubbed = scrubSentryEvent({
      user: { email: 'ada@example.com' },
      request: {
        data: { customerName: 'Ada Okoro' },
        cookies: { session: 'secret' },
        query_string: 'customerEmail=ada@example.com',
        url: 'https://onprez.com/status?customerEmail=ada%40example.com',
      },
      extra: { message: 'Contact ada@example.com from 203.0.113.12' },
    }) as Record<string, unknown>

    expect(scrubbed.user).toBeUndefined()
    expect(scrubbed.request).toEqual({
      url: 'https://onprez.com/status?customerEmail=%5BFiltered%5D',
    })
    expect(JSON.stringify(scrubbed)).not.toContain('ada@example.com')
    expect(JSON.stringify(scrubbed)).not.toContain('203.0.113.12')
  })
})
