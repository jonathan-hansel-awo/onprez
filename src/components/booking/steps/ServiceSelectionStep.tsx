'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Clock, Star, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/types/service'
import Image from 'next/image'

export interface ServiceOption {
  id: string
  name: string
  description: string | null
  tagline: string | null
  price: number
  priceType: 'FIXED' | 'RANGE' | 'STARTING_AT' | 'FREE'
  priceRangeMin: number | null
  priceRangeMax: number | null
  currency: string
  duration: number
  bufferTime: number
  imageUrl: string | null
  featured: boolean
  requiresDeposit: boolean
  depositAmount: number | null
  category: {
    id: string
    name: string
    color: string | null
    icon: string | null
  } | null
}

export interface ServiceCategory {
  id: string
  name: string
  color: string | null
  icon: string | null
  serviceCount: number
}

interface ServiceSelectionStepProps {
  businessHandle: string
  selectedServiceId: string | null
  onSelect: (service: { id: string; name: string; price: number; duration: number }) => void
}

export function ServiceSelectionStep({
  businessHandle,
  selectedServiceId,
  onSelect,
}: ServiceSelectionStepProps) {
  const [services, setServices] = useState<ServiceOption[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [businessHandle])

  async function fetchServices() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/public/businesses/${businessHandle}/services`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch services')
      }

      setServices(data.data.services)
      setCategories(data.data.categories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    const matchesSearch =
      !searchQuery ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || service.category?.id === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group services by category for display
  const groupedServices = filteredServices.reduce(
    (acc, service) => {
      const categoryName = service.category?.name || 'Other Services'
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(service)
      return acc
    },
    {} as Record<string, ServiceOption[]>
  )

  // Featured services (show at top)
  const featuredServices = filteredServices.filter(s => s.featured)

  if (loading) {
    return <ServiceSelectionSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchServices} className="text-blue-600 hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No services available at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Select a Service</h3>
        <p className="text-sm text-gray-500 mt-1">Choose the service you&apos;d like to book</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
              style={
                selectedCategory === category.id && category.color
                  ? { backgroundColor: category.color }
                  : undefined
              }
            >
              {category.name} ({category.serviceCount})
            </button>
          ))}
        </div>
      )}

      {/* Services List */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 -mr-2">
        {/* Featured Services */}
        {featuredServices.length > 0 && !selectedCategory && !searchQuery && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500" />
              Popular
            </h4>
            {featuredServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServiceId === service.id}
                onSelect={onSelect}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Grouped Services */}
        {Object.entries(groupedServices).map(([categoryName, categoryServices]) => {
          // Skip if all services in this category are featured and shown above
          const nonFeaturedServices = categoryServices.filter(
            s => !s.featured || selectedCategory || searchQuery
          )
          if (nonFeaturedServices.length === 0) return null

          return (
            <div key={categoryName} className="space-y-3">
              {(categories.length > 0 || Object.keys(groupedServices).length > 1) && (
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {categoryName}
                </h4>
              )}
              {nonFeaturedServices.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedServiceId === service.id}
                  onSelect={onSelect}
                  index={index}
                />
              ))}
            </div>
          )
        })}

        {filteredServices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No services match your search.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory(null)
              }}
              className="text-blue-600 hover:underline mt-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ServiceCardProps {
  service: ServiceOption
  isSelected: boolean
  onSelect: (service: { id: string; name: string; price: number; duration: number }) => void
  index: number
}

function ServiceCard({ service, isSelected, onSelect, index }: ServiceCardProps) {
  const formattedPrice = formatPrice(
    service.price,
    service.priceType,
    service.priceRangeMin,
    service.priceRangeMax,
    service.currency
  )

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() =>
        onSelect({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
        })
      }
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-blue-300'
      )}
    >
      <div className="flex gap-4">
        {/* Service Image */}
        {service.imageUrl && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={service.imageUrl}
              alt={service.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Service Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Category Badge */}
              {service.category && (
                <span
                  className="inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-1"
                  style={{
                    backgroundColor: service.category.color
                      ? `${service.category.color}20`
                      : '#E5E7EB',
                    color: service.category.color || '#374151',
                  }}
                >
                  {service.category.name}
                </span>
              )}

              {/* Service Name */}
              <h4 className="font-semibold text-gray-900 truncate">
                {service.name}
                {service.featured && <Star className="inline-block w-4 h-4 text-amber-500 ml-1" />}
              </h4>

              {/* Tagline or Description */}
              <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                {service.tagline || service.description}
              </p>
            </div>

            {/* Price and Selection Indicator */}
            <div className="flex-shrink-0 text-right">
              <div className="font-bold text-gray-900">{formattedPrice}</div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{service.duration} min</span>
              </div>
            </div>
          </div>

          {/* Deposit Notice */}
          {service.requiresDeposit && service.depositAmount && (
            <p className="text-xs text-amber-600 mt-2">
              Requires £{service.depositAmount.toFixed(2)} deposit
            </p>
          )}
        </div>

        {/* Selection Arrow */}
        <div
          className={cn(
            'flex-shrink-0 self-center transition-colors',
            isSelected ? 'text-blue-500' : 'text-gray-300'
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </motion.button>
  )
}

function ServiceSelectionSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-60 bg-gray-100 rounded animate-pulse mt-2" />
      </div>

      {/* Search skeleton */}
      <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />

      {/* Category filter skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Service cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
