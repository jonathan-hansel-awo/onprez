import {
  BRUTE_FORCE_THRESHOLDS,
  ACCOUNT_LOCK_DURATION,
  calculateProgressiveLockDuration,
  PROGRESSIVE_DELAY,
  SUSPICIOUS_ACTIVITY,
} from 'lib/constants/brute-force-protection'

describe('Brute Force Protection Constants', () => {
  describe('BRUTE_FORCE_THRESHOLDS', () => {
    it('should have valid threshold values', () => {
      expect(BRUTE_FORCE_THRESHOLDS.MAX_FAILED_ATTEMPTS).toBe(5)
      expect(BRUTE_FORCE_THRESHOLDS.RESET_WINDOW_MS).toBe(15 * 60 * 1000)
      expect(BRUTE_FORCE_THRESHOLDS.INITIAL_LOCK_DURATION_MS).toBe(30 * 60 * 1000)
    })
  })

  describe('calculateProgressiveLockDuration', () => {
    it('should return first lock duration for 5-7 attempts', () => {
      expect(calculateProgressiveLockDuration(5)).toBe(ACCOUNT_LOCK_DURATION.FIRST_LOCK)
      expect(calculateProgressiveLockDuration(7)).toBe(ACCOUNT_LOCK_DURATION.FIRST_LOCK)
    })

    it('should return second lock duration for 8-10 attempts', () => {
      expect(calculateProgressiveLockDuration(8)).toBe(ACCOUNT_LOCK_DURATION.SECOND_LOCK)
      expect(calculateProgressiveLockDuration(10)).toBe(ACCOUNT_LOCK_DURATION.SECOND_LOCK)
    })

    it('should return third lock duration for 11-15 attempts', () => {
      expect(calculateProgressiveLockDuration(11)).toBe(ACCOUNT_LOCK_DURATION.THIRD_LOCK)
      expect(calculateProgressiveLockDuration(15)).toBe(ACCOUNT_LOCK_DURATION.THIRD_LOCK)
    })

    it('should return persistent lock for 16+ attempts', () => {
      expect(calculateProgressiveLockDuration(16)).toBe(ACCOUNT_LOCK_DURATION.PERSISTENT_LOCK)
      expect(calculateProgressiveLockDuration(100)).toBe(ACCOUNT_LOCK_DURATION.PERSISTENT_LOCK)
    })
  })

  describe('PROGRESSIVE_DELAY', () => {
    it('should have progressive delay values', () => {
      expect(PROGRESSIVE_DELAY.ATTEMPT_3).toBe(2000)
      expect(PROGRESSIVE_DELAY.ATTEMPT_4).toBe(5000)
      expect(PROGRESSIVE_DELAY.ATTEMPT_5_PLUS).toBe(10000)
    })
  })

  describe('SUSPICIOUS_ACTIVITY', () => {
    it('should have suspicious activity thresholds', () => {
      expect(SUSPICIOUS_ACTIVITY.RAPID_ATTEMPTS_THRESHOLD).toBe(10)
      expect(SUSPICIOUS_ACTIVITY.RAPID_ATTEMPTS_WINDOW_MS).toBe(5 * 60 * 1000)
      expect(SUSPICIOUS_ACTIVITY.MULTIPLE_ACCOUNTS_THRESHOLD).toBe(3)
      expect(SUSPICIOUS_ACTIVITY.MULTIPLE_ACCOUNTS_WINDOW_MS).toBe(10 * 60 * 1000)
    })
  })
})
