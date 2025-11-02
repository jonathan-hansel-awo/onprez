/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { signupSchema } from '@/lib/validation/auth'

export interface ValidationRule {
  required?: { value: boolean; message: string }
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  custom?: { validate: (value: any) => boolean | string; message?: string }
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

export function validateField(value: any, rules: ValidationRule): string | null {
  if (rules.required?.value && !value) {
    return rules.required.message
  }

  if (!value) return null

  if (rules.minLength && value.length < rules.minLength.value) {
    return rules.minLength.message
  }

  if (rules.maxLength && value.length > rules.maxLength.value) {
    return rules.maxLength.message
  }

  if (rules.pattern && !rules.pattern.value.test(value)) {
    return rules.pattern.message
  }

  if (rules.custom) {
    const result = rules.custom.validate(value)
    if (typeof result === 'string') return result
    if (result === false) return rules.custom.message || 'Invalid value'
  }

  return null
}

export function validateForm(
  data: Record<string, any>,
  rules: ValidationRules
): { isValid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {}

  Object.keys(rules).forEach(field => {
    const error = validateField(data[field], rules[field])
    if (error) {
      errors[field] = error
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Zod-based validation using your existing auth schema
export function validateWithZod<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { isValid: boolean; errors: ValidationErrors; data?: T } {
  try {
    const validData = schema.parse(data)
    return { isValid: true, errors: {}, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationErrors = {}
      error.issues.forEach(err => {
        const field = err.path.join('.')
        errors[field] = err.message
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { form: 'Validation failed' } }
  }
}

// Common validation rules
export const commonRules = {
  email: {
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Please enter a valid email address',
    },
  },
  password: {
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain uppercase, lowercase, and number',
    },
  },
  handle: {
    minLength: {
      value: 3,
      message: 'Handle must be at least 3 characters',
    },
    pattern: {
      value: /^[a-z0-9-]+$/,
      message: 'Handle can only contain lowercase letters, numbers, and hyphens',
    },
  },
  phone: {
    pattern: {
      value: /^[\d\s\-\+\(\)]+$/,
      message: 'Please enter a valid phone number',
    },
  },
  url: {
    pattern: {
      value: /^https?:\/\/.+/,
      message: 'Please enter a valid URL',
    },
  },
}
