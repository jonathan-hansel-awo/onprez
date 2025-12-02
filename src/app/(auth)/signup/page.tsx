'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input, FormError, SelectOption, Select } from '@/components/form'
import { Button } from '@/components/ui/button'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { Confetti } from '@/components/effects/confetti'
import { validateWithZod } from '@/lib/validation/form-validation'
import { signupSchema } from '@/lib/validation/auth'
import { useAnnounce } from '@/lib/hooks/use-announce'
import { useFocusTrap } from '@/lib/hooks/use-focus-trap'
import { usePasswordVisibility } from '@/lib/hooks/use-password-visibility'
import { LockIcon, EyeIcon, EyeOffIcon, Check, Copy } from 'lucide-react'
import { useClipboard } from '@/lib/hooks/use-clipboard'
import { sessionStorage } from '@/lib/utils/session-storage'
import Loading from '@/app/[handle]/loading'

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

function SignupPageComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    handle: '',
    businessName: '',
    businessCategory: 'SALON',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<'idle' | 'validating' | 'creating' | 'success'>(
    'idle'
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const { isCopied, copy } = useClipboard()
  const announce = useAnnounce()
  const formRef = useFocusTrap<HTMLFormElement>(true)
  const { showPassword, toggleVisibility } = usePasswordVisibility(3000)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    message: string
    retryAfter?: number
    resetAt?: Date
  } | null>(null)

  useEffect(() => {
    const handleFromUrl = searchParams.get('handle')
    const saved = sessionStorage.get()

    setFormData(prev => ({
      ...prev,
      handle: handleFromUrl || saved?.handle || prev.handle,
      email: saved?.email || prev.email,
      businessName: saved?.businessName || prev.businessName,
      businessCategory: saved?.businessCategory || prev.businessCategory,
    }))

    if (handleFromUrl) {
      checkHandleAvailability(handleFromUrl)
    }
  }, [searchParams])

  const generateSuggestions = (handle: string) => {
    const sanitized = handle.toLowerCase().replace(/[^a-z0-9-]/g, '')
    return [
      `${sanitized}-pro`,
      `${sanitized}-studio`,
      `${sanitized}${Math.floor(Math.random() * 100)}`,
    ]
  }

  const checkHandleAvailability = async (handle: string) => {
    if (handle.length < 3) {
      setIsAvailable(null)
      setSuggestions([])
      return
    }

    setIsChecking(true)
    announce('Checking handle availability')

    try {
      const response = await fetch(`/api/auth/check-handle?handle=${handle}`)
      const data = await response.json()

      // Handle rate limiting
      if (response.status === 429) {
        announce('Too many handle checks. Please wait a moment.')
        setIsChecking(false)
        return
      }

      setIsAvailable(data.available)

      if (data.available) {
        announce(`Handle ${handle} is available`)
        setSuggestions([])
      } else {
        announce(`Handle ${handle} is already taken. Please try another.`)
        setSuggestions(generateSuggestions(handle))
      }
    } catch (error) {
      console.error('Failed to check handle availability:', error)
      announce('Error checking handle availability')
    } finally {
      setIsChecking(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (field !== 'password') {
      sessionStorage.save({ [field]: value })
    }
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

    setLoadingStage('validating')
    const { isValid, errors: validationErrors } = validateWithZod(formData, signupSchema)

    if (!isValid) {
      setErrors(validationErrors)
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 500)
      setLoadingStage('idle')
      return
    }

    if (isAvailable === false) {
      setErrors({ handle: 'This handle is already taken' })
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 500)
      setLoadingStage('idle')
      return
    }

    setErrors({})
    setRateLimitInfo(null)
    setIsLoading(true)
    setLoadingStage('creating')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      // Handle rate limiting from server
      if (response.status === 429) {
        const retryAfter = result.retryAfter || 60
        const resetAt = result.resetAt ? new Date(result.resetAt) : undefined
        const minutesLeft = Math.ceil(retryAfter / 60)

        setRateLimitInfo({
          message:
            result.message ||
            `Too many signup attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
          retryAfter,
          resetAt,
        })

        setShouldShake(true)
        setTimeout(() => setShouldShake(false), 500)
        setLoadingStage('idle')
        setIsLoading(false)
        return
      }

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
        setShouldShake(true)
        setTimeout(() => setShouldShake(false), 500)
        setLoadingStage('idle')
        setIsLoading(false)
        return
      }

      setLoadingStage('success')
      sessionStorage.clear()
      setShowSuccess(true)
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      }, 3000)
    } catch (error) {
      setErrors({ form: `An unexpected error occurred. Please try again. ${error}` })
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 500)
      setLoadingStage('idle')
    } finally {
      setIsLoading(false)
    }
  }

  const loadingMessages = {
    idle: 'Claim Your Handle',
    validating: 'Validating...',
    creating: 'Creating your account...',
    success: 'Account created!',
  }

  if (showSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Confetti active={true} />
          <Card className="backdrop-blur-xl bg-white/95 border-white/20 text-center relative overflow-hidden">
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-onprez-blue via-onprez-purple to-onprez-green"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ backgroundSize: '200% 200%', opacity: 0.1 }}
            />

            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 px-4 sm:px-6 relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Your handle is secured! 🎉
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg mb-4">
                  <p className="text-lg font-mono text-onprez-blue">
                    onprez.com/<strong>{formData.handle}</strong>
                  </p>
                  <button
                    onClick={() => copy(`onprez.com/${formData.handle}`)}
                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                    aria-label="Copy handle to clipboard"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-onprez-blue" />
                    )}
                  </button>
                </div>

                <p className="text-gray-600 mb-2">We&apos;ve sent a verification email to</p>
                <p className="font-semibold text-gray-900 mb-4">{formData.email}</p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-2 text-sm text-gray-500"
                >
                  <div className="w-2 h-2 bg-onprez-blue rounded-full animate-pulse" />
                  <span>Redirecting you to verification...</span>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    // Update the main page wrapper at the very top level:
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-8 lg:py-0">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start lg:items-center">
        {/* Left: Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
              Three steps to go live
            </h1>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {[
              {
                step: '1',
                title: 'Claim your handle',
                desc: 'onprez.com/yourname',
              },
              {
                step: '2',
                title: 'Add your services and photos',
                desc: 'Customize your page',
              },
              {
                step: '3',
                title: 'Share your link and start booking',
                desc: 'Go live instantly',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold border border-white/30">
                  {item.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-white text-lg mb-1">{item.title}</h3>
                  <p className="text-sm text-white/70">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        {/* Right: Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-h-[85vh] lg:max-h-none overflow-y-auto lg:overflow-visible"
        >
          <motion.div
            animate={
              shouldShake
                ? {
                    x: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.5 },
                  }
                : {}
            }
          >
            <Card className="backdrop-blur-xl bg-white/95 border-white/20 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden max-h-[90vh] lg:max-h-none flex flex-col">
              {/* <div className="absolute inset-0 bg-gradient-to-r from-onprez-blue via-onprez-purple to-onprez-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" /> */}

              <CardContent className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Create your OnPrez
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Get your digital presence in minutes
                  </p>
                </motion.div>

                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-5"
                  aria-label="Create account form"
                  noValidate
                >
                  {' '}
                  {/* Global Error */}
                  <AnimatePresence>
                    {rateLimitInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <FormError
                          title="Rate Limit Exceeded"
                          errors={rateLimitInfo.message}
                          dismissible
                          onDismiss={() => setRateLimitInfo(null)}
                        />
                        {rateLimitInfo.resetAt && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Try again after {new Date(rateLimitInfo.resetAt).toLocaleTimeString()}
                          </p>
                        )}
                      </motion.div>
                    )}
                    {errors.form && !rateLimitInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Handle - Featured with spotlight */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="relative"
                  >
                    {/* Spotlight effect when focused */}
                    {isAvailable === true && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -inset-4 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-2xl blur-xl -z-10"
                      />
                    )}

                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Claim Your Handle ✨
                    </label>
                    <div className="relative">
                      <div
                        className="flex rounded-xl overflow-hidden border-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-onprez-blue/20 touch-manipulation"
                        style={{
                          borderColor:
                            errors.handle || isAvailable === false
                              ? '#ef4444'
                              : isAvailable === true
                                ? '#10b981'
                                : '#d1d5db',
                        }}
                      >
                        <span className="inline-flex items-center px-3 sm:px-4 bg-gray-50 text-gray-500 text-xs sm:text-sm font-medium border-r">
                          onprez.com/
                        </span>
                        <input
                          id="handle"
                          type="text"
                          value={formData.handle}
                          onChange={e => handleChange('handle', e.target.value.toLowerCase())}
                          className="flex-1 px-3 sm:px-4 py-3 focus:outline-none bg-white text-base"
                          placeholder="your-handle"
                          disabled={isLoading}
                          autoComplete="off"
                          autoCapitalize="off"
                          autoCorrect="off"
                          aria-label="Choose your handle"
                          aria-required="true"
                          aria-invalid={!!errors.handle || isAvailable === false}
                          aria-describedby={
                            isChecking
                              ? 'handle-checking'
                              : isAvailable === true
                                ? 'handle-available'
                                : isAvailable === false
                                  ? 'handle-taken'
                                  : errors.handle
                                    ? 'handle-error'
                                    : undefined
                          }
                        />
                        {isChecking && (
                          <span id="handle-checking" className="sr-only">
                            Checking handle availability
                          </span>
                        )}
                        {!isChecking && isAvailable === true && (
                          <span id="handle-available" className="sr-only">
                            Handle is available
                          </span>
                        )}
                        {!isChecking && isAvailable === false && (
                          <span id="handle-taken" className="sr-only">
                            This handle is already taken
                          </span>
                        )}
                        {isChecking && (
                          <div className="flex items-center px-4">
                            <div className="w-4 h-4 border-2 border-onprez-blue border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {!isChecking && isAvailable === true && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
                    <AnimatePresence>
                      {!isChecking && isAvailable === true && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="mt-2"
                        >
                          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Perfect! This handle is available
                          </div>
                        </motion.div>
                      )}
                      {!isChecking && isAvailable === false && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="mt-2 space-y-2"
                        >
                          <p className="text-sm text-red-600 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            This handle is already taken. Try one of these:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.map(suggestion => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleChange('handle', suggestion)}
                                className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-onprez-blue rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      error={errors.password}
                      disabled={isLoading}
                      leftIcon={<LockIcon />}
                      rightIcon={showPassword ? <EyeIcon /> : <EyeOffIcon />}
                      onRightIconClick={toggleVisibility}
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
                      className="w-full h-12 sm:h-auto text-base relative overflow-hidden touch-manipulation"
                    >
                      <span className={loadingStage !== 'idle' ? 'invisible' : ''}>
                        {loadingMessages.idle}
                      </span>
                      {loadingStage !== 'idle' && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          {loadingStage === 'success' ? (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5"
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
                            </motion.svg>
                          ) : (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              {loadingMessages[loadingStage]}
                            </>
                          )}
                        </span>
                      )}
                    </Button>
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
          </motion.div>

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

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignupPageComponent />
    </Suspense>
  )
}
