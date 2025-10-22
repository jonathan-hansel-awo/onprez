import {
  hashPassword,
  verifyPassword,
  validatePassword,
  calculatePasswordStrength,
  generateSecurePassword,
  PasswordValidationError,
} from './password'

/**
 * Example usage of password utilities
 */
export async function passwordUtilityExamples() {
  console.log('=== Password Utility Examples ===\n')

  // Example 1: Hash a password
  console.log('1. Hashing a password:')
  try {
    const password = 'MySecureP@ss123'
    const hash = await hashPassword(password)
    console.log('Original:', password)
    console.log('Hashed:', hash)
    console.log('✓ Password hashed successfully\n')
  } catch (error) {
    console.error('✗ Error:', error)
  }

  // Example 2: Verify password
  console.log('2. Verifying a password:')
  const password = 'MySecureP@ss123'
  const hash = await hashPassword(password)
  const isValid = await verifyPassword(password, hash)
  console.log('Password matches:', isValid)
  console.log('✓ Password verified successfully\n')

  // Example 3: Validate password
  console.log('3. Validating passwords:')
  const testPasswords = ['weak', 'StrongPass123', 'NoNumbers', '12345678']

  for (const pwd of testPasswords) {
    try {
      validatePassword(pwd)
      console.log(`✓ "${pwd}" is valid`)
    } catch (error) {
      if (error instanceof PasswordValidationError) {
        console.log(`✗ "${pwd}" is invalid: ${error.message}`)
      }
    }
  }
  console.log()

  // Example 4: Calculate password strength
  console.log('4. Password strength analysis:')
  const passwords = ['pass123', 'Password1', 'Password123!', 'MyV3ry$tr0ng!P@ssw0rd']

  for (const pwd of passwords) {
    const strength = calculatePasswordStrength(pwd)
    console.log(`"${pwd}" → ${strength}`)
  }
  console.log()

  // Example 5: Generate secure password
  console.log('5. Generating secure passwords:')
  for (let i = 0; i < 3; i++) {
    const generated = generateSecurePassword(16)
    const strength = calculatePasswordStrength(generated)
    console.log(`Generated: ${generated} (${strength})`)
  }
}

// Uncomment to run examples:
// passwordUtilityExamples()
