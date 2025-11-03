'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Checkbox, FormError } from '@/components/form'
import { validateForm, commonRules } from '@/lib/validation/form-validation'
import { useFocusTrap } from '@/lib/hooks/use-focus-trap'
import { useAnnounce } from '@/lib/hooks/use-announce'
import { usePasswordVisibility } from '@/lib/hooks/use-password-visibility'
import { EyeIcon, EyeOffIcon, LockIcon } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<
    'idle' | 'validating' | 'authenticating' | 'success'
  >('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shouldShake, setShouldShake] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const announce = useAnnounce()
  const formRef = useFocusTrap<HTMLFormElement>(true)
  const { showPassword, toggleVisibility } = usePasswordVisibility(3000)

  const [rateLimitInfo, setRateLimitInfo] = useState<{
    message: string
    retryAfter?: number
    resetAt?: Date
  } | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoadingStage('validating')
    const { isValid, errors: validationErrors } = validateForm(formData, {
      email: {
        required: { value: true, message: 'Email is required' },
        ...commonRules.email,
      },
      password: {
        required: { value: true, message: 'Password is required' },
      },
    })

    if (!isValid) {
      setErrors(validationErrors)
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 500)
      setLoadingStage('idle')

      const errorMessages = Object.values(validationErrors).join('. ')
      announce(`Form has errors: ${errorMessages}`)
      return
    }

    setErrors({})
    setRateLimitInfo(null)
    setIsLoading(true)
    setLoadingStage('authenticating')

    try {
      const response = await fetch('/api/auth/login', {
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
            `Too many login attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
          retryAfter,
          resetAt,
        })

        setShouldShake(true)
        setTimeout(() => setShouldShake(false), 500)
        announce(`Rate limit exceeded. Try again in ${minutesLeft} minutes.`)
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
          setErrors({ form: result.message || 'Login failed' })
        }
        setShouldShake(true)
        setTimeout(() => setShouldShake(false), 500)
        setLoadingStage('idle')
        setIsLoading(false)
        return
      }

      if (result.requiresMfa) {
        router.push(`/auth/mfa?token=${result.mfaToken}`)
        return
      }

      setLoadingStage('success')
      announce('Login successful. Redirecting to dashboard.')
      setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 1000)
    } catch (err) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' })
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 500)
      setLoadingStage('idle')
    } finally {
      setIsLoading(false)
    }
  }
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    // Implement social login
    window.location.href = `/api/auth/${provider}`
  }

  const loadingMessages = {
    idle: 'Sign in',
    validating: 'Checking...',
    authenticating: 'Signing in...',
    success: 'Success!',
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-xl text-white/80">Sign in to continue</p>
      </motion.div>

      {/* Body */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
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
          <Card className="backdrop-blur-xl bg-white/95 border-white/20 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            {/* <div className="absolute inset-0 bg-gradient-to-r from-onprez-blue via-onprez-purple to-onprez-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" /> */}

            <CardContent className="p-6 sm:p-8">
              {/* Success Overlay */}
              <AnimatePresence>
                {loadingStage === 'success' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="text-center"
                    >
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Welcome back!</h3>
                      <p className="text-gray-600 mt-1">Redirecting to your dashboard...</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <motion.div
                initial={isMobile ? { opacity: 0 } : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: isMobile ? 0.3 : 0.6, delay: isMobile ? 0 : 0.3 }}
                className="mb-6 sm:mb-8"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
                <p className="text-sm sm:text-base text-gray-600">Access your OnPrez dashboard</p>
              </motion.div>

              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-6"
                aria-label="Sign in form"
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
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Input
                    id="email"
                    type="email"
                    label="Email address"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    error={errors.email}
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-required="true"
                    leftIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    }
                  />
                </motion.div>
                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
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
                </motion.div>
                {/* Remember Me & Forgot Password */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="flex items-center justify-between"
                >
                  <Checkbox
                    label="Remember me"
                    checked={formData.rememberMe}
                    onChange={e => handleChange('rememberMe', e.target.checked)}
                    disabled={isLoading}
                  />

                  <Link
                    href="/forgot-password"
                    className="text-sm text-onprez-blue hover:text-blue-700 font-medium transition-colors relative group"
                  >
                    Forgot password?
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 group-hover:w-full transition-all duration-300" />
                  </Link>
                </motion.div>
                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="w-full h-12 sm:h-auto text-base"
                    aria-label={
                      loadingStage === 'idle'
                        ? 'Sign in to your account'
                        : loadingMessages[loadingStage]
                    }
                    aria-busy={isLoading}
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
                {/* Social Login (Optional) */}
                {/* <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  >
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { name: 'Google', icon: '🔍', provider: 'google' as const },
                        { name: 'Facebook', icon: '📘', provider: 'facebook' as const },
                        { name: 'Apple', icon: '🍎', provider: 'apple' as const },
                      ].map((social) => (
                        <Button
                          key={social.provider}
                          type="button"
                          variant="secondary"
                          onClick={() => handleSocialLogin(social.provider)}
                          disabled={isLoading}
                          className="w-full"
                        >
                          <span className="text-lg mr-1">{social.icon}</span>
                          <span className="hidden sm:inline">{social.name}</span>
                        </Button>
                      ))}
                    </div>
                  </motion.div> */}
                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.9 }}
                  className="relative my-6"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">New to OnPrez?</span>
                  </div>
                </motion.div>
                {/* Sign Up Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1 }}
                  className="text-center"
                >
                  <Link
                    href="/signup"
                    className="text-onprez-blue hover:text-blue-700 font-semibold transition-colors relative group inline-block"
                  >
                    Create a free account
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
          transition={{ duration: 0.4, delay: 1.1 }}
          className="mt-6 text-center text-xs text-white/80"
        >
          By signing in, you agree to our{' '}
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
  )
}

function LoginLoading() {
  return (
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      <p className="mt-4 text-white">Loading...</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}
