'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/form'
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Trash2,
  CheckCircle,
  LogOut,
  AlertTriangle,
} from 'lucide-react'
import { parseUserAgent, getDeviceDisplayName } from '@/lib/utils/device-parser'
import { useAuth } from '@/contexts/AuthContext'

interface Session {
  id: string
  token: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deviceInfo: any
  userAgent: string
  ipAddress: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export default function SessionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [showTerminateAllModal, setShowTerminateAllModal] = useState(false)
  const [terminatingAll, setTerminatingAll] = useState(false)

  useEffect(() => {
    fetchSessions()
    getCurrentSession()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/sessions')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch sessions')
      }

      setSessions(data.data.sessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
      console.error('Fetch sessions error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentSession = () => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      // Find session with matching token
      const currentSession = sessions.find(s => s.token === token)
      if (currentSession) {
        setCurrentSessionId(currentSession.id)
      }
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this session?')) {
      return
    }

    setTerminatingId(sessionId)

    try {
      const response = await fetch(`/api/account/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to terminate session')
      }

      // If terminating current session, logout
      if (sessionId === currentSessionId) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        router.push('/login')
        return
      }

      await fetchSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate session')
    } finally {
      setTerminatingId(null)
    }
  }

  const handleTerminateAll = async (keepCurrent: boolean) => {
    setTerminatingAll(true)

    try {
      const response = await fetch('/api/account/sessions/terminate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepCurrent }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to terminate sessions')
      }

      // If not keeping current, logout
      if (!keepCurrent) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        router.push('/login')
        return
      }

      await fetchSessions()
      setShowTerminateAllModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate sessions')
    } finally {
      setTerminatingAll(false)
    }
  }

  const getDeviceIcon = (userAgent: string) => {
    const { icon } = parseUserAgent(userAgent)
    switch (icon) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />
      case 'tablet':
        return <Tablet className="w-5 h-5" />
      default:
        return <Monitor className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Sessions</h1>
          <p className="text-gray-600 mt-2">Manage your active login sessions</p>
        </div>
        {sessions.length > 1 && (
          <Button variant="destructive" onClick={() => setShowTerminateAllModal(true)} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Terminate All Others
          </Button>
        )}
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {/* Session Count */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Monitor className="w-6 h-6 text-onprez-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              </div>
            </div>
            {sessions.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Session</p>
                <p className="text-sm font-medium text-onprez-blue flex items-center gap-2 justify-end">
                  <CheckCircle className="w-4 h-4" />
                  This device
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Sessions</h3>
            <p className="text-gray-600">You don&apos;t have any active sessions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const isCurrentSession = session.id === currentSessionId
            const deviceName = getDeviceDisplayName(session.userAgent)

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <Card
                  className={`${
                    isCurrentSession ? 'border-2 border-onprez-blue bg-blue-50/30' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Device Icon */}
                        <div
                          className={`p-3 rounded-lg ${
                            isCurrentSession ? 'bg-blue-100' : 'bg-gray-100'
                          }`}
                        >
                          {getDeviceIcon(session.userAgent)}
                        </div>

                        {/* Session Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{deviceName}</h3>
                            {isCurrentSession && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-onprez-blue bg-blue-100 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Current Session
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span>{session.ipAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>Last active {formatDate(session.updatedAt)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Created {formatDate(session.createdAt)} • Expires{' '}
                              {new Date(session.expiresAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Terminate Button */}
                      <Button
                        variant={isCurrentSession ? 'destructive' : 'ghost'}
                        size="sm"
                        onClick={() => handleTerminateSession(session.id)}
                        disabled={terminatingId === session.id}
                      >
                        {terminatingId === session.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isCurrentSession ? 'Sign Out' : 'Terminate'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Terminate All Modal */}
      <AnimatePresence>
        {showTerminateAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !terminatingAll && setShowTerminateAllModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Terminate Other Sessions?
                  </h2>
                  <p className="text-sm text-gray-600">
                    This will sign you out of all other devices. You&apos;ll remain signed in on
                    this device.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> If you notice any suspicious sessions, terminate them
                  immediately and change your password.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowTerminateAllModal(false)}
                  disabled={terminatingAll}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleTerminateAll(true)}
                  disabled={terminatingAll}
                  className="flex-1"
                >
                  {terminatingAll ? 'Terminating...' : 'Terminate Others'}
                </Button>
              </div>

              <button
                onClick={() => handleTerminateAll(false)}
                disabled={terminatingAll}
                className="w-full mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Terminate all sessions (including this one)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
