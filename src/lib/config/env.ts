import { z } from 'zod'

/**
 * Environment variable schema with validation
 * This ensures all required env vars are present and valid
 */
const envSchema = z.object({
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('OnPrez'),

  // Database Connection
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  PRODUCTION_DATABASE_URL: z.string().optional(),
  PRODUCTION_DIRECT_URL: z.string().optional(),
  PREVIEW_DATABASE_URL: z.string().optional(),
  PREVIEW_DIRECT_URL: z.string().optional(),

  // Supabase Auth - Will be configured in Area 3
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Email Service (Resend) - Required for auth flows
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  FROM_EMAIL: z.string().email().default('noreply@onprez.com'),
  FROM_NAME: z.string().default('OnPrez'),
  SUPPORT_EMAIL: z.string().email().default('support@onprez.com'),
  APP_URL: z.string().url().optional(), // Fallback to NEXT_PUBLIC_APP_URL

  // Payment Processing (Stripe) - Will be configured later
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // SMS Service (Twilio) - Optional, for future use
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  //MFA Encryption Key - Optional
  MFA_ENCRYPTION_KEY: z
    .string()
    .min(32, 'MFA_ENCRYPTION_KEY must be at least 32 characters')
    .optional(),

  // Uploadthing Configuration
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  // Analytics - Optional
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),

  // Cloudinary Configuration
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform(val => val === 'true')
    .default(false),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default('30d'),
})

/**
 * Validate and parse environment variables
 * This runs at build time and runtime to ensure all vars are valid
 */
function parseEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.log('Environment Variables:', process.env)
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

/**
 * Type-safe environment variables
 * Use this throughout the app instead of process.env
 */
export const env = parseEnv()

/**
 * Check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Check if we're running tests
 */
export const isTest = env.NODE_ENV === 'test'
