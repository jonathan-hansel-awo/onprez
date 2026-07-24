'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Clock } from 'lucide-react'
import type { ServicesSection as ServicesSectionType } from '@/types/page-sections'
import type { CanonicalPreviewService } from '@/lib/templates/canonical-template-engine'
import { cn } from '@/lib/utils/cn'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

interface CanonicalPreviewServicesSectionProps {
  section: ServicesSectionType
  services: CanonicalPreviewService[]
  bookingHref: string
}

const cardStyleClasses = {
  elevated: 'overflow-hidden rounded-xl bg-white text-gray-950 shadow-lg',
  outlined: 'overflow-hidden rounded-xl border border-current/15 bg-transparent',
  minimal: 'overflow-hidden border-b border-current/15 bg-transparent',
}

function formatPrice(service: CanonicalPreviewService) {
  if (service.priceType === 'FREE') return 'Free'
  if (service.priceType === 'CONTACT') return 'Contact for price'

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: service.currency || 'GBP',
  })

  if (
    service.priceType === 'RANGE' &&
    service.priceRangeMin != null &&
    service.priceRangeMax != null
  ) {
    return `${formatter.format(service.priceRangeMin)}–${formatter.format(service.priceRangeMax)}`
  }

  const price = formatter.format(service.price)
  return service.priceType === 'STARTING_AT' ? `From ${price}` : price
}

export function CanonicalPreviewServicesSection({
  section,
  services,
  bookingHref,
}: CanonicalPreviewServicesSectionProps) {
  const {
    title,
    description,
    eyebrow,
    layout = 'grid',
    columns = 3,
    cardStyle = 'elevated',
    showImages = true,
    showPrices = true,
  } = section.data
  const accentColor = getAccentColor(section.appearance)

  const heading = (
    <div
      className={cn(
        'mb-10 sm:mb-12',
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
            layout === 'editorial'
              ? 'text-[clamp(2.5rem,12vw,4.5rem)] sm:text-6xl lg:text-7xl'
              : 'text-3xl md:text-4xl'
          )}
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          {title}
        </h2>
      </div>
      {description && (
        <p
          className={cn(
            'text-base leading-relaxed opacity-75 sm:text-lg',
            layout !== 'editorial' && 'mx-auto mt-4 max-w-2xl'
          )}
        >
          {description}
        </p>
      )}
    </div>
  )

  return (
    <section
      id={section.id}
      className={getSectionSpacing(section.appearance)}
      style={getSectionStyle(
        section.appearance,
        layout === 'editorial' ? '#F3EEE7' : '#F9FAFB',
        '#111827'
      )}
    >
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
        {heading}

        {layout === 'editorial' ? (
          <div className="border-y border-current/20">
            {services.map((service, index) => (
              <article
                key={service.id}
                className="grid gap-5 border-b border-current/20 py-7 last:border-b-0 md:grid-cols-[52px_minmax(0,1fr)_auto] md:items-center lg:gap-8"
              >
                <span
                  className="text-sm font-semibold tracking-[0.2em]"
                  style={{ color: accentColor }}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div
                  className={cn(
                    'grid gap-5',
                    showImages && service.imageUrl && 'sm:grid-cols-[150px_1fr] sm:items-center'
                  )}
                >
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
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-75">
                        {service.description}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 opacity-75">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {service.duration} min
                      </span>
                      {showPrices && <strong>{formatPrice(service)}</strong>}
                    </div>
                  </div>
                </div>

                <Link
                  href={bookingHref}
                  className="inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline md:justify-self-end"
                  style={{ color: accentColor }}
                >
                  Book this service <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
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
            {services.map(service => (
              <article
                key={service.id}
                className={cn(
                  cardStyleClasses[cardStyle],
                  layout === 'list' && 'sm:grid sm:grid-cols-[220px_1fr]'
                )}
              >
                {showImages && service.imageUrl && (
                  <div
                    className={cn('relative bg-black/5', layout === 'list' ? 'min-h-52' : 'h-64')}
                  >
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3
                      className="text-2xl font-bold"
                      style={{ fontFamily: 'var(--theme-font-heading)' }}
                    >
                      {service.name}
                    </h3>
                    {showPrices && <strong className="shrink-0">{formatPrice(service)}</strong>}
                  </div>
                  <p className="mt-3 leading-relaxed opacity-75">{service.description}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-1 opacity-75">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {service.duration} min
                    </span>
                    <Link
                      href={bookingHref}
                      className="min-h-11 font-semibold leading-[2.75rem]"
                      style={{ color: accentColor }}
                    >
                      Book this service
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
