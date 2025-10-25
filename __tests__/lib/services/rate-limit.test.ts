import { prisma } from 'lib/prisma'
import {
  checkRateLimit,
  resetRateLimit,
  cleanupExpiredRateLimits,
  getRateLimitStats,
  blockKey,
  calculateProgressiveDelay,
} from 'lib/services/rate-limit'

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    rateLimit: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

describe('Rate Limit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkRateLimit', () => {
    it('should allow first request and create new rate limit record', async () => {
      const key = 'ip:192.168.1.1'
      const endpoint = 'auth:login'

      ;(prisma.rateLimit.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.rateLimit.upsert as jest.Mock).mockResolvedValue({
        id: 'test-id',
        key,
        endpoint,
        count: 1,
        windowStart: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        userAgent: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await checkRateLimit(key, endpoint)

      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
      expect(prisma.rateLimit.upsert).toHaveBeenCalledTimes(1)
    })

    it('should block when limit is exceeded', async () => {
      const key = 'ip:192.168.1.1'
      const endpoint = 'auth:login'
      const existingRecord = {
        id: 'test-id',
        key,
        endpoint,
        count: 5,
        windowStart: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        userAgent: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.rateLimit.findUnique as jest.Mock).mockResolvedValue(existingRecord)

      const result = await checkRateLimit(key, endpoint)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })
  })

  describe('calculateProgressiveDelay', () => {
    it('should return progressive delays', () => {
      expect(calculateProgressiveDelay(1)).toBe(1000) // 1s
      expect(calculateProgressiveDelay(2)).toBe(2000) // 2s
      expect(calculateProgressiveDelay(3)).toBe(5000) // 5s
      expect(calculateProgressiveDelay(4)).toBe(10000) // 10s
      expect(calculateProgressiveDelay(5)).toBe(30000) // 30s
      expect(calculateProgressiveDelay(6)).toBe(60000) // 1min
    })

    it('should cap at maximum delay', () => {
      expect(calculateProgressiveDelay(100)).toBe(300000) // Max: 5min
    })
  })

  describe('cleanupExpiredRateLimits', () => {
    it('should delete all expired rate limit records', async () => {
      ;(prisma.rateLimit.deleteMany as jest.Mock).mockResolvedValue({ count: 42 })

      const result = await cleanupExpiredRateLimits()

      expect(result).toBe(42)
      expect(prisma.rateLimit.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      })
    })
  })
})
