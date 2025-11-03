'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, FormError, Checkbox } from '@/components/form'
import { Shield, KeyRound, ArrowLeft, Clock } from 'lucide-react'

function MfaChallengeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes

  const tempToken = searchParams.get('token')

  useEffect(() => {
    if (!tempToken) {
      router.push('/login')
      return
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/login?expired=true')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [tempToken, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!tempToken) {
      setError('Invalid session. Please log in again.')
      return
    }

    if (useBackupCode && code.length < 8) {
      setError('Please enter a valid backup code')
      return
    }

    if (!useBackupCode && code.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/mfa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          code: useBackupCode ? code : code,
          isBackupCode: useBackupCode,
          trustDevice,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Invalid verification code')
        setIsLoading(false)
        return
      }

      // Store tokens
      if (result.data?.accessToken) {
        localStorage.setItem('accessToken', result.data.accessToken)
        localStorage.setItem('refreshToken', result.data.refreshToken)
      }

      // Redirect to dashboard
      const redirect = searchParams.get('redirect') || '/dashboard'
      router.push(redirect)
    } catch (err) {
      setError('An error occurred during verification')
      console.error('MFA challenge error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCodeType = () => {
    setUseBackupCode(!useBackupCode)
    setCode('')
    setError('')
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex p-4 rounded-full bg-white/20 backdrop-blur-sm mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Two-Factor Authentication</h1>
        <p className="text-white/80">Enter the verification code from your authenticator app</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-xl bg-white/95 border-white/20">
          <CardContent className="p-8">
            {/* Timer */}
            <div className="mb-6 p-3 bg-blue-50 rounded-lg flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">
                Session expires in {formatTime(timeRemaining)}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <FormError errors={error} dismissible onDismiss={() => setError('')} />
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode={useBackupCode ? 'text' : 'numeric'}
                  pattern={useBackupCode ? undefined : '[0-9]*'}
                  maxLength={useBackupCode ? 20 : 6}
                  value={code}
                  onChange={e => {
                    const value = useBackupCode
                      ? e.target.value.toUpperCase()
                      : e.target.value.replace(/\D/g, '')
                    setCode(value)
                    setError('')
                  }}
                  placeholder={useBackupCode ? 'XXXX-XXXX-XXXX-XXXX' : '000000'}
                  label={useBackupCode ? 'Backup Code' : 'Verification Code'}
                  disabled={isLoading}
                  className={
                    useBackupCode ? 'font-mono' : 'text-center text-2xl tracking-[0.5em] font-mono'
                  }
                  autoFocus
                  leftIcon={useBackupCode ? <KeyRound className="w-5 h-5" /> : undefined}
                />

                <button
                  type="button"
                  onClick={toggleCodeType}
                  className="text-sm text-onprez-blue hover:text-blue-700 font-medium"
                >
                  {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
                </button>
              </div>

              <div className="space-y-4">
                <Checkbox
                  label="Trust this device for 30 days"
                  checked={trustDevice}
                  onChange={e => setTrustDevice(e.target.checked)}
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  disabled={isLoading || (useBackupCode ? code.length < 8 : code.length !== 6)}
                  variant="primary"
                  className="w-full"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Lost access to your authenticator?{' '}
                <Link href="/support" className="text-onprez-blue hover:text-blue-700 font-medium">
                  Contact support
                </Link>
              </p>

              <Link
                href="/login"
                className="text-sm text-onprez-blue hover:text-blue-700 font-medium inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center text-sm text-white/80"
      >
        <p>
          Enter the 6-digit code from your authenticator app.
          <br />
          The code changes every 30 seconds.
        </p>
      </motion.div>
    </div>
  )
}

export default function MfaChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto">
          <Card className="backdrop-blur-xl bg-white/95 border-white/20">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onprez-blue mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <MfaChallengeContent />
    </Suspense>
  )
}
