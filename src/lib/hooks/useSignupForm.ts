/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { signupSchema, type SignupInput } from '@/lib/validation/auth'
import { ZodError } from 'zod'

interface FormErrors {
  email?: string
  password?: string
  handle?: string
  businessName?: string
  businessCategory?: string
  form?: string
}

interface UseSignupFormReturn {
  formData: SignupInput
  errors: FormErrors
  isLoading: boolean
  handleChange: (field: keyof SignupInput, value: string) => void
  handleSubmit: (onSuccess: (data: any) => void) => Promise<void>
  clearError: (field: keyof FormErrors) => void
}

export function useSignupForm(): UseSignupFormReturn {
  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    password: '',
    handle: '',
    businessName: '',
    businessCategory: 'OTHER',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: keyof SignupInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (onSuccess: (data: any) => void) => {
    try {
      setIsLoading(true)
      setErrors({})

      // Validate form data
      const validatedData = signupSchema.parse(formData)

      // Submit to API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          // Handle field-specific errors from API
          const fieldErrors: FormErrors = {}
          result.errors.forEach((err: { field: string; message: string }) => {
            fieldErrors[err.field as keyof FormErrors] = err.message
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ form: result.message || 'Signup failed' })
        }
        return
      }

      // Success!
      onSuccess(result.data)
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors
        const fieldErrors: FormErrors = {}
        error.issues.forEach(err => {
          const field = err.path[0] as keyof FormErrors
          fieldErrors[field] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ form: 'An unexpected error occurred. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    errors,
    isLoading,
    handleChange,
    handleSubmit,
    clearError,
  }
}
