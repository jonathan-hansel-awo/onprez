import jwt, { SignOptions } from 'jsonwebtoken'
import type { TokenPayload, TokenPair, VerifiedToken, TokenOptions } from './types'
import { env } from '@/lib/config/env'

/**
 * JWT Configuration
 */
const JWT_CONFIG = {
  secret: env.JWT_SECRET,
  accessTokenExpiry: env.JWT_ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: env.JWT_REFRESH_TOKEN_EXPIRY,
  issuer: env.NEXT_PUBLIC_APP_NAME,
  audience: env.APP_URL,
} as const

/**
 * Custom error for JWT operations
 */
export class JWTError extends Error {
  constructor(
    message: string,
    public code:
      | 'INVALID_TOKEN'
      | 'EXPIRED_TOKEN'
      | 'MALFORMED_TOKEN'
      | 'GENERATION_FAILED'
      | 'VERIFICATION_FAILED'
  ) {
    super(message)
    this.name = 'JWTError'
  }
}

/**
 * Generate an access token
 * @param payload - Token payload containing user information
 * @param options - Optional token generation options
 * @returns Signed JWT access token
 */
export function generateAccessToken(
  payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>,
  options?: TokenOptions
): string {
  try {
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      ...payload,
      type: 'access',
    }

    const signOptions: SignOptions = {
      expiresIn: (options?.expiresIn || JWT_CONFIG.accessTokenExpiry) as number,
      issuer: options?.issuer || JWT_CONFIG.issuer,
      audience: options?.audience || JWT_CONFIG.audience,
    }

    const token = jwt.sign(tokenPayload, JWT_CONFIG.secret, signOptions)

    return token
  } catch (error) {
    throw new JWTError(`Failed to generate access token ${error}`, 'GENERATION_FAILED')
  }
}

/**
 * Generate a refresh token
 * @param payload - Token payload containing user information
 * @param options - Optional token generation options
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(
  payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>,
  options?: TokenOptions
): string {
  try {
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      ...payload,
      type: 'refresh',
    }

    const signOptions: SignOptions = {
      expiresIn: (options?.expiresIn || JWT_CONFIG.refreshTokenExpiry) as number,
      issuer: options?.issuer || JWT_CONFIG.issuer,
      audience: options?.audience || JWT_CONFIG.audience,
    }

    const token = jwt.sign(tokenPayload, JWT_CONFIG.secret, signOptions)

    return token
  } catch (error) {
    throw new JWTError(`Failed to generate refresh token ${error}`, 'GENERATION_FAILED')
  }
}

/**
 * Generate both access and refresh tokens
 * @param payload - Token payload containing user information
 * @returns Token pair with access and refresh tokens
 */
export function generateTokenPair(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): TokenPair {
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  // Calculate expiry in seconds
  const expiresIn = parseExpiry(JWT_CONFIG.accessTokenExpiry)

  return {
    accessToken,
    refreshToken,
    expiresIn,
  }
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @param expectedType - Expected token type ('access' or 'refresh')
 * @returns Verified token with payload
 * @throws JWTError if token is invalid
 */
export function verifyToken(token: string, expectedType?: 'access' | 'refresh'): VerifiedToken {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }) as TokenPayload

    // Verify token type if specified
    if (expectedType && decoded.type !== expectedType) {
      throw new JWTError(
        `Invalid token type. Expected ${expectedType}, got ${decoded.type}`,
        'INVALID_TOKEN'
      )
    }

    return {
      userId: decoded.userId,
      payload: decoded,
      expired: false,
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // Try to decode expired token to get payload
      try {
        const decoded = jwt.decode(token) as TokenPayload
        return {
          userId: decoded.userId,
          payload: decoded,
          expired: true,
        }
      } catch {
        throw new JWTError('Token is expired and cannot be decoded', 'EXPIRED_TOKEN')
      }
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new JWTError('Invalid or malformed token', 'MALFORMED_TOKEN')
    }

    if (error instanceof JWTError) {
      throw error
    }

    throw new JWTError('Token verification failed', 'VERIFICATION_FAILED')
  }
}

/**
 * Decode a token without verification (use with caution!)
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Check if a token is expired without throwing
 * @param token - JWT token to check
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    if (!decoded || !decoded.exp) {
      return true
    }

    const now = Math.floor(Date.now() / 1000)
    return decoded.exp < now
  } catch {
    return true
  }
}

/**
 * Get token expiry date
 * @param token - JWT token
 * @returns Expiry date or null if token is invalid
 */
export function getTokenExpiry(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    if (!decoded || !decoded.exp) {
      return null
    }

    return new Date(decoded.exp * 1000)
  } catch {
    return null
  }
}

/**
 * Get time until token expires
 * @param token - JWT token
 * @returns Seconds until expiry, or 0 if expired/invalid
 */
export function getTimeUntilExpiry(token: string): number {
  const expiry = getTokenExpiry(token)
  if (!expiry) {
    return 0
  }

  const now = Date.now()
  const timeLeft = Math.floor((expiry.getTime() - now) / 1000)

  return Math.max(0, timeLeft)
}

/**
 * Parse expiry string to seconds
 * @param expiry - Expiry string (e.g., '7d', '24h', '60m')
 * @returns Expiry in seconds
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/)
  if (!match) {
    throw new Error('Invalid expiry format')
  }

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 's':
      return value
    case 'm':
      return value * 60
    case 'h':
      return value * 60 * 60
    case 'd':
      return value * 60 * 60 * 24
    default:
      throw new Error('Invalid expiry unit')
  }
}

/**
 * Refresh an access token using a refresh token
 * @param refreshToken - Valid refresh token
 * @returns New token pair
 * @throws JWTError if refresh token is invalid or expired
 */
export function refreshAccessToken(refreshToken: string): TokenPair {
  const verified = verifyToken(refreshToken, 'refresh')

  if (verified.expired) {
    throw new JWTError('Refresh token has expired', 'EXPIRED_TOKEN')
  }

  // Generate new token pair with same user data
  const { userId, email, businessId } = verified.payload
  return generateTokenPair({ userId, email, businessId })
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token or null if invalid format
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    return null
  }

  return token
}
