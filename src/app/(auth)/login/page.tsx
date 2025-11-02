'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Checkbox, FormError } from '@/components/form'
import { validateForm, commonRules } from '@/lib/validation/form-validation'

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
  const [showPassword, setShowPassword] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
      return
    }

    setErrors({})
    setIsLoading(true)
    setLoadingStage('authenticating')

    try {
      const response = await fetch('/api/auth/login', {
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
          setErrors({ form: result.message || 'Login failed' })
        }
        setShouldShake(true)
        setTimeout(() => setShouldShake(false), 500)
        setLoadingStage('idle')
        return
      }

      if (result.requiresMfa) {
        router.push(`/auth/mfa?token=${result.mfaToken}`)
        return
      }

      setLoadingStage('success')
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
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-12rem)] lg:min-h-0">
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
              Welcome back to{' '}
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                OnPrez
              </span>
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Manage your online presence, handle bookings, and grow your business—all in one place.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4 mt-12"
          >
            {[
              { icon: '✓', text: '2,500+ professionals trust OnPrez' },
              { icon: '✓', text: '45K+ monthly bookings processed' },
              { icon: '✓', text: 'Your handle, your brand, your success' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 text-white/90"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Form Card */}
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
              <div className="absolute inset-0 bg-gradient-to-r from-onprez-blue via-onprez-purple to-onprez-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />

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

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Global Error */}
                  <AnimatePresence>
                    {errors.form && (
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
                      leftIcon={
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
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
                      leftIcon={
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      }
                      rightIcon={
                        showPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )
                      }
                      onRightIconClick={() => setShowPassword(!showPassword)}
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
