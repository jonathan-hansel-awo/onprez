import { scrubSentryEvent } from '@/lib/monitoring/sentry-scrubber'

describe('scrubSentryEvent', () => {
  it('removes identity, request payloads, credentials, and customer notes', () => {
    const event = {
      release: 'abc123',
      user: { id: 'user-1', email: 'person@example.com' },
      request: {
        url: 'https://onprez.com/reset?token=secret-token&view=compact',
        data: { password: 'hunter2' },
        cookies: { session: 'secret' },
        query_string: 'token=secret-token',
        headers: { authorization: 'Bearer secret-token' },
      },
      extra: {
        accessToken: 'secret-token',
        customerNotes: 'private notes',
        safe: 'contact person@example.com',
      },
      exception: { values: [{ type: 'TypeError', value: 'failed' }] },
    }

    const scrubbed = scrubSentryEvent(event)

    expect(scrubbed).not.toHaveProperty('user')
    expect(scrubbed.request).not.toHaveProperty('data')
    expect(scrubbed.request).not.toHaveProperty('cookies')
    expect(scrubbed.request).not.toHaveProperty('query_string')
    expect(scrubbed.request.headers.authorization).toBe('[Filtered]')
    expect(scrubbed.request.url).toContain('token=%5BFiltered%5D')
    expect(scrubbed.extra).toEqual({
      accessToken: '[Filtered]',
      customerNotes: '[Filtered]',
      safe: 'contact [Filtered]',
    })
    expect(scrubbed.release).toBe('abc123')
    expect(scrubbed.exception.values[0].type).toBe('TypeError')
    expect(event.user.email).toBe('person@example.com')
  })

  it('filters bearer tokens and JWT-shaped values embedded in strings', () => {
    const event = {
      message:
        'Authorization failed for Bearer token-value and eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature',
    }

    expect(scrubSentryEvent(event).message).toBe(
      'Authorization failed for Bearer [Filtered] and [Filtered]'
    )
  })
})
