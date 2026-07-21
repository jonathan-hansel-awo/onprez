'use client'

import { ServicesSection as ServicesSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { Clock, Calendar, CalendarCheck2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface ServicesSectionProps {
  section: ServicesSectionType
  businessHandle: string
}

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  priceType?: 'FIXED' | 'STARTING_AT' | 'RANGE' | 'FREE' | 'CONTACT'
  priceRangeMin?: number | null
  priceRangeMax?: number | null
  currency?: string
  category?: { name: string } | null
  imageUrl?: string | null
}

interface AvailabilitySummary {
  status: 'loading' | 'available' | 'unavailable'
  label: string
}

export function ServicesSection({ section, businessHandle }: ServicesSectionProps) {
  const { title, description, layout, showPrices, serviceIds } = section.data
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<Record<string, AvailabilitySummary>>({})

  const fetchServices = useCallback(
    async (signal: AbortSignal) => {
      try {
        const ids = serviceIds?.join(',') || ''
        const response = await fetch(
          `/api/public/businesses/${businessHandle}/services?ids=${ids}`,
          {
            signal,
          }
        )
        const data = await response.json()
        if (data.success) {
          const loadedServices = data.data.services as Service[]
          setServices(loadedServices)
          setAvailability(
            Object.fromEntries(
              loadedServices.map(service => [
                service.id,
                { status: 'loading', label: 'Checking live availability…' },
              ])
            )
          )

          const availabilityResults = await Promise.all(
            loadedServices.map(async service => {
              try {
                const availabilityResponse = await fetch(
                  `/api/availability/next?slug=${encodeURIComponent(businessHandle)}&serviceId=${encodeURIComponent(service.id)}&maxDays=30`,
                  { signal }
                )
                const availabilityData = await availabilityResponse.json()
                const nextAvailable = availabilityData?.data?.nextAvailable

                if (availabilityResponse.ok && availabilityData.success && nextAvailable) {
                  const date = new Date(`${nextAvailable.date}T00:00:00`)
                  const dateLabel = new Intl.DateTimeFormat('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  }).format(date)

                  return [
                    service.id,
                    {
                      status: 'available',
                      label: `Next available ${dateLabel} at ${nextAvailable.time}`,
                    },
                  ] as const
                }
              } catch (error) {
                if ((error as Error).name === 'AbortError') throw error
              }

              return [
                service.id,
                { status: 'unavailable', label: 'View calendar for availability' },
              ] as const
            })
          )

          setAvailability(Object.fromEntries(availabilityResults))
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to fetch services:', error)
        }
      } finally {
        setLoading(false)
      }
    },
    [businessHandle, serviceIds]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchServices(controller.signal)
    return () => controller.abort()
  }, [fetchServices])

  const isGrid = layout === 'grid'

  function formatPrice(service: Service) {
    if (service.priceType === 'FREE') return 'Free'
    if (service.priceType === 'CONTACT') return 'Contact for price'

    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: service.currency || 'GBP',
    })

    if (
      service.priceType === 'RANGE' &&
      service.priceRangeMin !== null &&
      service.priceRangeMin !== undefined &&
      service.priceRangeMax !== null &&
      service.priceRangeMax !== undefined
    ) {
      return `${formatter.format(service.priceRangeMin)}–${formatter.format(service.priceRangeMax)}`
    }

    const price = formatter.format(service.price)
    return service.priceType === 'STARTING_AT' ? `From ${price}` : price
  }

  // Generate Service Schema for SEO
  const servicesSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
        offers: {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: 'GBP',
        },
      },
    })),
  }

  return (
    <>
      {/* Services Schema Markup */}
      {services.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
        />
      )}
      <section className="theme-section-spacing py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 theme-heading"
              style={{ fontFamily: 'var(--theme-font-heading)' }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
            )}
          </motion.div>

          {/* Services Grid/List */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="theme-body-text" style={{ fontFamily: 'var(--theme-font-body)' }}>
                No services available at the moment.
              </p>
            </div>
          ) : (
            <div
              className={
                isGrid
                  ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'flex flex-col gap-6 max-w-3xl mx-auto'
              }
            >
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Service Image */}
                  {service.imageUrl && (
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      <Image
                        src={service.imageUrl}
                        alt={service.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Service Details */}
                  <div className="p-6">
                    {service.category && (
                      <span className="text-xs font-semibold text-onprez-blue uppercase tracking-wide">
                        {service.category.name}
                      </span>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3">{service.name}</h3>

                    <p
                      className="text-gray-600 text-sm mb-4 line-clamp-3 theme-body-text"
                      style={{ fontFamily: 'var(--theme-font-body)' }}
                    >
                      {service.description}
                    </p>

                    {/* Service Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} min</span>
                      </div>
                      {showPrices && (
                        <div className="font-semibold text-gray-900">{formatPrice(service)}</div>
                      )}
                    </div>

                    <div
                      className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                        availability[service.id]?.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      aria-live="polite"
                    >
                      <CalendarCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{availability[service.id]?.label || 'View live availability'}</span>
                    </div>

                    {/* Book Button */}
                    <Link
                      href={`/${businessHandle}/book/${service.id}`}
                      className="theme-button-primary flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
                    >
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      Book this service
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
