import React from 'react'
import DashboardLayout from '@/app/dashboard/layout'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-user'

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/components/dashboard/DashboardShell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

const mockedRedirect = redirect as unknown as jest.Mock
const mockedGetCurrentUser = getCurrentUser as jest.Mock

const user = {
  id: 'user-1',
  email: 'user@example.com',
  emailVerified: true,
  mfaEnabled: false,
  role: 'USER',
}

describe('DashboardLayout auth guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to login when the canonical server auth check finds no user', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    await expect(
      DashboardLayout({
        children: <div>Protected content</div>,
      })
    ).rejects.toThrow('NEXT_REDIRECT:/login?redirect=/dashboard')

    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockedRedirect).toHaveBeenCalledWith('/login?redirect=/dashboard')
  })

  it('renders the dashboard shell when the server resolves an authenticated user', async () => {
    mockedGetCurrentUser.mockResolvedValue(user)

    const result = await DashboardLayout({
      children: <div>Protected content</div>,
    })

    expect(React.isValidElement(result)).toBe(true)
    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockedRedirect).not.toHaveBeenCalled()
  })
})
