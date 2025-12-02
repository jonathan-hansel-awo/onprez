/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, Badge } from '@/components/ui'
import { Input } from '@/components/form/input'
import { TextArea } from '@/components/form/text-area'
import { Select } from '@/components/form/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
  Package,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { id } from 'zod/v4/locales'

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
  useBusinessHours: boolean
  availableDays: number[]
  customAvailability: any
}

interface Variant {
  id: string
  name: string
  description: string | null
  priceAdjustment: number
  durationAdjustment: number
  type: 'OPTION' | 'ADDON'
  isDefault: boolean
  active: boolean
  order: number
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
  const [variants, setVariants] = useState<Variant[]>([])
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [useBusinessHours, setUseBusinessHours] = useState(true)
  const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [customAvailability, setCustomAvailability] = useState<any>(null)
  const [variantFormData, setVariantFormData] = useState({
    name: '',
    description: '',
    priceAdjustment: '0',
    durationAdjustment: '0',
    type: 'OPTION' as 'OPTION' | 'ADDON',
    isDefault: false,
  })
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
    useBusinessHours,
    availableDays,
    customAvailability,
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
      setUseBusinessHours(service.useBusinessHours ?? true)
      setAvailableDays(service.availableDays || [0, 1, 2, 3, 4, 5, 6])
      setCustomAvailability(service.customAvailability)

