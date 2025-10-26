/**
 * JWT Utilities Tests
 *
 * IMPORTANT: Environment variables must be set before importing modules
 */

// Set environment variables BEFORE any imports
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_APP_NAME = 'OnPrez'
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing'
process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'
process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d'

// Now import the modules
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiry,
  getTimeUntilExpiry,
  refreshAccessToken,
  extractTokenFromHeader,
  JWTError,
} from '@/lib/auth/jwt'

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    businessId: '123e4567-e89b-12d3-a456-426614174001',
  }

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT has 3 parts
    })

    it('should include correct payload in token', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = decodeToken(token)

      expect(decoded).toMatchObject({
        userId: mockPayload.userId,
        email: mockPayload.email,
        businessId: mockPayload.businessId,
        type: 'access',
      })
    })

    it('should respect custom expiry', () => {
      const token = generateAccessToken(mockPayload, { expiresIn: '1m' })
      const expiry = getTokenExpiry(token)

      expect(expiry).toBeDefined()
      expect(expiry!.getTime()).toBeLessThan(Date.now() + 2 * 60 * 1000) // Less than 2 min
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })

    it('should mark token as refresh type', () => {
      const token = generateRefreshToken(mockPayload)
      const decoded = decodeToken(token)

      expect(decoded?.type).toBe('refresh')
    })
  })

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const { accessToken, refreshToken, expiresIn } = generateTokenPair(mockPayload)

      expect(accessToken).toBeDefined()
      expect(refreshToken).toBeDefined()
      expect(expiresIn).toBeGreaterThan(0)
    })

    it('should generate different tokens', () => {
      const { accessToken, refreshToken } = generateTokenPair(mockPayload)

      expect(accessToken).not.toBe(refreshToken)
    })

    it('should have correct token types', () => {
      const { accessToken, refreshToken } = generateTokenPair(mockPayload)

      const accessDecoded = decodeToken(accessToken)
      const refreshDecoded = decodeToken(refreshToken)

      expect(accessDecoded?.type).toBe('access')
      expect(refreshDecoded?.type).toBe('refresh')
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockPayload)
      const verified = verifyToken(token)

      expect(verified.expired).toBe(false)
      expect(verified.payload).toMatchObject({
        userId: mockPayload.userId,
        email: mockPayload.email,
        type: 'access',
      })
    })

    it('should reject token with wrong type', () => {
      const token = generateAccessToken(mockPayload)

      expect(() => verifyToken(token, 'refresh')).toThrow(JWTError)
      expect(() => verifyToken(token, 'refresh')).toThrow('Invalid token type')
    })

    it('should detect expired tokens', async () => {
      const token = generateAccessToken(mockPayload, { expiresIn: 1 }) // 1 second

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      const verified = verifyToken(token)
      expect(verified.expired).toBe(true)
    }, 5000) // Increase timeout for this test

    it('should throw error for malformed tokens', () => {
      expect(() => verifyToken('invalid-token')).toThrow(JWTError)
      expect(() => verifyToken('invalid-token')).toThrow('malformed')
    })
  })

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = decodeToken(token)

      expect(decoded).toMatchObject({
        userId: mockPayload.userId,
        email: mockPayload.email,
        type: 'access',
      })
    })

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token')
      expect(decoded).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = generateAccessToken(mockPayload)
      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for expired token', async () => {
      const token = generateAccessToken(mockPayload, { expiresIn: 1 }) // 1 second

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 2000))

      expect(isTokenExpired(token)).toBe(true)
    }, 5000) // Increase timeout

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true)
    })
  })

  describe('getTokenExpiry', () => {
    it('should return expiry date', () => {
      const token = generateAccessToken(mockPayload)
      const expiry = getTokenExpiry(token)

      expect(expiry).toBeInstanceOf(Date)
      expect(expiry!.getTime()).toBeGreaterThan(Date.now())
    })

    it('should return null for invalid token', () => {
      const expiry = getTokenExpiry('invalid-token')
      expect(expiry).toBeNull()
    })
  })

  describe('getTimeUntilExpiry', () => {
    it('should return time in seconds until expiry', () => {
      const token = generateAccessToken(mockPayload, { expiresIn: '1h' })
      const timeLeft = getTimeUntilExpiry(token)

      expect(timeLeft).toBeGreaterThan(3500) // ~1 hour in seconds
      expect(timeLeft).toBeLessThan(3700)
    })

    it('should return 0 for expired token', async () => {
      const token = generateAccessToken(mockPayload, { expiresIn: 1 }) // 1 second

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(getTimeUntilExpiry(token)).toBe(0)
    }, 5000) // Increase timeout
  })

  describe('refreshAccessToken', () => {
    it('should generate new token pair from refresh token', () => {
      const { refreshToken } = generateTokenPair(mockPayload)
      const newTokens = refreshAccessToken(refreshToken)

      expect(newTokens.accessToken).toBeDefined()
      expect(newTokens.refreshToken).toBeDefined()
      expect(newTokens.expiresIn).toBeGreaterThan(0)
    })

    it('should throw error for expired refresh token', async () => {
      const refreshToken = generateRefreshToken(mockPayload, { expiresIn: 1 }) // 1 second

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(() => refreshAccessToken(refreshToken)).toThrow(JWTError)
      expect(() => refreshAccessToken(refreshToken)).toThrow('expired')
    }, 5000) // Increase timeout

    it('should throw error for access token instead of refresh', () => {
      const accessToken = generateAccessToken(mockPayload)

      expect(() => refreshAccessToken(accessToken)).toThrow(JWTError)
      expect(() => refreshAccessToken(accessToken)).toThrow('Invalid token type')
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'test-token-123'
      const header = `Bearer ${token}`

      expect(extractTokenFromHeader(header)).toBe(token)
    })

    it('should return null for invalid format', () => {
      expect(extractTokenFromHeader('InvalidFormat token')).toBeNull()
      expect(extractTokenFromHeader('Bearer')).toBeNull()
      expect(extractTokenFromHeader('')).toBeNull()
      expect(extractTokenFromHeader(null)).toBeNull()
    })
  })
})
