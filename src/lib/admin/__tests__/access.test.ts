import { getCurrentUser, isAdmin } from '@/lib/auth/get-user'
import { PlatformAdminError, requirePlatformAdminApi } from '@/lib/admin/access'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
  isAdmin: jest.fn(),
}))

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockIsAdmin = isAdmin as jest.MockedFunction<typeof isAdmin>

describe('platform admin API access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects unauthenticated callers', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    await expect(requirePlatformAdminApi()).rejects.toMatchObject<Partial<PlatformAdminError>>({
      status: 401,
      message: 'Unauthorized',
    })
  })

  it('rejects authenticated non-admin users', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      mfaEnabled: false,
      role: 'USER' as const,
    }
    mockGetCurrentUser.mockResolvedValue(user)
    mockIsAdmin.mockReturnValue(false)

    await expect(requirePlatformAdminApi()).rejects.toMatchObject<Partial<PlatformAdminError>>({
      status: 403,
      message: 'Forbidden',
    })
  })

  it.each(['ADMIN', 'SUPERADMIN'] as const)('allows the %s database role', async role => {
    const user = {
      id: `user-${role.toLowerCase()}`,
      email: `${role.toLowerCase()}@example.com`,
      emailVerified: true,
      mfaEnabled: false,
      role,
    }
    mockGetCurrentUser.mockResolvedValue(user)
    mockIsAdmin.mockReturnValue(true)

    await expect(requirePlatformAdminApi()).resolves.toEqual(user)
  })
})
