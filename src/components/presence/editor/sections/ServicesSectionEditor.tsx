'use client'

import { ServicesSection } from '@/types/page-sections'
import { Input } from '@/components/form/input'
import { TextArea } from '@/components/form/text-area'
import { Select } from '@/components/form/select'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { Toggle } from '@/components/ui/toggle'
import { Checkbox } from '@/components/form/checkbox'
import { useState, useEffect } from 'react'
import { Package, Loader2 } from 'lucide-react'

interface ServicesSectionEditorProps {
  section: ServicesSection
  onUpdate: (section: ServicesSection) => void
  businessId: string | null
}

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category?: string
  isActive: boolean
}

export function ServicesSectionEditor({
  section,
  onUpdate,
  businessId,
}: ServicesSectionEditorProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (businessId) {
      fetchServices()
    }
  }, [businessId])

  async function fetchServices() {
    try {
      const response = await fetch(`/api/services?businessId=${businessId}`)
      const data = await response.json()

      if (data.success) {
        setServices(data.data.services || [])
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateData<K extends keyof ServicesSection['data']>(
    field: K,
    value: ServicesSection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  function toggleService(serviceId: string) {
    const currentIds = section.data.serviceIds || []
    const newIds = currentIds.includes(serviceId)
      ? currentIds.filter(id => id !== serviceId)
      : [...currentIds, serviceId]

    updateData('serviceIds', newIds)
  }

  function selectAllServices() {
    const activeServiceIds = services.filter(s => s.isActive).map(s => s.id)
    updateData('serviceIds', activeServiceIds)
  }

  function deselectAllServices() {
    updateData('serviceIds', [])
  }

  const selectedCount = section.data.serviceIds?.length || 0
  const activeServices = services.filter(s => s.isActive)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Settings</h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="services-title">Section Title *</Label>
            <Input
              id="services-title"
              value={section.data.title}
              onChange={e => updateData('title', e.target.value)}
              placeholder="e.g., Our Services, What We Offer"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="services-description">Description</Label>
            <TextArea
              id="services-description"
              value={section.data.description || ''}
              onChange={e => updateData('description', e.target.value)}
              placeholder="Brief description of your services (optional)"
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Display Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>

        <div className="space-y-4">
          {/* Layout */}
          <div>
            <Label htmlFor="services-layout">Layout Style</Label>
            <Select
              id="services-layout"
              value={section.data.layout || 'grid'}
              onChange={e => updateData('layout', e.target.value as 'grid' | 'list')}
              className="mt-1"
              options={[
                { value: 'grid', label: 'Grid (Cards)' },
                { value: 'list', label: 'List (Rows)' },
              ]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Grid shows services as cards, List shows them as rows
            </p>
          </div>

          {/* Show Prices Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Prices</Label>
              <p className="text-sm text-gray-500">Display service prices to visitors</p>
            </div>
            <Toggle
              checked={section.data.showPrices ?? true}
              onChange={checked => updateData('showPrices', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Service Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Services to Display</h3>
          <div className="text-sm text-gray-600">
            {selectedCount} of {activeServices.length} selected
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : activeServices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No services created yet</p>
            <p className="text-sm text-gray-500">
              Create services first to display them on your presence page
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All / Deselect All */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
              <button
                type="button"
                onClick={selectAllServices}
                className="text-sm text-onprez-blue hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={deselectAllServices}
                className="text-sm text-gray-600 hover:underline"
              >
                Deselect All
              </button>
            </div>

            {/* Service List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activeServices.map(service => {
                const isSelected = section.data.serviceIds?.includes(service.id) || false

                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${isSelected ? 'bg-onprez-blue/10 border-2 border-onprez-blue' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'}
                    `}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleService(service.id)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          £{service.price.toFixed(2)}
                        </span>
                      </div>

                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {service.category && (
                          <span className="bg-gray-200 px-2 py-0.5 rounded">
                            {service.category}
                          </span>
                        )}
                        <span>{service.duration} min</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Services are automatically fetched from your Services page. Any
          changes you make to your services will be reflected here.
        </p>
      </div>

      {/* Display All Services Option */}
      {activeServices.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Display All Services</p>
              <p className="text-xs text-gray-600 mt-1">
                Leave no services selected to automatically display all active services
              </p>
            </div>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={deselectAllServices}
                className="text-sm text-onprez-blue hover:underline whitespace-nowrap"
              >
                Show All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
