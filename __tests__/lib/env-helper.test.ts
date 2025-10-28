import {
  getBaseUrl,
  hasDatabaseConfigured,
  hasSupabaseConfigured,
  hasStripeConfigured,
  hasEmailConfigured,
  getLogLevel,
  getAppMetadata,
} from '@/lib/config/env-helper'

describe('Environment Helpers', () => {
  describe('getBaseUrl', () => {
    it('should return the base URL', () => {
      const url = getBaseUrl()
      expect(url).toBeDefined()
      expect(url).toMatch(/^https?:\/\//)
    })
  })

  describe('Service configuration checks', () => {
    it('should check database configuration', () => {
      const hasDb = hasDatabaseConfigured()
      expect(typeof hasDb).toBe('boolean')
      // In test environment, we mock the database URL
      expect(hasDb).toBe(true)
    })

    it('should check Supabase configuration', () => {
      const hasSupabase = hasSupabaseConfigured()
      expect(typeof hasSupabase).toBe('boolean')
      // In test environment, we mock Supabase
      expect(hasSupabase).toBe(true)
    })

    it('should check Stripe configuration', () => {
      const hasStripe = hasStripeConfigured()
      expect(typeof hasStripe).toBe('boolean')
      // Stripe is not configured in test environment
      expect(hasStripe).toBe(false)
    })

    it('should check email configuration', () => {
      const hasEmail = hasEmailConfigured()
      expect(typeof hasEmail).toBe('boolean')
      // Email is not configured in test environment
      expect(hasEmail).toBe(false)
    })
  })

  describe('getLogLevel', () => {
    it('should return appropriate log level for environment', () => {
      const logLevel = getLogLevel()
      expect(['debug', 'info', 'warn', 'error']).toContain(logLevel)
      // In test environment, should be 'warn'
      expect(logLevel).toBe('warn')
    })
  })

  describe('getAppMetadata', () => {
    it('should return app metadata', () => {
      const metadata = getAppMetadata()

      expect(metadata).toHaveProperty('name')
      expect(metadata).toHaveProperty('url')
      expect(metadata).toHaveProperty('environment')

      expect(metadata.name).toBe('OnPrez')
      expect(metadata.environment).toBe('test')
    })
  })
})
