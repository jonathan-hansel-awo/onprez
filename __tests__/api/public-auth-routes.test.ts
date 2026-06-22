/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as checkHandleRoute } from '@/app/api/auth/check-handle/route'
import { POST as signupRoute } from '@/app/api/auth/signup/route'
import { POST as resendVerificationRoute } from '@/app/api/auth/resend-verification/route'
import { POST as verifyEmailRoute } from '@/app/api/auth/verify-email/route'
import { POST as passwordResetRequestRoute } from '@/app/api/auth/password-reset/request/route'
import { POST as passwordResetCompleteRoute } from '@/app/api/auth/password-reset/complete/route'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { checkHandleAvailability, signupUser } from '@/lib/services/signup'
import { resendVerificationEmail, verifyEmail } from '@/lib/services/email-verification'
import { requestPasswordReset, completePasswordReset } from '@/lib/services/password-reset'

jest.mock('@/lib/services/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('@/lib/services/signup', () => ({
  checkHandleAvailability: jest.fn(),
  signupUser: jest.fn(),
}))

jest.mock('@/lib/services/email-verification', () => ({
  resendVerificationEmail: jest.fn(),
  verifyEmail: jest.fn(),
}))

jest.mock('@/lib/services/password-reset', () => ({
  requestPasswordReset: jest.fn(),
  completePasswordReset: jest.fn(),
}))

jest.mock('@/lib/validation/auth', () => ({
  RESERVED_HANDLES: ['admin', 'api', 'dashboard'],
  signupSchema: {
    safeParse: jest.fn((body: any) => {
      if (!body.email || !body.password || !body.handle) {
        return {
          success: false,
          error: {
            issues: [{ path: ['email'], message: 'Required' }],
          },
        }
      }

      return {
        success: true,
        data: body,
      }
    }),
  },
}))

const mockedCheckRateLimit = checkRateLimit as jest.Mock
const mockedCheckHandleAvailability = checkHandleAvailability as jest.Mock
const mockedSignupUser = signupUser as jest.Mock
const mockedResendVerificationEmail = resendVerificationEmail as jest.Mock
const mockedVerifyEmail = verifyEmail as jest.Mock
const mockedRequestPasswordReset = requestPasswordReset as jest.Mock
const mockedCompletePasswordReset = completePasswordReset as jest.Mock

function allowRateLimit() {
  mockedCheckRateLimit.mockResolvedValue({
    allowed: true,
    limit: 10,
    remaining: 9,
    resetAt: new Date(Date.now() + 60_000),
  })
}

function createJsonRequest(
  path: string,
  body: unknown,
  init?: ConstructorParameters<typeof NextRequest>[1]
) {
  return new NextRequest(`http://localhost:3000${path}`, {
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

function createGetRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: {
      'user-agent': 'test-agent',
      'x-forwarded-for': '127.0.0.1',
      ...(init?.headers || {}),
    },
    ...init,
  })
}

describe('public auth API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    allowRateLimit()
  })

  it('GET /api/auth/check-handle rejects missing handle', async () => {
    const response = await checkHandleRoute(createGetRequest('/api/auth/check-handle'))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.available).toBe(false)
    expect(mockedCheckHandleAvailability).not.toHaveBeenCalled()
  })

  it('GET /api/auth/check-handle normalizes handle before checking availability', async () => {
    mockedCheckHandleAvailability.mockResolvedValue({
      available: true,
      reason: 'Available',
    })

    const response = await checkHandleRoute(
      createGetRequest('/api/auth/check-handle?handle=My-Handle')
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.available).toBe(true)
    expect(mockedCheckHandleAvailability).toHaveBeenCalledWith('my-handle')
  })

  it('GET /api/auth/check-handle does not leak raw errors', async () => {
    mockedCheckHandleAvailability.mockRejectedValue(new Error('database secret'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const response = await checkHandleRoute(
      createGetRequest('/api/auth/check-handle?handle=my-handle')
    )

    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.reason).toBe('Failed to check handle availability')
    expect(JSON.stringify(json)).not.toContain('database secret')
    expect(JSON.stringify(json)).not.toContain('stack')

    consoleSpy.mockRestore()
  })

  it('POST /api/auth/resend-verification returns generic response', async () => {
    mockedResendVerificationEmail.mockResolvedValue({
      success: false,
      message: 'Email does not exist',
    })

    const response = await resendVerificationRoute(
      createJsonRequest('/api/auth/resend-verification', {
        email: 'missing@example.com',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.message).toContain('If the account exists')
    expect(JSON.stringify(json)).not.toContain('Email does not exist')
  })

  it('POST /api/auth/verify-email is rate limited', async () => {
    mockedCheckRateLimit.mockResolvedValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000),
      retryAfter: 60,
    })

    const response = await verifyEmailRoute(
      createJsonRequest('/api/auth/verify-email', {
        token: 'a'.repeat(32),
      })
    )

    const json = await response.json()

    expect(response.status).toBe(429)
    expect(json.success).toBe(false)
    expect(mockedVerifyEmail).not.toHaveBeenCalled()
  })

  it('POST /api/auth/password-reset/request returns generic response even when service reveals missing account', async () => {
    mockedRequestPasswordReset.mockResolvedValue({
      success: false,
      message: 'No account found',
    })

    const response = await passwordResetRequestRoute(
      createJsonRequest('/api/auth/password-reset/request', {
        email: 'missing@example.com',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.message).toContain('If an account exists')
    expect(JSON.stringify(json)).not.toContain('No account found')
  })

  it('POST /api/auth/password-reset/complete hides raw service failure', async () => {
    mockedCompletePasswordReset.mockResolvedValue({
      success: false,
      message: 'Token belongs to user@example.com and expired at x',
    })

    const response = await passwordResetCompleteRoute(
      createJsonRequest('/api/auth/password-reset/complete', {
        token: 'a'.repeat(32),
        newPassword: 'Password123',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.message).toBe('Password reset failed or the reset link has expired.')
    expect(JSON.stringify(json)).not.toContain('user@example.com')
  })

  it('POST /api/auth/signup does not expose userId or businessId', async () => {
    mockedSignupUser.mockResolvedValue({
      success: true,
      userId: 'user-1',
      businessId: 'business-1',
      email: 'user@example.com',
      handle: 'my-handle',
      requiresVerification: true,
    })

    const response = await signupRoute(
      createJsonRequest('/api/auth/signup', {
        email: 'user@example.com',
        password: 'Password123',
        handle: 'my-handle',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.email).toBe('user@example.com')
    expect(json.data.handle).toBe('my-handle')
    expect(json.data.userId).toBeUndefined()
    expect(json.data.businessId).toBeUndefined()
  })

  it('POST /api/auth/signup maps raw service errors to safe messages', async () => {
    mockedSignupUser.mockResolvedValue({
      success: false,
      error: 'Prisma unique constraint failed on User_email_key',
    })

    const response = await signupRoute(
      createJsonRequest('/api/auth/signup', {
        email: 'used@example.com',
        password: 'Password123',
        handle: 'my-handle',
      })
    )

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.message).toBe('This email cannot be used to create an account.')
    expect(JSON.stringify(json)).not.toContain('Prisma')
  })
})
