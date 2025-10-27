import { prisma } from '@/lib/prisma'
import {
  logSecurityEvent,
  getUserSecurityLogs,
  getCriticalSecurityEvents,
  cleanupOldSecurityLogs,
} from '@/lib/services/security-logging'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    securityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

describe('Security Logging Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logSecurityEvent', () => {
    it('should create security log entry', async () => {
      ;(prisma.securityLog.create as jest.Mock).mockResolvedValue({})

      await logSecurityEvent({
        userId: 'user-123',
        action: 'login_failed',
        details: { reason: 'invalid_password' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        severity: 'warning',
      })

      expect(prisma.securityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'login_failed',
          details: { reason: 'invalid_password' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          severity: 'warning',
        },
      })
    })
  })

  describe('getUserSecurityLogs', () => {
    it('should fetch user security logs', async () => {
      const mockLogs = [{ id: '1', action: 'login_success' }]
      ;(prisma.securityLog.findMany as jest.Mock).mockResolvedValue(mockLogs)

      const logs = await getUserSecurityLogs('user-123', 10)

      expect(logs).toEqual(mockLogs)
      expect(prisma.securityLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    })
  })

  describe('getCriticalSecurityEvents', () => {
    it('should fetch critical security events', async () => {
      const mockEvents = [{ id: '1', severity: 'critical' }]
      ;(prisma.securityLog.findMany as jest.Mock).mockResolvedValue(mockEvents)

      const events = await getCriticalSecurityEvents(20)

      expect(events).toEqual(mockEvents)
      expect(prisma.securityLog.findMany).toHaveBeenCalledWith({
        where: { severity: 'critical' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    })
  })

  describe('cleanupOldSecurityLogs', () => {
    it('should delete old non-critical logs', async () => {
      ;(prisma.securityLog.deleteMany as jest.Mock).mockResolvedValue({ count: 100 })

      const count = await cleanupOldSecurityLogs(90)

      expect(count).toBe(100)
      expect(prisma.securityLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
          severity: {
            not: 'critical',
          },
        },
      })
    })
  })
})
