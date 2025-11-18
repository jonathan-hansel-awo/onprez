import { get } from 'http'
import { env } from './env'
import { getAppUrl } from '../utils/get-app-url'

/**
 * Helper functions for environment-specific behavior
 */

/**
 * Get the base URL for the application
 * Useful for absolute URLs in emails, redirects, etc.
 */
export function getBaseUrl(): string {
  return getAppUrl() || env.NEXT_PUBLIC_APP_URL!
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof env): boolean {
  const value = env[feature]
  return value === true || value === 'true'
}

/**
 * Get analytics config
 */
export function getAnalyticsConfig() {
  return {
    enabled: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    googleAnalyticsId: env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  }
}

/**
 * Check if we have database configured
 */
export function hasDatabaseConfigured(): boolean {
  return Boolean(env.DATABASE_URL)
}

/**
 * Check if we have Supabase Auth configured
 */
export function hasSupabaseConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/**
 * Check if we have Stripe configured
 */
export function hasStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

/**
 * Check if we have email service configured
 */
export function hasEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.FROM_EMAIL)
}

/**
 * Get email configuration
 */
export function getEmailConfig() {
  return {
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.FROM_EMAIL,
    fromName: env.FROM_NAME,
    appUrl: env.APP_URL || env.NEXT_PUBLIC_APP_URL,
  }
}

/**
 * Get environment-specific logging level
 */
export function getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  if (env.NODE_ENV === 'production') return 'error'
  if (env.NODE_ENV === 'test') return 'warn'
  return 'debug'
}

/**
 * Safe console.log that only logs in development
 */
export function devLog(...args: unknown[]) {
  if (env.NODE_ENV === 'development') {
    console.log('[DEV]', ...args)
  }
}

/**
 * Get app metadata
 */
export function getAppMetadata() {
  return {
    name: env.NEXT_PUBLIC_APP_NAME,
    url: env.NEXT_PUBLIC_APP_URL,
    environment: env.NODE_ENV,
  }
}
