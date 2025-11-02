'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Select, SelectOption, FormError } from '@/components/form'
import { Button } from '@/components/ui/button'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { Confetti } from '@/components/effects/confetti'
import { validateWithZod } from '@/lib/validation/form-validation'
import { signupSchema } from '@/lib/validation/auth'
import { AvatarStack } from '@/components/ui'
import { heroAvatars } from '@/data/avatars'

const BUSINESS_CATEGORIES: SelectOption[] = [
  { value: 'SALON', label: 'Hair Salon' },
  { value: 'BARBERSHOP', label: 'Barbershop' },
  { value: 'SPA', label: 'Spa & Wellness' },
  { value: 'MASSAGE', label: 'Massage Therapy' },
  { value: 'NAILS', label: 'Nail Salon' },
  { value: 'BEAUTY', label: 'Beauty Services' },
  { value: 'FITNESS', label: 'Fitness & Gym' },
  { value: 'YOGA', label: 'Yoga Studio' },
  { value: 'PERSONAL_TRAINING', label: 'Personal Training' },
  { value: 'THERAPY', label: 'Therapy & Counseling' },
  { value: 'COUNSELING', label: 'Counseling' },
  { value: 'TUTORING', label: 'Tutoring' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'VIDEOGRAPHY', label: 'Videography' },
  { value: 'EVENT_PLANNING', label: 'Event Planning' },
  { value: 'CATERING', label: 'Catering' },
  { value: 'CLEANING', label: 'Cleaning Services' },
  { value: 'HOME_SERVICES', label: 'Home Services' },
  { value: 'PET_SERVICES', label: 'Pet Services' },
  { value: 'OTHER', label: 'Other' },
]

