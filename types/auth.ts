// types/auth.ts

import { User, Session, SecurityLog } from '@prisma/client'

/**
 * User without sensitive data
 */
export type SafeUser = Omit<User, 'passwordHash'>

/**
 * Session with user data
 */
export type SessionWithUser = Session & {
  user: SafeUser
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * Registration data
 */
export interface RegistrationData {
  email: string
  password: string
  handle: string // For business
  businessName: string
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string
}

/**
 * Password reset completion
 */
export interface PasswordResetComplete {
  token: string
  newPassword: string
}

/**
 * MFA verification
 */
export interface MfaVerification {
  code: string
  trustDevice?: boolean
}

/**
 * Security event types
 */
export type SecurityEventAction =
  | 'login'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'account_locked'
  | 'account_unlocked'
  | 'session_created'
  | 'session_terminated'

export type SecurityEventSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  endpoint: string
  maxAttempts: number
  windowMs: number
}
