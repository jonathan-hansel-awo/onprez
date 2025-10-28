/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Session Service Tests
 */

// Set environment variables BEFORE any imports
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_APP_NAME = 'OnPrez'
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing'
process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'
process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

import {
  createSession,
  validateSession,
  refreshSession,
  deleteSession,
  deleteAllUserSessions,
  getUserSessions,
  deleteSessionById,
  parseDeviceInfo,
  SessionError,
} from '@/lib/auth/session-service'
import { generateTokenPair } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Session Service', () => {
  const mockPrisma = prisma as any

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: 'hashed',
    emailVerified: true,
    mfaEnabled: false,
    accountLocked: false,
    failedAttempts: 0,
    lastFailedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockSessionData = {
    id: 'session-123',
    userId: mockUser.id,
    token: 'access-token',
    refreshToken: 'refresh-token',
    deviceInfo: { browser: 'Chrome', os: 'Windows', deviceType: 'desktop' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      mockPrisma.session.create.mockResolvedValue(mockSessionData)

      const result = await createSession({
        userId: mockUser.id,
        email: mockUser.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.session).toBeDefined()
      expect(result.session.userId).toBe(mockUser.id)
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(mockPrisma.session.create).toHaveBeenCalled()
    })

    it('should create session with remember me option', async () => {
      mockPrisma.session.create.mockResolvedValue(mockSessionData)

      const result = await createSession({
        userId: mockUser.id,
        email: mockUser.email,
        rememberMe: true,
      })

      expect(result.session).toBeDefined()
      expect(mockPrisma.session.create).toHaveBeenCalled()

      // Check that expiry is longer for remember me
      const createCall = mockPrisma.session.create.mock.calls[0][0]
      const expiresAt = createCall.data.expiresAt as Date
      const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      expect(daysUntilExpiry).toBeGreaterThan(20) // Should be ~30 days
    })

    it('should throw error if creation fails', async () => {
      mockPrisma.session.create.mockRejectedValue(new Error('Database error'))

      await expect(
        createSession({
          userId: mockUser.id,
          email: mockUser.email,
        })
      ).rejects.toThrow(SessionError)
    })
  })

  describe('validateSession', () => {
    it('should validate a valid session', async () => {
      // Generate a real token pair for testing
      const tokens = generateTokenPair({
        userId: mockUser.id,
        email: mockUser.email,
      })

      // Mock the session lookup with the generated token
      mockPrisma.session.findUnique.mockResolvedValue({
        ...mockSessionData,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })
      mockPrisma.session.update.mockResolvedValue({
        ...mockSessionData,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })

      const result = await validateSession(tokens.accessToken)

      expect(result.valid).toBe(true)
      expect(result.session).toBeDefined()
      expect(result.session?.userId).toBe(mockUser.id)
      expect(mockPrisma.session.update).toHaveBeenCalled() // Last activity updated
    })

    it('should return invalid for non-existent session', async () => {
      // Generate a token
      const tokens = generateTokenPair({
        userId: mockUser.id,
        email: mockUser.email,
      })

      // Mock no session found in DB
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const result = await validateSession(tokens.accessToken)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('not_found')
    })

    it('should return invalid for expired session in database', async () => {
      const tokens = generateTokenPair({
        userId: mockUser.id,
        email: mockUser.email,
      })

      const expiredSession = {
        ...mockSessionData,
        token: tokens.accessToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      }

      mockPrisma.session.findUnique.mockResolvedValue(expiredSession)
      mockPrisma.session.delete.mockResolvedValue(expiredSession)

      const result = await validateSession(tokens.accessToken)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('expired')
      expect(mockPrisma.session.delete).toHaveBeenCalled() // Cleanup
    })

    it('should return invalid for malformed token', async () => {
      const result = await validateSession('invalid-token')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('invalid_token')
    })
  })

  describe('refreshSession', () => {
    it('should refresh a valid session', async () => {
      const tokens = generateTokenPair({
        userId: mockUser.id,
        email: mockUser.email,
      })

      mockPrisma.session.findUnique.mockResolvedValue({
        ...mockSessionData,
        refreshToken: tokens.refreshToken,
        user: mockUser,
      })
      mockPrisma.session.update.mockResolvedValue({
        ...mockSessionData,
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })

      const result = await refreshSession(tokens.refreshToken)

      expect(result.session).toBeDefined()
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(mockPrisma.session.update).toHaveBeenCalled()
    })

    it('should throw error for non-existent session', async () => {
      const tokens = generateTokenPair({
        userId: mockUser.id,
        email: mockUser.email,
      })

      mockPrisma.session.findUnique.mockResolvedValue(null)

      await expect(refreshSession(tokens.refreshToken)).rejects.toThrow(SessionError)
      await expect(refreshSession(tokens.refreshToken)).rejects.toThrow('not found')
    })

    it('should throw error for expired session', async () => {
      const tokens = generateTokenPair({
        userId: mockUser.id,
        email: mockUser.email,
      })

      const expiredSession = {
        ...mockSessionData,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
        user: mockUser,
      }

      mockPrisma.session.findUnique.mockResolvedValue(expiredSession)
      mockPrisma.session.delete.mockResolvedValue(expiredSession)

      await expect(refreshSession(tokens.refreshToken)).rejects.toThrow(SessionError)
      await expect(refreshSession(tokens.refreshToken)).rejects.toThrow('expired')
    })
  })

  describe('deleteSession', () => {
    it('should delete a session successfully', async () => {
      mockPrisma.session.delete.mockResolvedValue(mockSessionData)

      await deleteSession('token-123')

      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { token: 'token-123' },
      })
    })

    it('should not throw error if session does not exist', async () => {
      mockPrisma.session.delete.mockRejectedValue({ code: 'P2025' })

      await expect(deleteSession('non-existent')).resolves.not.toThrow()
    })
  })

  describe('deleteAllUserSessions', () => {
    it('should delete all sessions for a user', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 3 })

      const count = await deleteAllUserSessions(mockUser.id)

      expect(count).toBe(3)
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      })
    })
  })

  describe('getUserSessions', () => {
    it('should get all active sessions for a user', async () => {
      const sessions = [
        mockSessionData,
        { ...mockSessionData, id: 'session-456', token: 'different-token' },
      ]
      mockPrisma.session.findMany.mockResolvedValue(sessions)

      const result = await getUserSessions(mockUser.id, mockSessionData.token)

      expect(result).toHaveLength(2)
      expect(result[0].isCurrent).toBe(true)
      expect(result[1].isCurrent).toBe(false)
    })

    it('should handle sessions with JSON deviceInfo', async () => {
      const sessionWithJsonDeviceInfo = {
        ...mockSessionData,
        deviceInfo: JSON.stringify({ browser: 'Chrome', os: 'Windows', deviceType: 'desktop' }),
      }

      mockPrisma.session.findMany.mockResolvedValue([sessionWithJsonDeviceInfo])

      const result = await getUserSessions(mockUser.id)

      expect(result).toHaveLength(1)
      expect(result[0].deviceInfo?.browser).toBe('Chrome')
    })
  })

  describe('deleteSessionById', () => {
    it('should delete a specific session', async () => {
      mockPrisma.session.delete.mockResolvedValue(mockSessionData)

      await deleteSessionById('session-123', mockUser.id)

      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: {
          id: 'session-123',
          userId: mockUser.id,
        },
      })
    })

    it('should throw error if session not found', async () => {
      mockPrisma.session.delete.mockRejectedValue({ code: 'P2025' })

      await expect(deleteSessionById('non-existent', mockUser.id)).rejects.toThrow(SessionError)
    })
  })

  describe('parseDeviceInfo', () => {
    it('should parse Chrome on Windows', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      const info = parseDeviceInfo(userAgent)

      expect(info.browser).toBe('Chrome')
      expect(info.os).toBe('Windows')
      expect(info.deviceType).toBe('desktop')
    })

    it('should parse Safari on iOS', () => {
      const userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      const info = parseDeviceInfo(userAgent)

      expect(info.browser).toBe('Safari')
      expect(info.os).toBe('macOS')
      expect(info.deviceType).toBe('mobile')
    })

    it('should parse Firefox on Linux', () => {
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0'
      const info = parseDeviceInfo(userAgent)

      expect(info.browser).toBe('Firefox')
      expect(info.os).toBe('Linux')
      expect(info.deviceType).toBe('desktop')
    })

    it('should parse Chrome browser', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
      const info = parseDeviceInfo(userAgent)

      expect(info.browser).toBe('Chrome')
      expect(info.os).toBe('Windows')
    })
  })
})
