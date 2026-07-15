/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as loginRoute } from '@/app/api/auth/login/route'
import { loginUser, parseUserAgent } from '@/lib/services/login'
import { checkRateLimit } from '@/lib/services/rate-limit'

jest.mock('@/lib/services/login', () => ({
  loginUser: jest.fn(),
  parseUserAgent: jest.fn(),
}))

jest.mock('@/lib/services/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}))

const mockedLoginUser = loginUser as jest.Mock
const mockedParseUserAgent = parseUserAgent as jest.Mock
const mockedCheckRateLimit = checkRateLimit as jest.Mock

function createRequest(body: unknown, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      'x-forwarded-for': '127.0.0.1',
      ...(init?.headers || {}),
    },
    ...init,
  })
}

function allowRateLimit() {
  mockedCheckRateLimit.mockResolvedValue({
    allowed: true,
    limit: 5,
    remaining: 4,
    resetAt: new Date(Date.now() + 60_000),
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    allowRateLimit()

    mockedParseUserAgent.mockReturnValue({
      platform: 'Windows',
      browser: 'Chrome',
    })
  })

  it('returns 400 for invalid input', async () => {
    const response = await loginRoute(
      createRequest({
        email: 'not-an-email',
        password: '',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(mockedLoginUser).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    mockedCheckRateLimit.mockResolvedValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt: new Date(Date.now() + 120_000),
      retryAfter: 120,
    })

    const response = await loginRoute(
      createRequest({
        email: 'user@example.com',
        password: 'password',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(429)
    expect(json.success).toBe(false)
    expect(response.headers.get('Retry-After')).toBe('120')
    expect(mockedLoginUser).not.toHaveBeenCalled()
  })

  it('returns a generic error for failed login', async () => {
    mockedLoginUser.mockResolvedValue({
      success: false,
      error: 'User does not exist',
    })

    const response = await loginRoute(
      createRequest({
        email: 'missing@example.com',
        password: 'wrong-password',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({
      success: false,
      message: 'Invalid email or password',
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    })
  })

  it('does not return userId during MFA challenge', async () => {
    mockedLoginUser.mockResolvedValue({
      success: true,
      requiresMfa: true,
      mfaToken: 'raw-mfa-temp-token',
      userId: 'user-1',
    })

    const response = await loginRoute(
      createRequest({
        email: 'user@example.com',
        password: 'password',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      success: true,
      requiresMfa: true,
      mfaToken: 'raw-mfa-temp-token',
    })

    expect(JSON.stringify(json)).not.toContain('userId')
  })

  it('sets HTTP-only cookies on successful non-MFA login', async () => {
    mockedLoginUser.mockResolvedValue({
      success: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: true,
        passwordHash: 'must-not-leak',
        mfaSecret: 'must-not-leak',
      },
    })

    const response = await loginRoute(
      createRequest({
        email: 'user@example.com',
        password: 'password',
        rememberMe: true,
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(JSON.stringify(json)).not.toContain('passwordHash')
    expect(JSON.stringify(json)).not.toContain('mfaSecret')

    const setCookie = response.headers.get('set-cookie') || ''

    expect(setCookie).toContain('accessToken=access-token')
    expect(setCookie).toContain('refreshToken=refresh-token')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Path=/')
    expect(setCookie.toLowerCase()).toContain('samesite=lax')
  })

  it('passes parsed device and request metadata into loginUser', async () => {
    mockedLoginUser.mockResolvedValue({
      success: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: true,
      },
    })

    await loginRoute(
      createRequest(
        {
          email: 'user@example.com',
          password: 'password',
          rememberMe: false,
        },
        {
          headers: {
            'content-type': 'application/json',
            'user-agent': 'Mozilla test agent',
            'x-forwarded-for': '203.0.113.10',
          },
        }
      )
    )

    expect(mockedLoginUser).toHaveBeenCalledWith(
      {
        email: 'user@example.com',
        password: 'password',
        rememberMe: false,
      },
      {
        userAgent: 'Mozilla test agent',
        ipAddress: '203.0.113.10',
        platform: 'Windows',
        browser: 'Chrome',
      }
    )
  })
})
