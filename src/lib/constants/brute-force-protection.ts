/**
 * Brute force protection thresholds
 */
export const BRUTE_FORCE_THRESHOLDS = {
  MAX_FAILED_ATTEMPTS: 5, // Lock after 5 failed attempts
  RESET_WINDOW_MS: 15 * 60 * 1000, // Reset counter after 10 minutes of no attempts
  INITIAL_LOCK_DURATION_MS: 30 * 60 * 1000, // 30 minutes for first lock
} as const

/**
 * Account lock durations
 */
export const ACCOUNT_LOCK_DURATION = {
  FIRST_LOCK: 30 * 60 * 1000, // 30 minutes
  SECOND_LOCK: 60 * 60 * 1000, // 1 hour
  THIRD_LOCK: 2 * 60 * 60 * 1000, // 2 hours
  PERSISTENT_LOCK: 24 * 60 * 60 * 1000, // 24 hours for repeat offenders
} as const

/**
 * Calculate progressive lock duration based on number of failed attempts
 */
export function calculateProgressiveLockDuration(failedAttempts: number): number {
  if (failedAttempts <= 7) {
    return ACCOUNT_LOCK_DURATION.FIRST_LOCK
  } else if (failedAttempts <= 10) {
    return ACCOUNT_LOCK_DURATION.SECOND_LOCK
  } else if (failedAttempts <= 15) {
    return ACCOUNT_LOCK_DURATION.THIRD_LOCK
  } else {
    return ACCOUNT_LOCK_DURATION.PERSISTENT_LOCK
  }
}

/**
 * Progressive delay thresholds
 */
export const PROGRESSIVE_DELAY = {
  ATTEMPT_3: 2000, // 2 seconds
  ATTEMPT_4: 5000, // 5 seconds
  ATTEMPT_5_PLUS: 10000, // 10 seconds
} as const

/**
 * Suspicious activity indicators
 */
export const SUSPICIOUS_ACTIVITY = {
  RAPID_ATTEMPTS_THRESHOLD: 10, // 10 attempts in short time
  RAPID_ATTEMPTS_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  MULTIPLE_ACCOUNTS_THRESHOLD: 3, // Trying 3+ different accounts
  MULTIPLE_ACCOUNTS_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
} as const
