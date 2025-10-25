import {
  BRUTE_FORCE_THRESHOLDS,
  calculateProgressiveLockDuration,
} from 'lib/constants/brute-force-protection'
import { prisma } from 'lib/prisma'
import { logSecurityEvent } from 'lib/services/security-logging'

export interface LoginAttemptResult {
  success: boolean
  isLocked: boolean
  lockedUntil?: Date
  remainingAttempts?: number
  progressiveDelay?: number
}

/**
 * Record a login attempt (success or failure)
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress: string,
  userAgent?: string,
  failureReason?: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  await prisma.authAttempt.create({
    data: {
      userId: user?.id,
      email,
      success,
      ipAddress,
      userAgent,
      attemptType: 'login',
      failureReason,
    },
  })

  // Log security event
  if (!success) {
    await logSecurityEvent({
      userId: user?.id,
      action: 'login_failed',
      details: {
        email,
        reason: failureReason,
      },
      ipAddress,
      userAgent,
      severity: 'warning',
    })
  }
}

/**
 * Check if account should be locked based on failed attempts
 */
export async function checkAndLockAccount(email: string): Promise<LoginAttemptResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      accountLocked: true,
      lockedUntil: true,
      failedLoginAttempts: true,
    },
  })

  if (!user) {
    // User doesn't exist, but don't reveal that
    return {
      success: false,
      isLocked: false,
      remainingAttempts: BRUTE_FORCE_THRESHOLDS.MAX_FAILED_ATTEMPTS,
    }
  }

  const now = new Date()

  // Check if already locked
  if (user.accountLocked && user.lockedUntil && user.lockedUntil > now) {
    return {
      success: false,
      isLocked: true,
      lockedUntil: user.lockedUntil,
    }
  }

  // Auto-unlock if lock duration has passed
  if (user.accountLocked && user.lockedUntil && user.lockedUntil <= now) {
    await unlockAccount(email)
    return {
      success: true,
      isLocked: false,
      remainingAttempts: BRUTE_FORCE_THRESHOLDS.MAX_FAILED_ATTEMPTS,
    }
  }

  // Check if threshold exceeded
  if (user.failedLoginAttempts >= BRUTE_FORCE_THRESHOLDS.MAX_FAILED_ATTEMPTS) {
    const lockDuration = calculateProgressiveLockDuration(user.failedLoginAttempts)
    const lockedUntil = new Date(now.getTime() + lockDuration)

    await prisma.user.update({
      where: { email },
      data: {
        accountLocked: true,
        lockedUntil,
      },
    })

    await logSecurityEvent({
      userId: user.id,
      action: 'account_locked',
      details: {
        reason: 'brute_force_protection',
        failedAttempts: user.failedLoginAttempts,
        lockDuration: lockDuration / 1000 / 60, // minutes
      },
      ipAddress: 'system',
      severity: 'critical',
    })

    return {
      success: false,
      isLocked: true,
      lockedUntil,
    }
  }

  const remainingAttempts = BRUTE_FORCE_THRESHOLDS.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts

  return {
    success: true,
    isLocked: false,
    remainingAttempts,
  }
}

/**
 * Increment failed login attempts
 */
export async function incrementFailedAttempts(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    return // User doesn't exist
  }

  await prisma.user.update({
    where: { email },
    data: {
      failedLoginAttempts: {
        increment: 1,
      },
      lastFailedLogin: new Date(),
    },
  })
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedAttempts(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    return
  }

  await prisma.user.update({
    where: { email },
    data: {
      failedLoginAttempts: 0,
      lastFailedLogin: null,
    },
  })
}

/**
 * Manually unlock an account
 */
export async function unlockAccount(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    return
  }

  await prisma.user.update({
    where: { email },
    data: {
      accountLocked: false,
      lockedUntil: null,
      failedLoginAttempts: 0,
      lastFailedLogin: null,
    },
  })

  await logSecurityEvent({
    userId: user.id,
    action: 'account_unlocked',
    details: {
      method: 'manual',
    },
    ipAddress: 'system',
    severity: 'info',
  })
}

/**
 * Get failed attempts for user within timeframe
 */
export async function getRecentFailedAttempts(
  email: string,
  timeframeMs: number = 60 * 60 * 1000 // 1 hour default
): Promise<number> {
  const since = new Date(Date.now() - timeframeMs)

  const count = await prisma.authAttempt.count({
    where: {
      email,
      success: false,
      attemptType: 'login',
      createdAt: {
        gte: since,
      },
    },
  })

  return count
}

/**
 * Calculate progressive delay based on failed attempts
 */
export function calculateProgressiveDelay(failedAttempts: number): number {
  if (failedAttempts <= 2) return 0 // No delay for first 2 attempts
  if (failedAttempts === 3) return 2000 // 2 seconds
  if (failedAttempts === 4) return 5000 // 5 seconds
  return 10000 // 10 seconds for 5+
}

/**
 * Check if login should be delayed
 */
export async function shouldDelayLogin(email: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { failedLoginAttempts: true },
  })

  if (!user) {
    return 0
  }

  return calculateProgressiveDelay(user.failedLoginAttempts)
}

/**
 * Get account lock status
 */
export async function getAccountLockStatus(email: string): Promise<{
  isLocked: boolean
  lockedUntil?: Date
  failedAttempts: number
  remainingAttempts: number
}> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      accountLocked: true,
      lockedUntil: true,
      failedLoginAttempts: true,
    },
  })

  if (!user) {
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: BRUTE_FORCE_THRESHOLDS.MAX_FAILED_ATTEMPTS,
    }
  }

  const now = new Date()
  const isLocked = user.accountLocked && user.lockedUntil ? user.lockedUntil > now : false

  return {
    isLocked,
    lockedUntil: isLocked ? user.lockedUntil! : undefined,
    failedAttempts: user.failedLoginAttempts,
    remainingAttempts: Math.max(
      0,
      BRUTE_FORCE_THRESHOLDS.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts
    ),
  }
}
