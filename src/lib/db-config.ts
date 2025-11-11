/**
 * Database Configuration
 * Dynamically selects between production and preview databases
 * based on DATABASE_ENV environment variable
 */

export function getDatabaseUrls() {
  const env = process.env.DATABASE_ENV || 'preview'

  if (env === 'production') {
    return {
      url: process.env.PRODUCTION_DATABASE_URL!,
      directUrl: process.env.PRODUCTION_DIRECT_URL!,
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
