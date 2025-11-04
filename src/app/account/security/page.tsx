'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/form'
import { PasswordConfirmModal } from '@/components/account/PasswordConfirmModal'
import {
  Shield,
  Smartphone,
  Key,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface MfaStatus {
  mfaEnabled: boolean
  hasBackupCodes: boolean
  backupCodesCount?: number
}

interface TrustedDevice {
  id: string
  deviceName: string
  ipAddress: string
  lastUsedAt: string
  createdAt: string
}

interface BackupCodeInfo {
  id: string
  used: boolean
  usedAt: string | null
  createdAt: string
}

export default function SecurityPage() {
  const router = useRouter()
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null)
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([])
  const [backupCodesInfo, setBackupCodesInfo] = useState<BackupCodeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [showViewCodesModal, setShowViewCodesModal] = useState(false)
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [mfaResponse, devicesResponse] = await Promise.all([
        fetch('/api/auth/mfa/status'),
        fetch('/api/account/trusted-devices'),
      ])

      if (mfaResponse.ok) {
        const mfaData = await mfaResponse.json()
        setMfaStatus(mfaData.data)
      }

      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json()
        setTrustedDevices(devicesData.data.devices)
      }
    } catch (err) {
      setError('Failed to load security settings')
      console.error('Fetch data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDisableMfa = async (password: string) => {
    const response = await fetch('/api/auth/mfa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to disable MFA')
    }

    await fetchData()
  }

  const handleRegenerateCodes = async (password: string) => {
    const response = await fetch('/api/auth/mfa/regenerate-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to regenerate codes')
    }

    setNewBackupCodes(data.data.backupCodes)
    await fetchData()
  }

  const handleViewCodes = async (password: string) => {
    const response = await fetch('/api/auth/mfa/backup-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to view codes')
    }

    setBackupCodesInfo(data.data.codes)
  }

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this trusted device?')) {
      return
    }

    try {
      const response = await fetch(`/api/account/trusted-devices/${deviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove device')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove device')
    }
  }

  const downloadBackupCodes = () => {
    const text = `OnPrez MFA Backup Codes\n\nIMPORTANT: Store these codes securely. Each can only be used once.\n\n${newBackupCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'onprez-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security</h1>
        <p className="text-gray-600 mt-2">Manage your account security settings</p>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-onprez-blue" />
            </div>
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {mfaStatus?.mfaEnabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">MFA is enabled</p>
                    <p className="text-sm text-gray-600">Your account is protected</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">MFA is disabled</p>
                    <p className="text-sm text-gray-600">Enable for better security</p>
                  </div>
                </>
              )}
            </div>
            {mfaStatus?.mfaEnabled ? (
              <Button variant="ghost" onClick={() => setShowDisableModal(true)}>
                Disable MFA
              </Button>
            ) : (
              <Button variant="primary" onClick={() => router.push('/mfa/setup?from=account')}>
                Enable MFA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Backup Codes */}
      {mfaStatus?.mfaEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Key className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <CardTitle>Backup Codes</CardTitle>
                <CardDescription>
                  Use these codes if you lose access to your authenticator
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  You have{' '}
                  <span className="font-semibold text-gray-900">
                    {mfaStatus.backupCodesCount || 0}
                  </span>{' '}
                  backup codes available
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowViewCodesModal(true)}
                  className="flex-1"
                >
                  View Status
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowRegenerateModal(true)}
                  className="flex-1"
                >
                  Regenerate Codes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trusted Devices */}
      {mfaStatus?.mfaEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Trusted Devices</CardTitle>
                <CardDescription>Devices where you won&apos;t need MFA for 30 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trustedDevices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No trusted devices</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trustedDevices.map(device => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{device.deviceName}</p>
                        <p className="text-sm text-gray-500">
                          {device.ipAddress} • Last used{' '}
                          {new Date(device.lastUsedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveDevice(device.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <PasswordConfirmModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={handleDisableMfa}
        title="Disable Two-Factor Authentication"
        description="Enter your password to disable MFA. This will make your account less secure."
      />

      <PasswordConfirmModal
        isOpen={showRegenerateModal}
        onClose={() => {
          setShowRegenerateModal(false)
          setNewBackupCodes([])
        }}
        onConfirm={handleRegenerateCodes}
        title="Regenerate Backup Codes"
        description="This will invalidate all existing backup codes. Enter your password to continue."
      />

      <PasswordConfirmModal
        isOpen={showViewCodesModal}
        onClose={() => {
          setShowViewCodesModal(false)
          setBackupCodesInfo([])
        }}
        onConfirm={handleViewCodes}
        title="View Backup Codes Status"
        description="Enter your password to view your backup codes status."
      />

      {/* New Backup Codes Display */}
      <AnimatePresence>
        {newBackupCodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>New Backup Codes</CardTitle>
                <CardDescription>
                  Save these codes securely. They will only be shown once.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Download or copy these codes now. Each code can only be used once.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                  {newBackupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-sm text-center py-2 px-4 bg-white rounded border border-gray-200"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-3 w-full">
                  <Button variant="secondary" onClick={downloadBackupCodes} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setNewBackupCodes([])}
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backup Codes Info Display */}
      <AnimatePresence>
        {backupCodesInfo.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Backup Codes Status</CardTitle>
                <CardDescription>View which codes have been used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {backupCodesInfo.map((code, index) => (
                    <div
                      key={code.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        code.used ? 'bg-gray-100' : 'bg-green-50'
                      }`}
                    >
                      <span className="text-sm font-medium">Code #{index + 1}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          code.used ? 'bg-gray-200 text-gray-700' : 'bg-green-200 text-green-700'
                        }`}
                      >
                        {code.used ? 'Used' : 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => setBackupCodesInfo([])} className="w-full">
                  Close
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
