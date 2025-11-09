'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, FormError, Select } from '@/components/form'
import { UserPlus, Loader2, Mail, X, Clock, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  expiresAt: string
  invitedByUser: { email: string }
}

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invitations, setInvitations] = useState<Invitation[]>([])

  const [formData, setFormData] = useState({
    email: '',
    role: 'STAFF',
  })

  useEffect(() => {
    fetchInvitations()
  }, [])

  async function fetchInvitations() {
    try {
      const response = await fetch('/api/team/invitations')
      const data = await response.json()

      if (data.success) {
        setInvitations(data.data.invitations)
      }
    } catch (err) {
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Invitation sent successfully!')
        setFormData({ email: '', role: 'STAFF' })
        fetchInvitations()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to send invitation')
      }
    } catch (err) {
      setError('Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  async function handleCancel(id: string) {
    try {
      const response = await fetch(`/api/team/invitations/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchInvitations()
      } else {
        setError(data.error || 'Failed to cancel invitation')
      }
    } catch (err) {
      setError('Failed to cancel invitation')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-onprez-blue" />
      </div>
    )
  }

  const roleOptions = [
    { value: 'STAFF', label: 'Staff (View & Edit)' },
    { value: 'ADMIN', label: 'Admin (Full Access)' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-2">Invite team members to help manage your business</p>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
          ✓ {success}
        </div>
      )}

      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="colleague@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <Select
              label="Role"
              value={formData.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, role: e.target.value })
              }
              options={roleOptions}
            />

            <Button type="submit" variant="primary" disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {invitations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending invitations</p>
            ) : (
              <div className="space-y-3">
                {invitations.map(invitation => (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{invitation.email}</span>
                        <Badge
                          variant={invitation.status === 'ACCEPTED' ? 'success' : 'default'}
                          size="sm"
                        >
                          {invitation.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {invitation.status === 'ACCEPTED' ? (
                          <>
                            <Check className="w-4 h-4 inline mr-1" />
                            Accepted
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 inline mr-1" />
                            Sent by {invitation.invitedByUser.email}
                          </>
                        )}
                      </p>
                    </div>

                    {invitation.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(invitation.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel invitation"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
