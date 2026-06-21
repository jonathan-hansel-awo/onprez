import React from 'react'
import DashboardLayout from '@/app/dashboard/layout'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { validateSession } from '@/lib/auth/session-service'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))

jest.mock('@/lib/auth/session-service', () => ({
  validateSession: jest.fn(),
}))

jest.mock('@/components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

const mockedCookies = cookies as jest.Mock
const mockedRedirect = redirect as unknown as jest.Mock
const mockedValidateSession = validateSession as jest.Mock

function mockAccessToken(value?: string) {
  mockedCookies.mockResolvedValue({
    get: jest.fn((name: string) => {
      if (name !== 'accessToken' || !value) {
        return undefined
      }

      return {
        name: 'accessToken',
        value,
      }
    }),
  })
}

describe('DashboardLayout auth guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login when there is no accessToken cookie', async () => {
    mockAccessToken(undefined)

    await expect(
      DashboardLayout({
        children: <div>Protected content</div>,
      })
    ).rejects.toThrow('NEXT_REDIRECT:/login?redirect=/dashboard')

    expect(mockedValidateSession).not.toHaveBeenCalled()
    expect(mockedRedirect).toHaveBeenCalledWith('/login?redirect=/dashboard')
  })

  it('redirects to login when accessToken is invalid', async () => {
    mockAccessToken('fake-token')

    mockedValidateSession.mockResolvedValue({
      valid: false,
      reason: 'invalid_token',
    })

    await expect(
      DashboardLayout({
        children: <div>Protected content</div>,
      })
    ).rejects.toThrow('NEXT_REDIRECT:/login?redirect=/dashboard')

    expect(mockedValidateSession).toHaveBeenCalledWith('fake-token')
    expect(mockedRedirect).toHaveBeenCalledWith('/login?redirect=/dashboard')
  })

  it('renders the dashboard shell when session is valid', async () => {
    mockAccessToken('valid-token')

    mockedValidateSession.mockResolvedValue({
      valid: true,
      session: {
        id: 'session-1',
        userId: 'user-1',
        token: 'valid-token',
        refreshToken: 'refresh-token',
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      },
    })

    const result = await DashboardLayout({
      children: <div>Protected content</div>,
    })

    expect(React.isValidElement(result)).toBe(true)
    expect(mockedValidateSession).toHaveBeenCalledWith('valid-token')
    expect(mockedRedirect).not.toHaveBeenCalled()
  })
})
