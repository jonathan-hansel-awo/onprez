// src/lib/db-config.ts
export function getDatabaseUrls() {
  // FIX: In production (Vercel), NODE_ENV is 'production', so use DATABASE_URL
  if (process.env.NODE_ENV === 'production') {
    const url = process.env.DATABASE_URL

    if (!url) {
      throw new Error('DATABASE_URL is not set in production environment')
    }

    return {
      url,
      directUrl: url, // Use same URL for both
    }
  }

  // Development: Use DATABASE_ENV to choose between preview/production
  const env = process.env.DATABASE_ENV || 'preview'

  if (env === 'production') {
    return {
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL!,
    }
  }

  // Preview/development
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
