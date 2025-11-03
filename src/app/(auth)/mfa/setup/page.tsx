'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, FormError } from '@/components/form'
import { Shield, Copy, Check, Download, AlertTriangle, ArrowLeft } from 'lucide-react'

function MfaSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'loading' | 'scan' | 'verify' | 'backup'>('loading')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    setupMfa()
  }, [])

  const setupMfa = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const userId = searchParams.get('userId')
      const email = searchParams.get('email')

      if (!token || !userId || !email) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to setup MFA')
        return
      }

      setQrCodeUrl(data.data.qrCodeUrl)
      setSecret(data.data.secret)
      setBackupCodes(data.data.backupCodes)
      setStep('scan')
    } catch (err) {
      setError('An error occurred while setting up MFA')
      console.error('MFA setup error:', err)
    }
  }

  const verifySetup = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const userId = searchParams.get('userId')

      const response = await fetch('/api/auth/mfa/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, token: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Invalid verification code')
        setLoading(false)
        return
      }

      setStep('backup')
    } catch (err) {
      setError('An error occurred during verification')
      console.error('Verification error:', err)
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadBackupCodes = () => {
    const text = `OnPrez MFA Backup Codes\n\nIMPORTANT: Store these codes securely. Each can only be used once.\n\n${backupCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'onprez-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  const finishSetup = () => {
    if (!downloaded) {
      setError('Please download your backup codes before continuing')
      return
    }
    router.push('/dashboard')
  }

  if (step === 'loading') {
    return (
      <div className="w-full max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="backdrop-blur-xl bg-white/95 border-white/20">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onprez-blue mx-auto mb-4" />
              <p className="text-gray-600">Setting up MFA...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex p-4 rounded-full bg-white/20 backdrop-blur-sm mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Two-Factor Authentication</h1>
        <p className="text-white/80">Add an extra layer of security to your account</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-xl bg-white/95 border-white/20">
          <CardContent className="p-8">
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

            {/* Step 1: Scan QR Code */}
            {step === 'scan' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-onprez-blue text-white font-semibold text-sm">
                      1
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Scan QR Code</h2>
                  </div>
                  <p className="text-gray-600 text-sm ml-11">
                    Use an authenticator app like Google Authenticator, Authy, or 1Password to scan
                    this QR code.
                  </p>
                </div>

                <div className="flex justify-center p-6 bg-gray-50 rounded-xl">
                  {qrCodeUrl && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <Image
                        src={qrCodeUrl}
                        alt="MFA QR Code"
                        width={200}
                        height={200}
                        priority
                        className="rounded-lg"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Or enter this code manually:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-900 border border-gray-200">
                      {secret}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copySecret}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button onClick={() => setStep('verify')} variant="primary" className="w-full">
                  Continue to Verification
                </Button>
              </motion.div>
            )}

            {/* Step 2: Verify Code */}
            {step === 'verify' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-onprez-blue text-white font-semibold text-sm">
                      2
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Enter Verification Code</h2>
                  </div>
                  <p className="text-gray-600 text-sm ml-11">
                    Enter the 6-digit code from your authenticator app to verify the setup.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '')
                      setVerificationCode(value)
                      setError('')
                    }}
                    placeholder="000000"
                    disabled={loading}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                  />

                  <Button
                    onClick={verifySetup}
                    disabled={loading || verificationCode.length !== 6}
                    variant="primary"
                    className="w-full"
                  >
                    {loading ? 'Verifying...' : 'Verify and Enable MFA'}
                  </Button>
                </div>

                <button
                  onClick={() => setStep('scan')}
                  className="w-full text-sm text-onprez-blue hover:text-blue-700 font-medium inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to QR Code
                </button>
              </motion.div>
            )}

            {/* Step 3: Backup Codes */}
            {step === 'backup' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-onprez-blue text-white font-semibold text-sm">
                      3
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Save Your Backup Codes</h2>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        Important: Save these codes securely
                      </p>
                      <p className="text-sm text-amber-800">
                        Each code can only be used once if you lose access to your authenticator
                        app.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-sm text-center py-2.5 px-4 bg-white rounded-lg border border-gray-200 text-gray-900"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={downloadBackupCodes}
                  variant={downloaded ? 'secondary' : 'primary'}
                  className="w-full"
                >
                  {downloaded ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Codes Downloaded
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Backup Codes
                    </>
                  )}
                </Button>

                <Button
                  onClick={finishSetup}
                  disabled={!downloaded}
                  variant="primary"
                  className="w-full"
                >
                  {downloaded ? 'Complete Setup' : 'Download codes to continue'}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center text-sm text-white/80"
      >
        <p>
          Two-factor authentication adds an extra layer of security to your account.
          <br />
          You&apos;ll need your authenticator app to log in from now on.
        </p>
      </motion.div>
    </div>
  )
}

export default function MfaSetupPage() {
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
      <MfaSetupContent />
    </Suspense>
  )
}
