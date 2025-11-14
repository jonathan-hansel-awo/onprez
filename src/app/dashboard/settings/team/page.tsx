'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormError, Input, Select } from '@/components/form'
import {
  UserPlus,
  Loader2,
  Mail,
  X,
  Clock,
  Check,
  Users,
  Crown,
  Shield,
  Trash2,
  Edit2,
} from 'lucide-react'
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

interface TeamMember {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: {
    email: string
    createdAt: string
  }
}

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<string>('')

  const [formData, setFormData] = useState({
    email: '',
    role: 'STAFF',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [invitationsRes, membersRes] = await Promise.all([
        fetch('/api/team/invitations'),
        fetch('/api/team/members'),
      ])

      const invitationsData = await invitationsRes.json()
      const membersData = await membersRes.json()

      if (invitationsData.success) {
        setInvitations(invitationsData.data.invitations)
      }

      if (membersData.success) {
        setMembers(membersData.data.members)
      }
    } catch (err) {
      setError('Failed to load team data')
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
        fetchData()
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

  async function handleCancelInvitation(id: string) {
    try {
      const response = await fetch(`/api/team/invitations/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchData()
      } else {
        setError(data.error || 'Failed to cancel invitation')
      }
    } catch (err) {
      setError('Failed to cancel invitation')
    }
  }

  async function handleUpdateRole(memberId: string) {
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Role updated successfully!')
        setEditingMember(null)
        fetchData()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update role')
      }
    } catch (err) {
      setError('Failed to update role')
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Team member removed successfully!')
        fetchData()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to remove member')
      }
    } catch (err) {
      setError('Failed to remove member')
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4" />
      case 'ADMIN':
        return <Shield className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case 'OWNER':
        return 'default' as const
      case 'ADMIN':
        return 'purple' as const
      default:
        return 'success' as const
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
        <p className="text-gray-600 mt-2">Manage your team members and invitations</p>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
          ✓ {success}
        </div>
      )}

      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map(member => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{member.user.email}</span>
                    <Badge variant={getRoleBadgeVariant(member.role)} size="sm">
                      {getRoleIcon(member.role)}
                      <span className="ml-1">{member.role}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>

                {member.role !== 'OWNER' && (
                  <div className="flex items-center gap-2">
                    {editingMember === member.id ? (
                      <>
                        <Select
                          value={newRole}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setNewRole(e.target.value)
                          }
                          options={roleOptions}
                          className="w-40"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateRole(member.id)}
                        >
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingMember(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingMember(member.id)
                            setNewRole(member.role)
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Edit role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {/* Pending Invitations */}
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
                        onClick={() => handleCancelInvitation(invitation.id)}
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
