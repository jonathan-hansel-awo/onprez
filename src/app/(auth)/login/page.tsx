'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Checkbox, FormError } from '@/components/form'
import { Button } from '@/components/ui/button'
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      return
    }

    setErrors({})
    setIsLoading(true)

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
        return
      }

      if (result.requiresMfa) {
        router.push(`/auth/mfa?token=${result.mfaToken}`)
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' })
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
              Welcome back to{' '}
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                OnPrez
              </span>
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Manage your online presence, handle bookings, and grow your business—all in one place.
            </p>
          </motion.div>

          {/* Illustration/Stats */}
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
          <Card className="backdrop-blur-xl bg-white/95 border-white/20 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            {/* Gradient border on hover */}
            {/* <div className="absolute inset-0 border-gradient-to-r from-onprez-blue via-onprez-purple to-onprez-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" /> */}

            <CardContent className="p-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
                <p className="text-gray-600">Access your OnPrez dashboard</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
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
                  transition={{ duration: 0.4, delay: 0.9 }}
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

          {/* Terms - Mobile */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1 }}
            className="mt-6 text-center text-xs text-white/80 lg:hidden"
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

      {/* Terms - Desktop */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
        className="hidden lg:block mt-8 text-center text-xs text-white/80"
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
