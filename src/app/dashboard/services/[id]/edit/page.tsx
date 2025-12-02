'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/form/input'
import { TextArea } from '@/components/form/text-area'
import { Select } from '@/components/form/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { ConfirmDialog } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, DollarSign, Clock, AlertCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const PRICE_TYPE_OPTIONS = [
  { value: 'FIXED', label: 'Fixed Price' },
  { value: 'RANGE', label: 'Price Range' },
  { value: 'STARTING_AT', label: 'Starting At' },
  { value: 'FREE', label: 'Free' },
]

interface ServiceFormData {
  name: string
  description: string
  tagline: string
  price: string
  priceType: string
  duration: string
  bufferTime: string
  categoryId: string
  imageUrl: string
  requiresApproval: boolean
  requiresDeposit: boolean
  depositAmount: string
  maxAdvanceBookingDays: string
  featured: boolean
  active: boolean
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    tagline: '',
    price: '',
    priceType: 'FIXED',
    duration: '60',
    bufferTime: '0',
    categoryId: '',
    imageUrl: '',
    requiresApproval: false,
    requiresDeposit: false,
    depositAmount: '',
    maxAdvanceBookingDays: '',
    featured: false,
    active: true,
  })

  useEffect(() => {
    fetchServiceData()
  }, [])

  async function fetchServiceData() {
    try {
      // Fetch service
      const serviceRes = await fetch(`/api/services/${resolvedParams.id}`)
      const serviceData = await serviceRes.json()

      if (!serviceData.success) {
        setErrors({ form: 'Service not found' })
        setLoading(false)
        return
      }

      const service = serviceData.data.service

      // Fetch categories
      const categoriesRes = await fetch(`/api/services/categories?businessId=${service.businessId}`)
      const categoriesData = await categoriesRes.json()

      if (categoriesData.success) {
        setCategories(categoriesData.data.categories || [])
      }

      // Populate form
      setFormData({
        name: service.name || '',
        description: service.description || '',
        tagline: service.tagline || '',
        price: service.price?.toString() || '',
        priceType: service.priceType || 'FIXED',
        duration: service.duration?.toString() || '60',
        bufferTime: service.bufferTime?.toString() || '0',
        categoryId: service.categoryId || '',
        imageUrl: service.imageUrl || '',
        requiresApproval: service.requiresApproval || false,
        requiresDeposit: service.requiresDeposit || false,
        depositAmount: service.depositAmount?.toString() || '',
        maxAdvanceBookingDays: service.maxAdvanceBookingDays?.toString() || '',
        featured: service.featured || false,
        active: service.active !== undefined ? service.active : true,
      })
    } catch (error) {
      console.error('Failed to fetch service:', error)
      setErrors({ form: 'Failed to load service' })
    } finally {
      setLoading(false)
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required'
    }

    if (!formData.price && formData.priceType !== 'FREE') {
      newErrors.price = 'Price is required'
    }

    if (parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a positive number'
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required'
    }

    if (parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be greater than 0'
    }

    if (formData.requiresDeposit && !formData.depositAmount) {
      newErrors.depositAmount = 'Deposit amount is required when deposit is enabled'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)

    try {
      const response = await fetch(`/api/services/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard/services')
      } else {
        setErrors({ form: data.error || 'Failed to update service' })
      }
    } catch (error) {
      console.error('Update service error:', error)
      setErrors({ form: 'An unexpected error occurred' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)

    try {
      const response = await fetch(`/api/services/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard/services')
      } else {
        setErrors({ form: data.error || 'Failed to delete service' })
        setShowDeleteDialog(false)
      }
    } catch (error) {
      console.error('Delete service error:', error)
      setErrors({ form: 'An unexpected error occurred' })
      setShowDeleteDialog(false)
    } finally {
      setDeleting(false)
    }
  }

  function handleChange(field: keyof ServiceFormData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const categoryOptions = [
    { value: '', label: 'No Category' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name })),
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-onprez-blue" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/services">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
            <p className="text-gray-600 mt-1">Update service details</p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={saving || deleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Error */}
        {errors.form && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{errors.form}</p>
          </motion.div>
        )}

        {/* Same form fields as create service */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Service Name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="e.g., Haircut & Style"
              required
            />

            <Input
              label="Tagline (Optional)"
              value={formData.tagline}
              onChange={e => handleChange('tagline', e.target.value)}
              placeholder="e.g., Professional cut and styling"
              maxLength={100}
            />

            <TextArea
              label="Description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Describe what's included in this service..."
              rows={4}
              maxLength={500}
              showCharCount
            />

            <Select
              label="Category"
              value={formData.categoryId}
              onChange={e => handleChange('categoryId', e.target.value)}
              options={categoryOptions}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Price Type"
              value={formData.priceType}
              onChange={e => handleChange('priceType', e.target.value)}
              options={PRICE_TYPE_OPTIONS}
              leftIcon={<DollarSign className="w-5 h-5" />}
            />

            {formData.priceType !== 'FREE' && (
              <Input
                label="Price (£)"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={e => handleChange('price', e.target.value)}
                error={errors.price}
                leftIcon={<DollarSign className="w-5 h-5" />}
                placeholder="50.00"
                required
              />
            )}

            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.requiresDeposit}
                  onChange={e => handleChange('requiresDeposit', e.target.checked)}
                  className="mt-1 w-4 h-4 text-onprez-blue border-gray-300 rounded focus:ring-onprez-blue"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Require Deposit</span>
                  <p className="text-sm text-gray-600">Customer must pay a deposit when booking</p>
                </div>
              </label>

              {formData.requiresDeposit && (
                <Input
                  label="Deposit Amount (£)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.depositAmount}
                  onChange={e => handleChange('depositAmount', e.target.value)}
                  error={errors.depositAmount}
                  leftIcon={<DollarSign className="w-5 h-5" />}
                  placeholder="20.00"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Duration & Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle>Duration & Scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Duration (minutes)"
              type="number"
              min="5"
              step="5"
              value={formData.duration}
              onChange={e => handleChange('duration', e.target.value)}
              error={errors.duration}
              leftIcon={<Clock className="w-5 h-5" />}
              placeholder="60"
              required
            />

            <Input
              label="Buffer Time (minutes)"
              type="number"
              min="0"
              step="5"
              value={formData.bufferTime}
              onChange={e => handleChange('bufferTime', e.target.value)}
              leftIcon={<Clock className="w-5 h-5" />}
              placeholder="0"
              helperText="Time blocked after this service for preparation"
            />

            <Input
              label="Max Advance Booking (days)"
              type="number"
              min="1"
              value={formData.maxAdvanceBookingDays}
              onChange={e => handleChange('maxAdvanceBookingDays', e.target.value)}
              placeholder="30"
              helperText="Leave empty to use business default"
            />

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={e => handleChange('requiresApproval', e.target.checked)}
                className="mt-1 w-4 h-4 text-onprez-blue border-gray-300 rounded focus:ring-onprez-blue"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Requires Approval</span>
                <p className="text-sm text-gray-600">
                  Bookings must be manually approved before confirmation
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Service Image */}
        <Card>
          <CardHeader>
            <CardTitle>Service Image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.imageUrl}
              onChange={url => handleChange('imageUrl', url)}
              onRemove={() => handleChange('imageUrl', '')}
              aspect="landscape"
              maxSize={4}
            />
          </CardContent>
        </Card>

        {/* Service Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Service Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={e => handleChange('featured', e.target.checked)}
                className="mt-1 w-4 h-4 text-onprez-blue border-gray-300 rounded focus:ring-onprez-blue"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Featured Service</span>
                <p className="text-sm text-gray-600">Display prominently on your presence page</p>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={e => handleChange('active', e.target.checked)}
                className="mt-1 w-4 h-4 text-onprez-blue border-gray-300 rounded focus:ring-onprez-blue"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Active</span>
                <p className="text-sm text-gray-600">Service is available for booking</p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/services">
            <Button type="button" variant="ghost" disabled={saving || deleting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" disabled={saving || deleting}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Service"
        description="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}
