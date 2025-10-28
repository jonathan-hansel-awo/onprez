'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSignupForm } from '@/lib/hooks/useSignupForm'
import { useHandleAvailability } from '@/lib/hooks/useHandleAvailability'
import { PasswordStrength } from '@/components/auth/PasswordStrength'

const BUSINESS_CATEGORIES = [
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
  const { formData, errors, isLoading, handleChange, handleSubmit } = useSignupForm()
  const { isChecking, isAvailable, message, checkHandle } = useHandleAvailability()
  const [showSuccess, setShowSuccess] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await handleSubmit(data => {
      setShowSuccess(true)
      // Redirect to verification page after 3 seconds
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
      }, 3000)
    })
  }

  const handleHandleChange = (value: string) => {
    handleChange('handle', value)
    if (value.length >= 3) {
      checkHandle(value)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-600 mb-4">
            We&apos;ve sent a verification email to <strong>{formData.email}</strong>
          </p>
          <p className="text-sm text-gray-500">Redirecting you to the verification page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create your OnPrez</h1>
          <p className="mt-2 text-gray-600">Get your own digital presence in minutes</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* General Form Error */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.form}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => handleChange('password', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <PasswordStrength password={formData.password} />
            </div>

            {/* Handle */}
            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-gray-700 mb-1">
                Your Handle
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  onprez.com/
                </span>
                <input
                  id="handle"
                  type="text"
                  value={formData.handle}
                  onChange={e => handleHandleChange(e.target.value)}
                  className={`flex-1 px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.handle || (isAvailable === false && message)
                      ? 'border-red-300'
                      : isAvailable === true
                        ? 'border-green-300'
                        : 'border-gray-300'
                  }`}
                  placeholder="your-name"
                  disabled={isLoading}
                />
              </div>
              {isChecking && <p className="mt-1 text-sm text-gray-500">Checking availability...</p>}
              {!isChecking && isAvailable === true && (
                <p className="mt-1 text-sm text-green-600">✓ Handle is available!</p>
              )}
              {!isChecking && isAvailable === false && message && (
                <p className="mt-1 text-sm text-red-600">{message}</p>
              )}
              {errors.handle && <p className="mt-1 text-sm text-red-600">{errors.handle}</p>}
            </div>

            {/* Business Name */}
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={e => handleChange('businessName', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.businessName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Your Business Name"
                disabled={isLoading}
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            {/* Business Category */}
            <div>
              <label
                htmlFor="businessCategory"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Business Category
              </label>
              <select
                id="businessCategory"
                value={formData.businessCategory}
                onChange={e => handleChange('businessCategory', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.businessCategory ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                {BUSINESS_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.businessCategory && (
                <p className="mt-1 text-sm text-red-600">{errors.businessCategory}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isChecking || isAvailable === false}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
