/**
 * Database Configuration
 * Simplified to work with single DATABASE_URL
 */

export function getDatabaseUrls() {
  // Always use DATABASE_URL in production (Vercel)
  if (process.env.NODE_ENV === 'production') {
    return {
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DATABASE_URL!, // Same URL for now
    }
  }

  // In development, check for DATABASE_ENV
  const env = process.env.DATABASE_ENV || 'preview'

  if (env === 'production') {
    return {
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL!,
    }
  }

  // Default to preview/development
  return {
    url: process.env.PREVIEW_DATABASE_URL || process.env.DATABASE_URL!,
    directUrl: process.env.PREVIEW_DIRECT_URL || process.env.DATABASE_URL!,
  }
}

export function isDevelopment() {
  return process.env.NODE_ENV !== 'production'
}

export function getCurrentDatabaseEnv() {
  return process.env.DATABASE_ENV || 'preview'
}
