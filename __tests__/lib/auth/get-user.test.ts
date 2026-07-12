/**
 * @jest-environment node
 */

import { cookies, headers } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/get-user'
import { validateSession } from '@/lib/auth/session-service'
import { prisma } from '@/lib/prisma'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}))

jest.mock('@/lib/auth/session-service', () => ({
  validateSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

const mockedCookies = cookies as jest.Mock
const mockedHeaders = headers as jest.Mock
const mockedValidateSession = validateSession as jest.Mock
const mockedFindUser = prisma.user.findUnique as jest.Mock

function mockRequestCredentials(cookieToken?: string, authorization?: string) {
  mockedCookies.mockResolvedValue({
    get: jest.fn((name: string) =>
      name === 'accessToken' && cookieToken ? { value: cookieToken } : undefined
    ),
  })
  mockedHeaders.mockResolvedValue({
    get: jest.fn((name: string) =>
      name.toLowerCase() === 'authorization' ? (authorization ?? null) : null
    ),
  })
}

describe('getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestCredentials()
  })

  it('returns null without credentials', async () => {
    await expect(getCurrentUser()).resolves.toBeNull()

    expect(mockedValidateSession).not.toHaveBeenCalled()
    expect(mockedFindUser).not.toHaveBeenCalled()
  })

  it.each([
    ['forged', 'invalid_token'],
    ['expired', 'expired'],
    ['deleted', 'not_found'],
  ])('rejects a %s session', async (_case, reason) => {
    mockRequestCredentials('untrusted-token')
    mockedValidateSession.mockResolvedValue({ valid: false, reason })

    await expect(getCurrentUser()).resolves.toBeNull()

    expect(mockedValidateSession).toHaveBeenCalledWith('untrusted-token')
    expect(mockedFindUser).not.toHaveBeenCalled()
  })

  it('accepts a bearer token only after DB-backed session validation', async () => {
    mockRequestCredentials(undefined, 'Bearer valid-token')
    mockedValidateSession.mockResolvedValue({
      valid: true,
      session: { userId: 'user-1' },
    })
    mockedFindUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      mfaEnabled: false,
      role: 'USER',
    })

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      mfaEnabled: false,
      role: 'USER',
    })

    expect(mockedFindUser).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        mfaEnabled: true,
        role: true,
      },
    })
  })

  it('rejects a valid session whose user has been deleted', async () => {
    mockRequestCredentials('valid-token')
    mockedValidateSession.mockResolvedValue({
      valid: true,
      session: { userId: 'deleted-user' },
    })
    mockedFindUser.mockResolvedValue(null)

    await expect(getCurrentUser()).resolves.toBeNull()
  })
})
