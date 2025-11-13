'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/form'
import { Loader2, CheckCircle, Building, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

export default function InvitationAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invitation, setInvitation] = useState<{
    businessName: string
    role: string
    email: string
  } | null>(null)

  useEffect(() => {
    fetchInvitation()
  }, [])

  async function fetchInvitation() {
    try {
      const response = await fetch(`/api/team/invitations/accept/${resolvedParams.token}`)
      const data = await response.json()

      if (data.success) {
        setInvitation(data.data)
      } else {
        setError(data.error || 'Invalid invitation')
      }
    } catch (err) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!user) {
      router.push(`/login?redirect=/invite/${resolvedParams.token}`)
      return
    }

    setAccepting(true)
    setError('')

    try {
      const response = await fetch(`/api/team/invitations/accept/${resolvedParams.token}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(data.error || 'Failed to accept invitation')
      }
    } catch (err) {
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-onprez-blue" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-onprez-blue via-onprez-purple to-onprez-blue p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-onprez-blue to-onprez-purple flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Team Invitation</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && <FormError errors={error} />}

            {success ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8 space-y-4"
              >
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Welcome aboard!</h3>
                  <p className="text-gray-600 mt-2">Redirecting to dashboard...</p>
                </div>
              </motion.div>
            ) : invitation ? (
              <>
                <div className="text-center space-y-4">
                  <Building className="w-12 h-12 text-onprez-blue mx-auto" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      You&apos;ve been invited to join
                    </h3>
                    <p className="text-2xl font-bold text-onprez-blue mt-2">
                      {invitation.businessName}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{invitation.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium">{invitation.role}</span>
                    </div>
                  </div>
                </div>

                {!user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    Please sign in with <strong>{invitation.email}</strong> to accept this
                    invitation.
                  </div>
                )}

                <div className="space-y-3">
                  {user ? (
                    user.email === invitation.email ? (
                      <Button
                        variant="primary"
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full"
                      >
                        {accepting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          'Accept Invitation'
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-center text-red-600">
                          You&apos;re signed in as <strong>{user.email}</strong>, but this
                          invitation is for <strong>{invitation.email}</strong>.
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => router.push('/logout')}
                          className="w-full"
                        >
                          Sign Out & Use Correct Account
                        </Button>
                      </div>
                    )
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        onClick={() =>
                          router.push(`/login?redirect=/invite/${resolvedParams.token}`)
                        }
                        className="w-full"
                      >
                        Sign In to Accept
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => router.push('/signup')}
                        className="w-full"
                      >
                        Create Account
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
