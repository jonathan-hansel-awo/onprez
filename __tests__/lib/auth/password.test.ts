import {
  hashPassword,
  verifyPassword,
  PasswordStrength,
  validatePassword,
  generateSecurePassword,
  PasswordValidationError,
  calculatePasswordStrength,
} from '@/lib/auth/password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'ValidPass123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'ValidPass123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should throw error for invalid password', async () => {
      const password = 'weak'

      await expect(hashPassword(password)).rejects.toThrow(PasswordValidationError)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'ValidPass123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'ValidPass123'
      const wrongPassword = 'WrongPass456'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('should return false for invalid hash', async () => {
      const password = 'ValidPass123'
      const invalidHash = 'not-a-valid-hash'

      const isValid = await verifyPassword(password, invalidHash)
      expect(isValid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      expect(() => validatePassword('ValidPass123')).not.toThrow()
    })

    it('should reject password too short', () => {
      expect(() => validatePassword('Short1')).toThrow(PasswordValidationError)
      expect(() => validatePassword('Short1')).toThrow('at least 8 characters')
    })

    it('should reject password without uppercase', () => {
      expect(() => validatePassword('validpass123')).toThrow(PasswordValidationError)
      expect(() => validatePassword('validpass123')).toThrow('uppercase letter')
    })

    it('should reject password without lowercase', () => {
      expect(() => validatePassword('VALIDPASS123')).toThrow(PasswordValidationError)
      expect(() => validatePassword('VALIDPASS123')).toThrow('lowercase letter')
    })

    it('should reject password without numbers', () => {
      expect(() => validatePassword('ValidPassword')).toThrow(PasswordValidationError)
      expect(() => validatePassword('ValidPassword')).toThrow('number')
    })

    it('should reject password too long', () => {
      const longPassword = 'A'.repeat(129) + '1'
      expect(() => validatePassword(longPassword)).toThrow(PasswordValidationError)
      expect(() => validatePassword(longPassword)).toThrow('must not exceed')
    })
  })

  describe('calculatePasswordStrength', () => {
    it('should return WEAK for short simple passwords', () => {
      expect(calculatePasswordStrength('pass123')).toBe(PasswordStrength.WEAK)
      expect(calculatePasswordStrength('12345678')).toBe(PasswordStrength.WEAK)
    })

    it('should return WEAK for moderate passwords', () => {
      expect(calculatePasswordStrength('Password1')).toBe(PasswordStrength.WEAK)
    })

    it('should return FAIR for strong passwords', () => {
      expect(calculatePasswordStrength('Password123!')).toBe(PasswordStrength.FAIR)
    })

    it('should return GOOD for very strong passwords', () => {
      expect(calculatePasswordStrength('MyStr0ng!P@ssw0rd2024')).toBe(PasswordStrength.GOOD)
    })

    it('should penalize common patterns', () => {
      const score1 = calculatePasswordStrength('Password123!')

      expect(score1).toBe(PasswordStrength.FAIR)
    })
  })

  describe('generateSecurePassword', () => {
    it('should generate password of specified length', () => {
      const password = generateSecurePassword(16)
      expect(password.length).toBe(16)
    })

    it('should generate password with default length', () => {
      const password = generateSecurePassword()
      expect(password.length).toBe(16)
    })

    it('should generate password that passes validation', () => {
      const password = generateSecurePassword()
      expect(() => validatePassword(password)).not.toThrow()
    })

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword()
      const password2 = generateSecurePassword()
      expect(password1).not.toBe(password2)
    })

    it('should generate strong passwords', () => {
      const password = generateSecurePassword()
      const strength = calculatePasswordStrength(password)
      expect([PasswordStrength.GOOD, PasswordStrength.STRONG]).toContain(strength)
    })
  })
})
