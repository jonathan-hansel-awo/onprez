'use client'

import Link from 'next/link'
import { Award, Calendar, Clock3, MapPin, ShieldCheck, Star } from 'lucide-react'

export interface PresenceTrustSignals {
  location?: string
  reviewCount?: number
  averageRating?: number
  cancellationNoticeHours?: number
  responseTime?: string
  credentials?: string[]
}

interface BookingLinkProps {
  bookingHref: string
  businessName: string
}

export function PresenceTrustStrip({ signals }: { signals: PresenceTrustSignals }) {
  const items = [
    signals.averageRating && signals.reviewCount
      ? {
          icon: Star,
          label: `${signals.averageRating.toFixed(1)} from ${signals.reviewCount} ${signals.reviewCount === 1 ? 'review' : 'reviews'}`,
        }
      : null,
    signals.location ? { icon: MapPin, label: signals.location } : null,
    signals.credentials?.length
      ? { icon: Award, label: signals.credentials.slice(0, 2).join(' · ') }
      : null,
    signals.cancellationNoticeHours !== undefined
      ? {
          icon: ShieldCheck,
          label: `${signals.cancellationNoticeHours}-hour cancellation notice`,
        }
      : null,
    signals.responseTime ? { icon: Clock3, label: signals.responseTime } : null,
  ].filter(Boolean) as Array<{ icon: typeof Star; label: string }>

  if (items.length === 0) return null

  return (
    <aside aria-label="Business highlights" className="border-y border-gray-200 bg-white">
      <div className="container mx-auto flex flex-wrap justify-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Icon className="h-4 w-4 shrink-0 text-onprez-blue" aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function SectionBookingCta({ bookingHref, businessName }: BookingLinkProps) {
  return (
    <div className="hidden border-y border-gray-200 bg-white px-4 py-6 md:block">
      <div className="container mx-auto flex max-w-4xl items-center justify-between gap-6">
        <div>
          <p className="font-semibold text-gray-900">Ready to book with {businessName}?</p>
          <p className="mt-1 text-sm text-gray-600">
            Choose a service and see live appointment times.
          </p>
        </div>
        <Link
          href={bookingHref}
          className="theme-button-primary inline-flex shrink-0 items-center gap-2 px-6 py-3 font-semibold"
        >
          <Calendar className="h-4 w-4" aria-hidden="true" />
          Check availability
        </Link>
      </div>
    </div>
  )
}

export function StickyMobileBookingCta({ bookingHref, businessName }: BookingLinkProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-gray-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur md:hidden">
      <Link
        href={bookingHref}
        className="theme-button-primary flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 text-center font-semibold"
        aria-label={`Book an appointment with ${businessName}`}
      >
        <Calendar className="h-5 w-5" aria-hidden="true" />
        Book now
      </Link>
    </div>
  )
}
