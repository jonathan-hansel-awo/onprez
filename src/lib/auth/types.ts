/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string
  email: string
  businessId?: string
  type: 'access' | 'refresh'
  iat?: number // Issued at (automatically added by JWT)
  exp?: number // Expiry (automatically added by JWT)
}

/**
 * Token pair returned on login/refresh
 */
export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number // seconds until access token expires
}

/**
 * Decoded and verified token
 */
export interface VerifiedToken {
  userId: any
  payload: TokenPayload
  expired: boolean
}

/**
 * Token generation options
 */
export interface TokenOptions {
  expiresIn?: string | number
  audience?: string
  issuer?: string
}
