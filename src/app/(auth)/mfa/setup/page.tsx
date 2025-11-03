'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/form/input'
import { Shield, Copy, Check, Download, AlertTriangle } from 'lucide-react'

function MfaSetup() {
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up MFA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Enable Two-Factor Authentication</h1>
            <p className="text-muted-foreground">Add an extra layer of security to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Step 1: Scan QR Code */}
          {step === 'scan' && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-lg">Step 1: Scan QR Code</h2>
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app like Google Authenticator, Authy, or 1Password to scan
                  this QR code.
                </p>

                <div className="flex justify-center p-4 bg-white rounded-lg">
                  {qrCodeUrl && (
                    <Image src={qrCodeUrl} alt="MFA QR Code" width={200} height={200} priority />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Or enter this code manually:</p>
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
              </div>

              <Button onClick={() => setStep('verify')} className="w-full" size="lg">
                Continue to Verification
              </Button>
            </div>
          )}

          {/* Step 2: Verify Code */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-lg">Step 2: Enter Verification Code</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to verify the setup.
                </p>

                <div className="space-y-4">
                  <Input
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
                    className="text-center text-2xl tracking-widest font-mono"
                  />

                  <Button
                    onClick={verifySetup}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Verifying...' : 'Verify and Enable MFA'}
                  </Button>
                </div>
              </div>

              <Button variant="secondary" onClick={() => setStep('scan')} className="w-full">
                Back to QR Code
              </Button>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 'backup' && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h2 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-2">
                      Save Your Backup Codes
                    </h2>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Store these codes securely. Each code can only be used once if you lose access
                      to your authenticator app.
                    </p>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-4 space-y-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-sm text-center py-2 px-4 bg-muted rounded"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={downloadBackupCodes}
                  variant={downloaded ? 'secondary' : 'primary'}
                  className="w-full"
                  size="lg"
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
              </div>

              <Button onClick={finishSetup} disabled={!downloaded} className="w-full" size="lg">
                {downloaded ? 'Complete Setup' : 'Download codes to continue'}
              </Button>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Two-factor authentication adds an extra layer of security to your account.
            <br />
            You&apos;ll need your authenticator app to log in from now on.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MfaSetupPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center bg-muted/30" />}
    >
      <MfaSetup />
    </Suspense>
  )
}
