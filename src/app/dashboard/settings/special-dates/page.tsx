'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Checkbox, FormError } from '@/components/form'
import { TimePicker } from '@/components/ui/time-picker'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  X,
  CalendarDays,
  Repeat,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpecialDate {
  id: string
  date: string
  name: string
  isClosed: boolean
  openTime: string | null
  closeTime: string | null
  notes: string | null
  isRecurring: boolean
}

interface SpecialDateFormData {
  date: string
  name: string
  isClosed: boolean
  openTime: string
  closeTime: string
  notes: string
  isRecurring: boolean
}

const UK_BANK_HOLIDAYS = [
  { name: "New Year's Day", month: 1, day: 1 },
  { name: 'Good Friday', month: 0, day: 0, dynamic: true },
  { name: 'Easter Monday', month: 0, day: 0, dynamic: true },
  { name: 'Early May Bank Holiday', month: 5, day: 1, weekday: 1 },
  { name: 'Spring Bank Holiday', month: 5, day: -1, lastMonday: true },
  { name: 'Summer Bank Holiday', month: 8, day: -1, lastMonday: true },
  { name: 'Christmas Day', month: 12, day: 25 },
  { name: 'Boxing Day', month: 12, day: 26 },
]

const INITIAL_FORM_DATA: SpecialDateFormData = {
  date: '',
  name: '',
  isClosed: true,
  openTime: '09:00',
  closeTime: '17:00',
  notes: '',
  isRecurring: false,
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isUpcoming(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

function isPast(dateString: string): boolean {
  return !isUpcoming(dateString)
}

export default function SpecialDatesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<SpecialDateFormData>(INITIAL_FORM_DATA)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    fetchSpecialDates()
  }, [])

  async function fetchSpecialDates() {
    try {
      const response = await fetch('/api/business/special-dates')
      const data = await response.json()

      if (data.success) {
        setSpecialDates(data.data.specialDates)
      } else {
        setError('Failed to load special dates')
      }
    } catch (err) {
      setError('Failed to load special dates')
    } finally {
      setLoading(false)
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (!formData.date) {
      errors.date = 'Date is required'
    }

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.isClosed) {
      if (!formData.openTime) {
        errors.openTime = 'Opening time is required'
      }
      if (!formData.closeTime) {
        errors.closeTime = 'Closing time is required'
      }
      if (formData.openTime && formData.closeTime) {
        const [openH, openM] = formData.openTime.split(':').map(Number)
        const [closeH, closeM] = formData.closeTime.split(':').map(Number)
        if (closeH * 60 + closeM <= openH * 60 + openM) {
          errors.closeTime = 'Closing time must be after opening time'
        }
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const url = editingId
        ? `/api/business/special-dates/${editingId}`
        : '/api/business/special-dates'

      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          openTime: formData.isClosed ? null : formData.openTime,
          closeTime: formData.isClosed ? null : formData.closeTime,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingId ? 'Special date updated!' : 'Special date added!')
        setTimeout(() => setSuccess(''), 3000)
        resetForm()
        fetchSpecialDates()
      } else {
        setError(data.error || 'Failed to save special date')
      }
    } catch (err) {
      setError('Failed to save special date')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this special date?')) return

    setDeleting(id)
    setError('')

    try {
      const response = await fetch(`/api/business/special-dates/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Special date deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchSpecialDates()
      } else {
        setError(data.error || 'Failed to delete special date')
      }
    } catch (err) {
      setError('Failed to delete special date')
    } finally {
      setDeleting(null)
    }
  }

  function handleEdit(specialDate: SpecialDate) {
    setEditingId(specialDate.id)
    setFormData({
      date: specialDate.date.split('T')[0],
      name: specialDate.name,
      isClosed: specialDate.isClosed,
      openTime: specialDate.openTime || '09:00',
      closeTime: specialDate.closeTime || '17:00',
      notes: specialDate.notes || '',
      isRecurring: specialDate.isRecurring,
    })
    setShowForm(true)
    setFormErrors({})
  }

  function resetForm() {
    setFormData(INITIAL_FORM_DATA)
    setEditingId(null)
    setShowForm(false)
    setFormErrors({})
  }

  function addQuickHoliday(name: string) {
    const today = new Date()
    const year = today.getFullYear()
    let date = ''

    // Find the holiday and calculate date
    const holiday = UK_BANK_HOLIDAYS.find(h => h.name === name)
    if (holiday && holiday.month && holiday.day) {
      const monthStr = String(holiday.month).padStart(2, '0')
      const dayStr = String(holiday.day).padStart(2, '0')
      date = `${year}-${monthStr}-${dayStr}`
    } else {
      // For dynamic holidays, just set current year's date as placeholder
      date = `${year}-01-01`
    }

    setFormData({
      ...INITIAL_FORM_DATA,
      date,
      name,
      isClosed: true,
      isRecurring: true,
    })
    setShowForm(true)
    setEditingId(null)
    setFormErrors({})
  }

  const filteredDates = specialDates.filter(sd => {
    if (filter === 'upcoming') return isUpcoming(sd.date)
    if (filter === 'past') return isPast(sd.date)
    return true
  })

  const upcomingCount = specialDates.filter(sd => isUpcoming(sd.date)).length
  const pastCount = specialDates.filter(sd => isPast(sd.date)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-onprez-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Special Dates</h1>
          <p className="text-gray-600 mt-2">
            Manage holidays, closures, and special hours
          </p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Special Date
          </Button>
        )}
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
          ✓ {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Edit Special Date' : 'Add Special Date'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quick Add UK Bank Holidays */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Add UK Bank Holiday
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {UK_BANK_HOLIDAYS.filter(h => !h.dynamic).map(holiday => (
                      <Button
                        key={holiday.name}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => addQuickHoliday(holiday.name)}
                      >
                        {holiday.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  error={formErrors.date}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  label="Name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  error={formErrors.name}
                  placeholder="e.g., Christmas Day, Staff Training"
                />
              </div>

              <div className="flex items-center gap-6">
                <Checkbox
                  checked={formData.isClosed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, isClosed: e.target.checked }))
                  }
                  label="Closed all day"
                />
                <Checkbox
                  checked={formData.isRecurring}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))
                  }
                  label="Repeats yearly"
                />
              </div>

              {!formData.isClosed && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <TimePicker
                    label="Special Opening Time"
                    value={formData.openTime}
                    onChange={time => setFormData(prev => ({ ...prev, openTime: time }))}
                    error={formErrors.openTime}
                  />
                  <TimePicker
                    label="Special Closing Time"
                    value={formData.closeTime}
                    onChange={time => setFormData(prev => ({ ...prev, closeTime: time }))}
                    error={formErrors.closeTime}
                  />
                </div>
              )}

              <Input
                label="Notes (optional)"
                type="text"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Emergency contact: 07123456789"
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? 'Update' : 'Add'} Special Date
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'upcoming' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('upcoming')}
        >
          Upcoming ({upcomingCount})
        </Button>
        <Button
          variant={filter === 'past' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('past')}
        >
          Past ({pastCount})
        </Button>
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({specialDates.length})
        </Button>
      </div>

      {/* Special Dates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {filter === 'upcoming' ? 'Upcoming' : filter === 'past' ? 'Past' : 'All'} Special Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDates.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {filter === 'upcoming'
                  ? 'No upcoming special dates'
                  : filter === 'past'
                    ? 'No past special dates'
                    : 'No special dates added yet'}
              </p>
              {!showForm && (
                <Button variant="secondary" className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add your first special date
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDates.map(specialDate => (
                <div
                  key={specialDate.id}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-colors',
                    isPast(specialDate.date)
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : specialDate.isClosed
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{specialDate.name}</span>
                        {specialDate.isRecurring && (
                          <Badge variant="secondary" size="sm">
                            <Repeat className="w-3 h-3 mr-1" />
                            Yearly
                          </Badge>
                        )}
                        {specialDate.isClosed ? (
                          <Badge variant="destructive" size="sm">
                            Closed
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Special Hours
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(specialDate.date)}</p>
                      {!specialDate.isClosed && specialDate.openTime && specialDate.closeTime && (
                        <p className="text-sm text-blue-700 mt-1">
                          Open: {specialDate.openTime} - {specialDate.closeTime}
                        </p>
                      )}
                      {specialDate.notes && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {specialDate.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(specialDate)}
                        disabled={deleting === specialDate.id}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(specialDate.id)}
                        disabled={deleting === specialDate.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting === specialDate.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
      }
