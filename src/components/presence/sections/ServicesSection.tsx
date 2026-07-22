'use client'

import { ServicesSection as ServicesSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { Clock, Calendar, CalendarCheck2, ArrowUpRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

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

const cardStyleClasses = {
  elevated: 'overflow-hidden rounded-xl bg-white shadow-lg transition-shadow hover:shadow-xl',
  outlined: 'overflow-hidden rounded-xl border border-black/10 bg-transparent',
  minimal: 'overflow-hidden border-b border-black/10 bg-transparent',
}

export function ServicesSection({ section, businessHandle }: ServicesSectionProps) {
  const {
    title,
    description,
    eyebrow,
    layout = 'grid',
    columns = 3,
    cardStyle = 'elevated',
    showImages = true,
    showPrices = true,
    serviceIds,
  } = section.data

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<Record<string, AvailabilitySummary>>({})
  const accentColor = getAccentColor(section.appearance)

  const fetchServices = useCallback(
    async (signal: AbortSignal) => {
      try {
        const ids = serviceIds?.join(',') || ''
        const response = await fetch(
          `/api/public/businesses/${businessHandle}/services?ids=${ids}`,
          { signal }
        )
        const data = await response.json()

        if (!data.success) return

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
          priceCurrency: service.currency || 'GBP',
        },
      },
    })),
  }

  const heading = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        'mb-12',
        layout === 'editorial'
          ? 'grid gap-5 text-left md:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)] md:items-end'
          : 'text-center'
      )}
    >
      <div>
        {eyebrow && (
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: accentColor }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            'font-bold leading-[1.02] tracking-[-0.025em] theme-heading',
            layout === 'editorial' ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-3xl md:text-4xl'
          )}
          style={{ fontFamily: 'var(--theme-font-heading)', color: 'inherit' }}
        >
          {title}
        </h2>
      </div>
      {description && (
        <p
          className={cn(
            'text-lg leading-relaxed opacity-70',
            layout !== 'editorial' && 'mx-auto mt-4 max-w-2xl'
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  )

  function availabilityBadge(service: Service) {
    const summary = availability[service.id]
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
          summary?.status === 'available'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-black/5 text-current'
        )}
        aria-live="polite"
      >
        <CalendarCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{summary?.label || 'View live availability'}</span>
      </div>
    )
  }

  return (
    <>
      {services.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
        />
      )}

      <section
        id={section.id}
        className={getSectionSpacing(section.appearance)}
        style={getSectionStyle(
          section.appearance,
          layout === 'editorial' ? '#F3EEE7' : '#F9FAFB',
          '#111827'
        )}
      >
        <div
          className={cn(
            'mx-auto px-4 sm:px-6 lg:px-8',
            getContentWidth(section.appearance)
          )}
        >
          {heading}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map(index => (
                <div key={index} className="h-64 animate-pulse rounded-xl bg-black/10" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="py-12 text-center opacity-70">No services available at the moment.</div>
          ) : layout === 'editorial' ? (
            <div className="border-y border-current/20">
              {services.map((service, index) => (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.06, 0.3) }}
                  className="grid gap-5 border-b border-current/20 py-7 last:border-b-0 md:grid-cols-[52px_minmax(0,1fr)_auto] md:items-center lg:gap-8"
                >
                  <span
                    className="text-sm font-semibold tracking-[0.2em]"
                    style={{ color: accentColor }}
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className={cn('grid gap-5', showImages && service.imageUrl && 'sm:grid-cols-[150px_1fr] sm:items-center')}>
                    {showImages && service.imageUrl && (
                      <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
                        <Image
                          src={service.imageUrl}
                          alt={service.name}
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div>
                      {service.category && (
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
                          {service.category.name}
                        </span>
                      )}
                      <h3
                        className="mt-1 text-2xl font-bold md:text-3xl"
                        style={{ fontFamily: 'var(--theme-font-heading)' }}
                      >
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-70">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 opacity-70">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          {service.duration} min
                        </span>
                        {showPrices && <strong>{formatPrice(service)}</strong>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:min-w-56 md:items-end">
                    {availabilityBadge(service)}
                    <Link
                      href={`/${businessHandle}/book/${service.id}`}
                      className="inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline"
                      style={{ color: accentColor }}
                    >
                      Book service <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                layout === 'grid'
                  ? 'grid gap-6 md:grid-cols-2'
                  : 'mx-auto flex max-w-4xl flex-col gap-6',
                layout === 'grid' && columns === 3 && 'lg:grid-cols-3'
              )}
            >
              {services.map((service, index) => (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.08, 0.3) }}
                  className={cn(
                    cardStyleClasses[cardStyle],
                    layout === 'list' && 'sm:grid sm:grid-cols-[220px_1fr]',
                    cardStyle !== 'elevated' && 'text-current'
                  )}
                >
                  {showImages && service.imageUrl && (
                    <div
                      className={cn(
                        'relative bg-black/5',
                        layout === 'list' ? 'min-h-52 sm:min-h-full' : 'h-48'
                      )}
                    >
                      <Image
                        src={service.imageUrl}
                        alt={service.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {service.category && (
                      <span
                        className="text-xs font-semibold uppercase tracking-[0.15em]"
                        style={{ color: accentColor }}
                      >
                        {service.category.name}
                      </span>
                    )}
                    <h3 className="mb-3 mt-2 text-xl font-bold">{service.name}</h3>
                    {service.description && (
                      <p className="mb-4 line-clamp-3 text-sm leading-relaxed opacity-70">
                        {service.description}
                      </p>
                    )}
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 opacity-65">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {service.duration} min
                      </span>
                      {showPrices && <strong>{formatPrice(service)}</strong>}
                    </div>
                    <div className="mb-4">{availabilityBadge(service)}</div>
                    <Link
                      href={`/${businessHandle}/book/${service.id}`}
                      className="theme-button-primary flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
                    >
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      Book this service
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
