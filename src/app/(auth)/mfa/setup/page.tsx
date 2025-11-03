'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/form'
import { Shield, Copy, Check, Download, AlertTriangle } from 'lucide-react'

function MfaSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'loading' | 'scan' | 'verify' | 'backup' | 'complete'>('loading')
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
        <Card className="backdrop-blur-xl bg-white/95 border-white/20">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-onprez-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Setting up MFA...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex p-4 rounded-full bg-white/20 backdrop-blur-sm mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Enable two-factor authentication</h1>
        <p className="text-white/80">Add an extra layer of security to your account</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-xl bg-white/95 border-white/20">
          <CardContent className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Step 1: Scan QR Code */}
            {step === 'scan' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-semibold text-lg mb-2">Step 1: Scan QR code</h2>
                  <p className="text-sm text-gray-600">
                    Use an authenticator app like Google Authenticator, Authy, or 1Password to scan
                    this QR code.
                  </p>
                </div>

                <div className="flex justify-center p-6 bg-white rounded-lg border">
                  {qrCodeUrl && (
                    <Image src={qrCodeUrl} alt="MFA QR Code" width={200} height={200} priority />
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Or enter this code manually:</p>
                  <div className="flex items-center gap-2">
                    <Input value={secret} readOnly className="font-mono text-sm" />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copySecret}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button onClick={() => setStep('verify')} variant="primary" className="w-full">
                  Continue to verification
                </Button>
              </div>
            )}

            {/* Step 2: Verify Code */}
            {step === 'verify' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-semibold text-lg mb-2">Step 2: Enter verification code</h2>
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit code from your authenticator app to verify the setup.
                  </p>
                </div>

                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '')
                    setVerificationCode(value)
                    setError('')
                  }}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                />

                <div className="space-y-3">
                  <Button
                    onClick={verifySetup}
                    disabled={loading || verificationCode.length !== 6}
                    variant="primary"
                    className="w-full"
                  >
                    {loading ? 'Verifying...' : 'Verify and enable MFA'}
                  </Button>

                  <Button variant="secondary" onClick={() => setStep('scan')} className="w-full">
                    Back to QR code
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Backup Codes */}
            {step === 'backup' && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h2 className="font-semibold text-amber-900 mb-1">Save your backup codes</h2>
                      <p className="text-sm text-amber-800">
                        Store these codes securely. Each code can only be used once if you lose
                        access to your authenticator app.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 space-y-2">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="font-mono text-sm text-center py-2 px-4 bg-gray-50 rounded"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={downloadBackupCodes}
                  variant={downloaded ? 'secondary' : 'primary'}
                  className="w-full"
                >
                  {downloaded ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Codes downloaded
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download backup codes
                    </>
                  )}
                </Button>

                <Button
                  onClick={finishSetup}
                  disabled={!downloaded}
                  variant="primary"
                  className="w-full"
                >
                  {downloaded ? 'Complete setup' : 'Download codes to continue'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-white/80">
          <p>
            Two-factor authentication adds an extra layer of security to your account.
            <br />
            You&apos;ll need your authenticator app to log in from now on.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function MfaSetupPage() {
  return (
    <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
      <MfaSetupContent />
    </Suspense>
  )
}
