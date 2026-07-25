'use client'

import { useEffect, useState } from 'react'
import { Loader2, Package } from 'lucide-react'
import { ServicesSection } from '@/types/page-sections'
import { Input } from '@/components/form/input'
import { TextArea } from '@/components/form/text-area'
import { Select } from '@/components/form/select'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { Toggle } from '@/components/ui/toggle'
import { Checkbox } from '@/components/form/checkbox'
import { SectionAppearanceEditor } from '../SectionAppearanceEditor'

interface ServicesSectionEditorProps {
  section: ServicesSection
  onUpdate: (section: ServicesSection) => void
  businessId: string | null
}

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  active: boolean
}

function normalizeServices(payload: unknown): Service[] {
  if (!payload || typeof payload !== 'object') return []

  const responseData = (payload as { data?: unknown }).data
  const rawServices = Array.isArray(responseData)
    ? responseData
    : responseData && typeof responseData === 'object'
      ? (responseData as { services?: unknown }).services
      : undefined

  if (!Array.isArray(rawServices)) return []

  return rawServices.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const service = item as Record<string, unknown>
    const id = typeof service.id === 'string' ? service.id : ''
    const name = typeof service.name === 'string' ? service.name : ''

    if (!id || !name) return []

    return [
      {
        id,
        name,
        description: typeof service.description === 'string' ? service.description : null,
        price: Number(service.price) || 0,
        duration: Number(service.duration) || 0,
        active:
          typeof service.active === 'boolean'
            ? service.active
            : typeof service.isActive === 'boolean'
              ? service.isActive
              : true,
      },
    ]
  })
}

export function ServicesSectionEditor({
  section,
  onUpdate,
  businessId,
}: ServicesSectionEditorProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!businessId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchServices() {
      setLoading(true)
      setLoadError('')

      try {
        const response = await fetch(
          `/api/services?businessId=${encodeURIComponent(businessId!)}`
        )
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load services')
        }

        if (!cancelled) setServices(normalizeServices(data))
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch services:', error)
          setLoadError(error instanceof Error ? error.message : 'Failed to load services')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchServices()
    return () => {
      cancelled = true
    }
  }, [businessId])

  function updateData<K extends keyof ServicesSection['data']>(
    field: K,
    value: ServicesSection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: { ...section.data, [field]: value },
    })
  }

  function toggleService(serviceId: string) {
    const currentIds = section.data.serviceIds || []
    updateData(
      'serviceIds',
      currentIds.includes(serviceId)
        ? currentIds.filter(id => id !== serviceId)
        : [...currentIds, serviceId]
    )
  }

  const activeServices = services.filter(service => service.active)
  const selectedCount = section.data.serviceIds?.length || 0

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Services Composition</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="services-eyebrow">Eyebrow / Section Label</Label>
            <Input
              id="services-eyebrow"
              value={section.data.eyebrow || ''}
              onChange={event => updateData('eyebrow', event.target.value)}
              placeholder="e.g., Signature services"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="services-title">Section Title *</Label>
            <Input
              id="services-title"
              value={section.data.title}
              onChange={event => updateData('title', event.target.value)}
              placeholder="e.g., Services tailored to you"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="services-description">Description</Label>
            <TextArea
              id="services-description"
              value={section.data.description || ''}
              onChange={event => updateData('description', event.target.value)}
              placeholder="Set expectations and help clients choose."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Presentation</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="services-layout">Layout Preset</Label>
            <Select
              id="services-layout"
              value={section.data.layout || 'grid'}
              onChange={event =>
                updateData('layout', event.target.value as 'grid' | 'list' | 'editorial')
              }
              className="mt-1"
              options={[
                { value: 'grid', label: 'Grid — familiar cards' },
                { value: 'list', label: 'List — compact rows' },
                { value: 'editorial', label: 'Editorial — premium numbered menu' },
              ]}
            />
          </div>
          {section.data.layout === 'grid' && (
            <div>
              <Label htmlFor="services-columns">Desktop Columns</Label>
              <Select
                id="services-columns"
                value={(section.data.columns || 3).toString()}
                onChange={event => updateData('columns', Number(event.target.value) as 2 | 3)}
                className="mt-1"
                options={[
                  { value: '2', label: '2 columns — larger cards' },
                  { value: '3', label: '3 columns — more compact' },
                ]}
              />
            </div>
          )}
          {section.data.layout !== 'editorial' && (
            <div>
              <Label htmlFor="services-card-style">Card Style</Label>
              <Select
                id="services-card-style"
                value={section.data.cardStyle || 'elevated'}
                onChange={event =>
                  updateData('cardStyle', event.target.value as 'elevated' | 'outlined' | 'minimal')
                }
                className="mt-1"
                options={[
                  { value: 'elevated', label: 'Elevated' },
                  { value: 'outlined', label: 'Outlined' },
                  { value: 'minimal', label: 'Minimal' },
                ]}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Show Service Images</Label>
              <p className="text-sm text-gray-500">Hide images for a cleaner editorial menu.</p>
            </div>
            <Toggle
              checked={section.data.showImages ?? true}
              onChange={checked => updateData('showImages', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Show Prices</Label>
              <p className="text-sm text-gray-500">
                Transparent pricing improves booking confidence.
              </p>
            </div>
            <Toggle
              checked={section.data.showPrices ?? true}
              onChange={checked => updateData('showPrices', checked)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Services to Display</h3>
          <span className="text-sm text-gray-600">
            {selectedCount} of {activeServices.length} selected
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {loadError}
          </div>
        ) : activeServices.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-8 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-gray-600">No active services created yet</p>
            <p className="text-sm text-gray-500">
              Create or activate services first, then choose which ones belong in this section.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
              <button
                type="button"
                onClick={() =>
                  updateData(
                    'serviceIds',
                    activeServices.map(service => service.id)
                  )
                }
                className="text-sm text-onprez-blue hover:underline"
              >
                Select all
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => updateData('serviceIds', [])}
                className="text-sm text-gray-600 hover:underline"
              >
                Show all automatically
              </button>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {activeServices.map(service => {
                const isSelected = section.data.serviceIds?.includes(service.id) || false
                return (
                  <label
                    key={service.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${
                      isSelected
                        ? 'border-2 border-onprez-blue bg-onprez-blue/10'
                        : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleService(service.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
                          £{service.price.toFixed(2)}
                        </span>
                      </div>
                      {service.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                          {service.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">{service.duration} min</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      <SectionAppearanceEditor
        appearance={section.appearance}
        onChange={appearance => onUpdate({ ...section, appearance })}
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          Services remain connected to your Services dashboard, so prices, durations and
          availability stay accurate everywhere.
        </p>
      </div>
    </div>
  )
}
