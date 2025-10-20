/**
 * Database Configuration
 * Dynamically selects between production and preview databases
 * based on DATABASE_ENV environment variable
 */

export function getDatabaseUrls() {
  const env = process.env.DATABASE_ENV || 'preview'

  if (env === 'production') {
    return {
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL!,
    }
  }

  // Default to preview/development
  return {
    url: process.env.PREVIEW_DATABASE_URL!,
    directUrl: process.env.PREVIEW_DIRECT_URL!,
  }
}

export function isDevelopment() {
  return process.env.DATABASE_ENV !== 'production'
}

export function getCurrentDatabaseEnv() {
  return process.env.DATABASE_ENV || 'preview'
}