      const variantsRes = await fetch(`/api/services/${resolvedParams.id}/variants`)
      const variantsData = await variantsRes.json()
      if (variantsData.success) {
        setVariants(variantsData.data.variants)
      }
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
        useBusinessHours: service.useBusinessHours ?? true,
        availableDays: service.availableDays || [0, 1, 2, 3, 4, 5, 6],
        customAvailability: service.customAvailability || null,
      })
    } catch (error) {
      console.error('Failed to fetch service:', error)
      setErrors({ form: 'Failed to load service' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddVariant = async () => {
    try {
      const response = await fetch(`/api/services/${id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantFormData),
      })

      const data = await response.json()

      if (data.success) {
        setVariants([...variants, data.data.variant])
        setShowVariantForm(false)
        setVariantFormData({
          name: '',
          description: '',
          priceAdjustment: '0',
          durationAdjustment: '0',
          type: 'OPTION',
          isDefault: false,
        })
      } else {
        alert(data.error || 'Failed to create variant')
      }
    } catch (error) {
      console.error('Error creating variant:', error)
      alert('Failed to create variant')
    }
  }

  const handleUpdateVariant = async () => {
    if (!editingVariant) return

    try {
      const response = await fetch(`/api/services/${id}/variants/${editingVariant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantFormData),
      })

      const data = await response.json()

      if (data.success) {
        setVariants(variants.map(v => (v.id === editingVariant.id ? data.data.variant : v)))
        setEditingVariant(null)
        setShowVariantForm(false)
        setVariantFormData({
          name: '',
          description: '',
          priceAdjustment: '0',
          durationAdjustment: '0',
          type: 'OPTION',
          isDefault: false,
        })
      } else {
        alert(data.error || 'Failed to update variant')
      }
    } catch (error) {
      console.error('Error updating variant:', error)
      alert('Failed to update variant')
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const response = await fetch(`/api/services/${id}/variants/${variantId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setVariants(variants.filter(v => v.id !== variantId))
      } else {
        alert(data.error || 'Failed to delete variant')
      }
    } catch (error) {
      console.error('Error deleting variant:', error)
      alert('Failed to delete variant')
    }
  }

  const openEditVariant = (variant: Variant) => {
    setEditingVariant(variant)
    setVariantFormData({
      name: variant.name,
      description: variant.description || '',
      priceAdjustment: variant.priceAdjustment.toString(),
      durationAdjustment: variant.durationAdjustment.toString(),
      type: variant.type,
      isDefault: variant.isDefault,
    })
    setShowVariantForm(true)
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

      {/* Service Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Variants & Add-ons</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Offer different options or add-ons for this service
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingVariant(null)
                setVariantFormData({
                  name: '',
                  description: '',
                  priceAdjustment: '0',
                  durationAdjustment: '0',
                  type: 'OPTION',
                  isDefault: false,
                })
                setShowVariantForm(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No variants added yet</p>
              <p className="text-sm mt-1">
                Add options like "Short Hair" or add-ons like "Deep Conditioning"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map(variant => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variant.name}</span>
                      <Badge variant={variant.type === 'OPTION' ? 'default' : 'purple'}>
                        {variant.type === 'OPTION' ? 'Option' : 'Add-on'}
                      </Badge>
                      {variant.isDefault && <Badge variant="success">Default</Badge>}
                    </div>
                    {variant.description && (
                      <p className="text-sm text-muted-foreground mt-1">{variant.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {variant.priceAdjustment !== 0 && (
                        <span className="text-muted-foreground">
                          Price: {variant.priceAdjustment > 0 ? '+' : ''}£
                          {variant.priceAdjustment.toFixed(2)}
                        </span>
                      )}
                      {variant.durationAdjustment !== 0 && (
                        <span className="text-muted-foreground">
                          Duration: {variant.durationAdjustment > 0 ? '+' : ''}
                          {variant.durationAdjustment} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditVariant(variant)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVariant(variant.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6">Availability Settings</h2>

          <div className="space-y-6">
            {/* Use Business Hours Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <label className="font-medium">Use Business Hours</label>
                <p className="text-sm text-muted-foreground">
                  Follow the general business hours for this service
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBusinessHours}
                  onChange={e => setUseBusinessHours(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {!useBusinessHours && (
              <>
                {/* Available Days */}
                <div>
                  <label className="block text-sm font-medium mb-3">Available Days</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (availableDays.includes(index)) {
                            setAvailableDays(availableDays.filter(d => d !== index))
                          } else {
                            setAvailableDays([...availableDays, index].sort())
                          }
                        }}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          availableDays.includes(index)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Select the days this service is available
                  </p>
                </div>

                {/* Custom Time Slots Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Custom time slots</strong> can be configured for each day. For now, the
                    service will use business hours on selected days only.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Variant Form Dialog */}
      <Dialog
        open={showVariantForm}
        onOpenChange={setShowVariantForm}
        title={editingVariant ? 'Edit Variant' : 'Add Variant'}
        description="Configure a variant or add-on for this service"
      >
        <div className="space-y-4">
          {/* Variant Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={variantFormData.type === 'OPTION' ? 'primary' : 'outline'}
                onClick={() => setVariantFormData({ ...variantFormData, type: 'OPTION' })}
                className="flex-1"
              >
                Option
              </Button>
              <Button
                type="button"
                variant={variantFormData.type === 'ADDON' ? 'primary' : 'outline'}
                onClick={() => setVariantFormData({ ...variantFormData, type: 'ADDON' })}
                className="flex-1"
              >
                Add-on
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {variantFormData.type === 'OPTION'
                ? 'Options: Customer must choose one (e.g., Short/Long hair)'
                : 'Add-ons: Optional extras customer can add (e.g., Deep conditioning)'}
            </p>
          </div>

          {/* Name */}
          <Input
            label="Name"
            value={variantFormData.name}
            onChange={e => setVariantFormData({ ...variantFormData, name: e.target.value })}
            placeholder="e.g., Long Hair, Express Service"
            required
          />

          {/* Description */}
          <TextArea
            label="Description (Optional)"
            value={variantFormData.description}
            onChange={e => setVariantFormData({ ...variantFormData, description: e.target.value })}
            placeholder="Additional details"
            rows={2}
          />

          {/* Price Adjustment */}
          <Input
            label="Price Adjustment"
            type="number"
            step="0.01"
            value={variantFormData.priceAdjustment}
            onChange={e =>
              setVariantFormData({ ...variantFormData, priceAdjustment: e.target.value })
            }
            placeholder="0.00"
            leftIcon={<span className="text-muted-foreground">£</span>}
          />
          <p className="text-xs text-muted-foreground -mt-2">
            Use positive for extra charge, negative for discount
          </p>

          {/* Duration Adjustment */}
          <Input
            label="Duration Adjustment (minutes)"
            type="number"
            value={variantFormData.durationAdjustment}
            onChange={e =>
              setVariantFormData({ ...variantFormData, durationAdjustment: e.target.value })
            }
            placeholder="0"
          />

          {/* Is Default */}
          {variantFormData.type === 'OPTION' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={variantFormData.isDefault}
                onChange={e =>
                  setVariantFormData({ ...variantFormData, isDefault: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="isDefault" className="text-sm">
                Set as default option
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowVariantForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={editingVariant ? handleUpdateVariant : handleAddVariant}
              className="flex-1"
            >
              {editingVariant ? 'Update' : 'Add'} Variant
            </Button>
          </div>
        </div>
      </Dialog>

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
