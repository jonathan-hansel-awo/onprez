import { env } from '@/lib/env'

describe('Environment Variables', () => {
  it('should have required environment variables', () => {
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
    expect(env.NEXT_PUBLIC_APP_NAME).toBe('OnPrez')
  })

  it('should have correct types', () => {
    expect(typeof env.NEXT_PUBLIC_APP_URL).toBe('string')
    expect(typeof env.NEXT_PUBLIC_APP_NAME).toBe('string')
  })
})
