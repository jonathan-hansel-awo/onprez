'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/form/input'
import { TextArea } from '@/components/form/text-area'
import { ArrowLeft } from 'lucide-react'

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f97316', label: 'Orange' },
]

const ICON_OPTIONS = ['📁', '✂️', '💅', '💆', '🧘', '💪', '🎨', '📸', '🍽️', '🐾', '🏠', '📚']

export default function NewCategoryPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: '📁',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchBusiness()
  }, [])

  const fetchBusiness = async () => {
    try {
      const response = await fetch('/api/business/current')
      const data = await response.json()

      if (data.success) {
        setBusinessId(data.data.business.id)
      }
    } catch (error) {
      console.error('Error fetching business:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!businessId) {
      alert('Business not found')
      return
    }

    if (!formData.name.trim()) {
      setErrors({ name: 'Category name is required' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/service-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard/categories')
      } else {
        setErrors({ form: data.error || 'Failed to create category' })
      }
    } catch (error) {
      console.error('Error creating category:', error)
      setErrors({ form: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Category</h1>
          <p className="text-muted-foreground mt-1">Create a new service category</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Global Error */}
            {errors.form && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {errors.form}
              </div>
            )}

            {/* Name */}
            <Input
              label="Category Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />

            {/* Description */}
            <TextArea
              label="Description (Optional)"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this category"
              rows={3}
            />

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Category Color</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-12 h-12 rounded-lg transition-all hover:scale-110 ${
                      formData.color === color.value
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Category Icon</label>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                      formData.icon === icon
                        ? 'bg-primary/10 ring-2 ring-primary'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Preview</label>
              <div className="p-6 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.icon}
                  </div>
                  <div>
                    <div className="font-semibold">{formData.name || 'Category Name'}</div>
                    {formData.description && (
                      <div className="text-sm text-gray-600 mt-1">{formData.description}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </form>
    </div>
  )
}
