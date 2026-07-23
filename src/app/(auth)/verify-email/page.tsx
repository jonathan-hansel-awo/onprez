'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, LoaderCircle, MailCheck, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type VerificationStatus = 'awaiting' | 'verifying' | 'success' | 'error'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<VerificationStatus>(token ? 'verifying' : 'awaiting')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const verifyToken = useCallback(
    async (verificationToken: string) => {
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
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        setStatus('error')
        setMessage(result.message)
      } catch (_error) {
        setStatus('error')
        setMessage('Failed to verify email. Please try again.')
      }
    },
    [router]
  )

  useEffect(() => {
    if (token) {
      setStatus('verifying')
      void verifyToken(token)
      return
    }

    if (email) {
      setStatus('awaiting')
      return
    }

    setStatus('error')
    setMessage('Invalid verification link')
  }, [email, token, verifyToken])

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

      setResendMessage(
        result.success
          ? 'If your account still needs verification, we have sent a fresh link. Check your inbox and spam or junk folder.'
          : result.message
      )
    } catch (_error) {
      setResendMessage('Failed to send verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const resendControls = email ? (
    <div className="space-y-4 border-t pt-6">
      <p className="text-sm text-gray-600">Did not receive the email?</p>
      <Button onClick={handleResend} disabled={isResending} variant="primary" className="w-full">
        {isResending ? 'Sending...' : 'Resend verification email'}
      </Button>
      {resendMessage && (
        <p
          className={`text-sm ${
            resendMessage.includes('sent') ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {resendMessage}
        </p>
      )}
    </div>
  ) : null

  return (
    <div className="mx-auto w-full max-w-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="border-white/20 bg-white/95 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            {status === 'awaiting' && (
              <>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <MailCheck className="h-10 w-10 text-onprez-blue" aria-hidden="true" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Check your inbox</h2>
                <p className="text-gray-600">
                  We have sent a verification link to
                  {email && <strong className="mt-1 block text-gray-900">{email}</strong>}
                </p>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  Open the email and select <strong>Verify Email Address</strong> to activate your
                  account. If it has not arrived within a few minutes, check your spam or junk
                  folder.
                </p>
                <div className="my-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left">
                  <p className="text-sm leading-6 text-blue-950">
                    Your presence page is saved as a <strong>draft</strong>. After verifying, sign
                    in to finish it and click <strong>Publish</strong> when you are ready to make it
                    accessible.
                  </p>
                </div>
                {resendControls}
              </>
            )}

            {status === 'verifying' && (
              <>
                <LoaderCircle
                  className="mx-auto mb-4 h-16 w-16 animate-spin text-onprez-blue"
                  aria-hidden="true"
                />
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Verifying your email...</h2>
                <p className="text-gray-600">
                  We are activating your account from the link you opened.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2
                  className="mx-auto mb-6 h-20 w-20 text-green-600"
                  aria-hidden="true"
                />
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Email verified!</h2>
                <p className="mb-4 text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Redirecting to login...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto mb-6 h-20 w-20 text-red-600" aria-hidden="true" />
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Verification failed</h2>
                <p className="mb-6 text-gray-600">{message}</p>
                {resendControls}
                <div className="mt-6">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-onprez-blue hover:text-blue-700"
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