export default function SignupPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    handle: '',
    businessName: '',
    businessCategory: 'SALON',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const checkHandleAvailability = async (handle: string) => {
    if (handle.length < 3) {
      setIsAvailable(null)
      return
    }

    setIsChecking(true)
    try {
      const response = await fetch(`/api/auth/check-handle?handle=${handle}`)
      const data = await response.json()
      setIsAvailable(data.available)
    } catch (error) {
      console.error('Failed to check handle availability:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    if (field === 'handle') {
      const timeout = setTimeout(() => checkHandleAvailability(value), 500)
      return () => clearTimeout(timeout)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors: validationErrors } = validateWithZod(formData, signupSchema)

    if (!isValid) {
      setErrors(validationErrors)
      return
    }

    if (isAvailable === false) {
      setErrors({ handle: 'This handle is already taken' })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          const apiErrors: Record<string, string> = {}
          result.errors.forEach((err: { field: string; message: string }) => {
            apiErrors[err.field] = err.message
          })
          setErrors(apiErrors)
        } else {
          setErrors({ form: result.message || 'Signup failed' })
        }
        return
      }

      setShowSuccess(true)
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      }, 3000)
    } catch (err) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Confetti active={true} />
          <Card className="backdrop-blur-xl bg-white/95 border-white/20 text-center">
            <CardContent className="pt-12 pb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your handle is secured!</h2>
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a verification email to <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-gray-500">Redirecting you to verification...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left: Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
              Join thousands of{' '}
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                professionals
              </span>
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Create your complete online presence in 10 minutes. No website needed.
            </p>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4 mt-12"
          >
            {[
              {
                icon: '🎨',
                title: 'Fully Customizable',
                desc: 'Your brand, your colors, your style',
              },
              {
                icon: '📅',
                title: 'Seamless Booking',
                desc: 'Clients book directly from your page',
              },
              {
                icon: '🚀',
                title: 'Go Live in Minutes',
                desc: 'No coding or design skills needed',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4 text-white/90"
              >
                <span className="flex-shrink-0 text-3xl">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/70">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center gap-2 mt-8"
          >
            <div className="flex -space-x-2">
              <AvatarStack avatars={heroAvatars} />
            </div>
            <p className="text-white/80 text-sm ml-2">
              <strong className="text-white">2,500+</strong> professionals already joined
            </p>
          </motion.div>
        </motion.div>

        {/* Right: Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="backdrop-blur-xl bg-white/95 border-white/20 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            {/* Gradient border on hover */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-onprez-blue via-onprez-purple to-onprez-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" /> */}

            <CardContent className="p-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your OnPrez</h2>
                <p className="text-gray-600">Get your digital presence in minutes</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Global Error */}
                {errors.form && (
                  <FormError
                    errors={errors.form}
                    dismissible
                    onDismiss={() =>
                      setErrors(prev => {
                        const { form, ...rest } = prev
                        return rest
                      })
                    }
                  />
                )}

                {/* Handle - Featured */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Claim Your Handle ✨
                  </label>
                  <div className="relative">
                    <div
                      className="flex rounded-xl overflow-hidden border-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-onprez-blue/20"
                      style={{
                        borderColor:
                          errors.handle || isAvailable === false
                            ? '#ef4444'
                            : isAvailable === true
                              ? '#10b981'
                              : '#d1d5db',
                      }}
                    >
                      <span className="inline-flex items-center px-4 bg-gray-50 text-gray-500 text-sm font-medium border-r">
                        onprez.com/
                      </span>
                      <input
                        id="handle"
                        type="text"
                        value={formData.handle}
                        onChange={e => handleChange('handle', e.target.value.toLowerCase())}
                        className="flex-1 px-4 py-3 focus:outline-none bg-white"
                        placeholder="your-name"
                        disabled={isLoading}
                      />
                      {isChecking && (
                        <div className="flex items-center px-4">
                          <div className="w-4 h-4 border-2 border-onprez-blue border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!isChecking && isAvailable === true && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center px-4"
                        >
                          <svg
                            className="w-5 h-5 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {!isChecking && isAvailable === true && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-green-600 font-medium"
                    >
                      ✓ Perfect! This handle is available
                    </motion.p>
                  )}
                  {!isChecking && isAvailable === false && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600"
                    >
                      This handle is already taken. Try another one!
                    </motion.p>
                  )}
                  {errors.handle && <p className="mt-2 text-sm text-red-600">{errors.handle}</p>}
                </motion.div>

                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <Input
                    id="email"
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    error={errors.email}
                    disabled={isLoading}
                  />
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <Input
                    id="password"
                    type="password"
                    label="Password"
                    value={formData.password}
                    onChange={e => handleChange('password', e.target.value)}
                    error={errors.password}
                    disabled={isLoading}
                  />
                  <PasswordStrength password={formData.password} />
                </motion.div>

                {/* Business Name */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  <Input
                    id="businessName"
                    type="text"
                    label="Business Name"
                    value={formData.businessName}
                    onChange={e => handleChange('businessName', e.target.value)}
                    error={errors.businessName}
                    disabled={isLoading}
                  />
                </motion.div>

                {/* Business Category */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                >
                  <Select
                    id="businessCategory"
                    label="Business Category"
                    options={BUSINESS_CATEGORIES}
                    value={formData.businessCategory}
                    onChange={e => handleChange('businessCategory', e.target.value)}
                    error={errors.businessCategory}
                    disabled={isLoading}
                  />
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 }}
                >
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading || isChecking || isAvailable === false}
                    className="w-full"
                  >
                    {isLoading ? 'Creating your account...' : 'Claim Your Handle'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Free forever • No credit card required • 2 minutes to set up
                  </p>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1 }}
                  className="relative my-6"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Already have an account?</span>
                  </div>
                </motion.div>

                {/* Sign In Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.1 }}
                  className="text-center"
                >
                  <Link
                    href="/login"
                    className="text-onprez-blue hover:text-blue-700 font-semibold transition-colors relative group inline-block"
                  >
                    Sign in instead
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 group-hover:w-full transition-all duration-300" />
                  </Link>
                </motion.div>
              </form>
            </CardContent>
          </Card>

          {/* Terms */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.2 }}
            className="mt-6 text-center text-xs text-white/80"
          >
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-white">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-white">
              Privacy Policy
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
