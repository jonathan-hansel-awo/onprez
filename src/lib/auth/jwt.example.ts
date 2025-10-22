import {
  generateTokenPair,
  verifyToken,
  refreshAccessToken,
  isTokenExpired,
  getTimeUntilExpiry,
  extractTokenFromHeader,
} from './jwt'

/**
 * Example usage of JWT utilities
 */
export async function jwtUtilityExamples() {
  console.log('=== JWT Utility Examples ===\n')

  // Example 1: Generate token pair on login
  console.log('1. Generating token pair on login:')
  const userPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'sarah@example.com',
    businessId: '123e4567-e89b-12d3-a456-426614174001',
  }

  const tokens = generateTokenPair(userPayload)
  console.log('Access Token:', tokens.accessToken.substring(0, 50) + '...')
  console.log('Refresh Token:', tokens.refreshToken.substring(0, 50) + '...')
  console.log('Expires In:', tokens.expiresIn, 'seconds')
  console.log('✓ Tokens generated\n')

  // Example 2: Verify access token
  console.log('2. Verifying access token:')
  const verified = verifyToken(tokens.accessToken, 'access')
  console.log('User ID:', verified.payload.userId)
  console.log('Email:', verified.payload.email)
  console.log('Expired:', verified.expired)
  console.log('✓ Token verified\n')

  // Example 3: Check token expiry
  console.log('3. Checking token expiry:')
  const isExpired = isTokenExpired(tokens.accessToken)
  const timeLeft = getTimeUntilExpiry(tokens.accessToken)
  console.log('Is Expired:', isExpired)
  console.log('Time Until Expiry:', timeLeft, 'seconds')
  console.log('✓ Expiry checked\n')

  // Example 4: Refresh access token
  console.log('4. Refreshing access token:')
  const newTokens = refreshAccessToken(tokens.refreshToken)
  console.log('New Access Token:', newTokens.accessToken.substring(0, 50) + '...')
  console.log('✓ Token refreshed\n')

  // Example 5: Extract from Authorization header
  console.log('5. Extracting from Authorization header:')
  const authHeader = `Bearer ${tokens.accessToken}`
  const extracted = extractTokenFromHeader(authHeader)
  console.log('Extracted:', extracted?.substring(0, 50) + '...')
  console.log('✓ Token extracted\n')
}

// Uncomment to run examples:
// jwtUtilityExamples()
