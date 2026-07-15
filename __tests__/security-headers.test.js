/** @jest-environment node */

import nextConfig from '../next.config.js'

describe('production security headers', () => {
  let rule
  let headers

  beforeAll(async () => {
    const rules = await nextConfig.headers()

    expect(rules).toHaveLength(1)
    rule = rules[0]
    headers = Object.fromEntries(rule.headers.map(header => [header.key, header.value]))
  })

  it('applies the policy to every application response', () => {
    expect(rule.source).toBe('/:path*')
  })

  it('sets the required browser security headers', () => {
    expect(headers).toMatchObject({
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'browsing-topics=(), camera=(), geolocation=(), microphone=()',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
    })
  })

  it('uses a restrictive CSP while allowing required external services', () => {
    const policy = headers['Content-Security-Policy']

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("base-uri 'self'")
    expect(policy).toContain("form-action 'self'")
    expect(policy).toContain('https://res.cloudinary.com')
    expect(policy).toContain('https://api.cloudinary.com')
    expect(policy).toContain('https://www.googletagmanager.com')
    expect(policy).not.toContain("'unsafe-eval'")
    expect(policy).not.toMatch(/[\r\n]/)
  })
})
