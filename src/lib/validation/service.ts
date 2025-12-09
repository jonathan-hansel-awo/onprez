import { z } from 'zod'

export const serviceSchema = z.object({
  name: z
    .string()
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name cannot exceed 100 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  tagline: z.string().max(150, 'Tagline cannot exceed 150 characters').optional().nullable(),
  price: z.number().min(0, 'Price cannot be negative').max(100000, 'Price cannot exceed £100,000'),
  priceType: z.enum(['FIXED', 'RANGE', 'STARTING_AT', 'FREE']).default('FIXED'),
  priceRangeMin: z.number().min(0).optional().nullable(),
  priceRangeMax: z.number().min(0).optional().nullable(),
  duration: z
    .number()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
  bufferTime: z
    .number()
    .min(-1, 'Buffer time cannot be less than -1')
    .max(120, 'Buffer time cannot exceed 2 hours')
    .default(0),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  galleryImages: z.array(z.string().url()).optional(),
  requiresApproval: z.boolean().default(false),
  requiresDeposit: z.boolean().default(false),
  depositAmount: z.number().min(0).optional().nullable(),
  // Booking limits
  maxAdvanceBookingDays: z
    .number()
    .min(-1, 'Use -1 for business default')
    .max(365, 'Cannot exceed 365 days')
    .optional()
    .nullable(),
  minAdvanceBookingHours: z
    .number()
    .min(0, 'Minimum advance time cannot be negative')
    .max(168, 'Cannot exceed 7 days')
    .optional()
    .nullable(),
  // Display
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
  // Content
  preparationNotes: z.string().max(500).optional().nullable(),
  aftercareNotes: z.string().max(500).optional().nullable(),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
})

export const createServiceSchema = serviceSchema.extend({
  businessId: z.string(),
})

export const updateServiceSchema = serviceSchema.partial().extend({
  id: z.string(),
})

export type ServiceInput = z.infer<typeof serviceSchema>
export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
