'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
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
    <div className="w-full max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="backdrop-blur-xl bg-white/95 border-white/20">
          <CardContent className="p-8 text-center">
            {/* Verifying State */}
            {status === 'verifying' && (
              <>
                <div className="w-16 h-16 border-4 border-onprez-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying email...</h2>
                <p className="text-gray-600">Please wait while we verify your email address.</p>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
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
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-sm text-gray-500">Redirecting to login...</p>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-red-600"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h2>
                <p className="text-gray-600 mb-6">{message}</p>

                {email && (
                  <div className="border-t pt-6 space-y-4">
                    <p className="text-sm text-gray-600">Need a new verification link?</p>
                    <Button
                      onClick={handleResend}
                      disabled={isResending}
                      variant="primary"
                      className="w-full"
                    >
                      {isResending ? 'Sending...' : 'Resend verification email'}
                    </Button>
                    {resendMessage && (
                      <p
                        className={`text-sm ${
                          resendMessage.includes('sent') ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {resendMessage}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <Link
                    href="/login"
                    className="text-onprez-blue hover:text-blue-700 text-sm font-medium"
                  >
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
