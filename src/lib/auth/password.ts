import bcrypt from 'bcryptjs'

/**
 * Password hashing configuration
 */
const SALT_ROUNDS = 12 // Higher = more secure but slower

/**
 * Password validation rules
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for better UX
} as const

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
}

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise that resolves to hashed password
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validate password before hashing
    validatePassword(password)

    // Generate salt and hash password
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    return hash
  } catch (error) {
    if (error instanceof PasswordValidationError) {
      throw error
    }
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a plain text password against a hashed password
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise that resolves to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hash)
    return isValid
  } catch (error) {
    // Return false instead of throwing to prevent timing attacks
    return false
  }
}

/**
 * Custom error for password validation failures
 */
export class PasswordValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PasswordValidationError'
  }
}

/**
 * Validate password against requirements
 * @param password - Password to validate
 * @throws PasswordValidationError if validation fails
 */
export function validatePassword(password: string): void {
  const errors: string[] = []

  // Check length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`)
  }

  // Check for uppercase letters
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Check for lowercase letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Check for special characters (optional)
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  if (errors.length > 0) {
    throw new PasswordValidationError(errors.join('. '))
  }
}

/**
 * Calculate password strength based on various criteria
 * @param password - Password to analyze
 * @returns PasswordStrength enum value
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0

  // Length scoring
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // Character variety scoring
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++

  // No common patterns
  const commonPatterns = [
    /^123/,
    /^abc/i,
    /password/i,
    /qwerty/i,
    /^(.)\1+$/, // All same character
  ]
  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password))
  if (hasCommonPattern) score -= 2

  // Return strength based on score
  if (score <= 3) return PasswordStrength.WEAK
  if (score <= 5) return PasswordStrength.FAIR
  if (score <= 7) return PasswordStrength.GOOD
  return PasswordStrength.STRONG
}

/**
 * Generate a random secure password
 * @param length - Length of password to generate (default: 16)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const allChars = uppercase + lowercase + numbers + special

  let password = ''

  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password to randomize positions
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}
