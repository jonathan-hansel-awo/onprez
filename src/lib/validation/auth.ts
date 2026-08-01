import { z } from 'zod'

/**
 * Handle validation rules
 */
export const HANDLE_REGEX = /^[a-z0-9-]+$/
const MIN_HANDLE_LENGTH = 3
const MAX_HANDLE_LENGTH = 30

/**
 * Reserved handles that cannot be used
 */
export const RESERVED_HANDLES = [
  'admin',
  'api',
  'app',
  'about',
  'help',
  'support',
  'contact',
  'terms',
  'privacy',
  'blog',
  'dashboard',
  'login',
  'signup',
  'logout',
  'settings',
  'profile',
  'account',
  'billing',
  'pricing',
  'features',
  'careers',
  'jobs',
  'team',
  'legal',
  'onprez',
  'www',
  'mail',
  'ftp',
  'test',
  'demo',
  'staging',
  'dev',
  'development',
  'prod',
  'production',
] as const

export const businessHandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(MIN_HANDLE_LENGTH, `Handle must be at least ${MIN_HANDLE_LENGTH} characters`)
  .max(MAX_HANDLE_LENGTH, `Handle must not exceed ${MAX_HANDLE_LENGTH} characters`)
  .regex(HANDLE_REGEX, 'Handle can only contain lowercase letters, numbers, and hyphens')
  .refine(
    handle => !RESERVED_HANDLES.includes(handle as (typeof RESERVED_HANDLES)[number]),
    'This handle is reserved'
  )

/**
 * Sign up request schema
 */
export const signupSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  handle: businessHandleSchema,
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must not exceed 100 characters'),
  businessCategory: z.enum([
    'SALON',
    'BARBERSHOP',
    'SPA',
    'MASSAGE',
    'NAILS',
    'BEAUTY',
    'FITNESS',
    'YOGA',
    'PERSONAL_TRAINING',
    'THERAPY',
    'COUNSELING',
    'TUTORING',
    'CONSULTING',
    'PHOTOGRAPHY',
    'VIDEOGRAPHY',
    'EVENT_PLANNING',
    'CATERING',
    'CLEANING',
    'HOME_SERVICES',
    'PET_SERVICES',
    'OTHER',
  ]),
})

export type SignupInput = z.infer<typeof signupSchema>

/**
 * Sign up response schema
 */
export const signupResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .object({
      userId: z.string(),
      email: z.string(),
      businessId: z.string(),
      handle: z.string(),
      requiresVerification: z.boolean(),
    })
    .optional(),
})

export type SignupResponse = z.infer<typeof signupResponseSchema>
