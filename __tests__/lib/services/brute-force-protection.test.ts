import { prisma } from '@/lib/prisma'
import {
  recordLoginAttempt,
  checkAndLockAccount,
  incrementFailedAttempts,
  resetFailedAttempts,
  unlockAccount,
  getRecentFailedAttempts,
  calculateProgressiveDelay,
  shouldDelayLogin,
  getAccountLockStatus,
} from '@/lib/services/brute-force-protection'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    authAttempt: {
      create: jest.fn(),
      count: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
  },
}))

describe('Brute Force Protection Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('recordLoginAttempt', () => {
    it('should record successful login attempt', async () => {
      const email = 'test@example.com'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
      })
      ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})

      await recordLoginAttempt(email, true, '192.168.1.1', 'Mozilla/5.0')

      expect(prisma.authAttempt.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptType: 'login',
          failureReason: undefined,
        },
      })
    })

    it('should record failed login attempt with reason', async () => {
      const email = 'test@example.com'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
      })
      ;(prisma.authAttempt.create as jest.Mock).mockResolvedValue({})
      ;(prisma.securityLog.create as jest.Mock).mockResolvedValue({})

      await recordLoginAttempt(email, false, '192.168.1.1', 'Mozilla/5.0', 'invalid_password')

      expect(prisma.authAttempt.create).toHaveBeenCalled()
      expect(prisma.securityLog.create).toHaveBeenCalled()
    })
  })

  describe('checkAndLockAccount', () => {
    it('should return success for user with no failed attempts', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        accountLocked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
      })

      const result = await checkAndLockAccount('test@example.com')

      expect(result.success).toBe(true)
      expect(result.isLocked).toBe(false)
      expect(result.remainingAttempts).toBe(5)
    })

    it('should return locked status for already locked account', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        accountLocked: true,
        lockedUntil: futureDate,
        failedLoginAttempts: 5,
      })

      const result = await checkAndLockAccount('test@example.com')

      expect(result.success).toBe(false)
      expect(result.isLocked).toBe(true)
      expect(result.lockedUntil).toEqual(futureDate)
    })

    it('should auto-unlock account if lock period expired', async () => {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        accountLocked: true,
        lockedUntil: pastDate,
        failedLoginAttempts: 5,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.securityLog.create as jest.Mock).mockResolvedValue({})

      const result = await checkAndLockAccount('test@example.com')

      expect(result.success).toBe(true)
      expect(result.isLocked).toBe(false)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          accountLocked: false,
          lockedUntil: null,
          failedLoginAttempts: 0,
          lastFailedLogin: null,
        },
      })
    })

    it('should lock account after threshold exceeded', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        accountLocked: false,
        lockedUntil: null,
        failedLoginAttempts: 5,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.securityLog.create as jest.Mock).mockResolvedValue({})

      const result = await checkAndLockAccount('test@example.com')

      expect(result.success).toBe(false)
      expect(result.isLocked).toBe(true)
      expect(result.lockedUntil).toBeDefined()
      expect(prisma.user.update).toHaveBeenCalled()
    })

    it('should not reveal if user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await checkAndLockAccount('nonexistent@example.com')

      expect(result.success).toBe(false)
      expect(result.isLocked).toBe(false)
      expect(result.remainingAttempts).toBe(5)
    })
  })

  describe('incrementFailedAttempts', () => {
    it('should increment failed login attempts', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      await incrementFailedAttempts('test@example.com')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          failedLoginAttempts: {
            increment: 1,
          },
          lastFailedLogin: expect.any(Date),
        },
      })
    })

    it('should handle non-existent user gracefully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await incrementFailedAttempts('nonexistent@example.com')

      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })

  describe('resetFailedAttempts', () => {
    it('should reset failed login attempts', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      await resetFailedAttempts('test@example.com')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          failedLoginAttempts: 0,
          lastFailedLogin: null,
        },
      })
    })
  })

  describe('calculateProgressiveDelay', () => {
    it('should return no delay for first 2 attempts', () => {
      expect(calculateProgressiveDelay(0)).toBe(0)
      expect(calculateProgressiveDelay(1)).toBe(0)
      expect(calculateProgressiveDelay(2)).toBe(0)
    })

    it('should return progressive delays', () => {
      expect(calculateProgressiveDelay(3)).toBe(2000) // 2s
      expect(calculateProgressiveDelay(4)).toBe(5000) // 5s
      expect(calculateProgressiveDelay(5)).toBe(10000) // 10s
      expect(calculateProgressiveDelay(10)).toBe(10000) // 10s cap
    })
  })

  describe('shouldDelayLogin', () => {
    it('should return appropriate delay based on failed attempts', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        failedLoginAttempts: 4,
      })

      const delay = await shouldDelayLogin('test@example.com')

      expect(delay).toBe(5000) // 5 seconds for 4 attempts
    })

    it('should return 0 delay for non-existent user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const delay = await shouldDelayLogin('nonexistent@example.com')

      expect(delay).toBe(0)
    })
  })

  describe('getAccountLockStatus', () => {
    it('should return lock status for locked account', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        accountLocked: true,
        lockedUntil: futureDate,
        failedLoginAttempts: 5,
      })

      const status = await getAccountLockStatus('test@example.com')

      expect(status.isLocked).toBe(true)
      expect(status.lockedUntil).toEqual(futureDate)
      expect(status.failedAttempts).toBe(5)
      expect(status.remainingAttempts).toBe(0)
    })

    it('should return unlocked status for expired lock', async () => {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        accountLocked: true,
        lockedUntil: pastDate,
        failedLoginAttempts: 3,
      })

      const status = await getAccountLockStatus('test@example.com')

      expect(status.isLocked).toBe(false)
      expect(status.lockedUntil).toBeUndefined()
    })
  })

  describe('getRecentFailedAttempts', () => {
    it('should count recent failed attempts', async () => {
      ;(prisma.authAttempt.count as jest.Mock).mockResolvedValue(3)

      const count = await getRecentFailedAttempts('test@example.com')

      expect(count).toBe(3)
      expect(prisma.authAttempt.count).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          success: false,
          attemptType: 'login',
          createdAt: {
            gte: expect.any(Date),
          },
        },
      })
    })
  })
})
