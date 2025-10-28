'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (token) {
      verifyToken(token)
    } else if (!email) {
      setStatus('error')
      setMessage('Invalid verification link')
    }
  }, [token])

  const verifyToken = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus('success')
        setMessage(result.message)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(result.message)
      }
    } catch (error) {
      setStatus('error')
      setMessage('Failed to verify email. Please try again.')
    }
  }

  const handleResend = async () => {
    if (!email) {
      setResendMessage('Email address is required')
      return
    }

    setIsResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.success) {
        setResendMessage('Verification email sent! Please check your inbox.')
      } else {
        setResendMessage(result.message)
      }
    } catch (error) {
      setResendMessage('Failed to send verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            {/* Resend Section */}
            {email && (
              <div className="border-t pt-6">
                <p className="text-sm text-gray-600 mb-4">Need a new verification link?</p>
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>
                {resendMessage && (
                  <p
                    className={`mt-2 text-sm ${
                      resendMessage.includes('sent') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {resendMessage}
                  </p>
                )}
              </div>
            )}

            {/* Back to Login */}
            <div className="mt-6">
              <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
