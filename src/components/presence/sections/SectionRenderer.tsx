'use client'

import type { PageSection } from '@/types/page-sections'
import type { CanonicalPreviewService } from '@/lib/templates/canonical-template-engine'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import {
  type PresenceTrustSignals,
  PresenceTrustStrip,
  SectionBookingCta,
  StickyMobileBookingCta,
} from '@/components/presence/PresenceConversion'
import { HeroSection } from './HeroSection'
import { AboutSection } from './AboutSection'
import { NavbarSection } from './NavbarSection'
import { CanonicalPreviewServicesSection } from './CanonicalPreviewServicesSection'

const ServicesSection = dynamic(
  () => import('./ServicesSection').then(mod => ({ default: mod.ServicesSection })),
  { loading: () => <SectionSkeleton /> }
)

const GallerySection = dynamic(
  () => import('./GallerySection').then(mod => ({ default: mod.GallerySection })),
  { loading: () => <SectionSkeleton /> }
)

const ContactSection = dynamic(
  () => import('./ContactSection').then(mod => ({ default: mod.ContactSection })),
  { loading: () => <SectionSkeleton /> }
)

const FAQSection = dynamic(
  () => import('./FAQSection').then(mod => ({ default: mod.FAQSection })),
  { loading: () => <SectionSkeleton /> }
)

const TestimonialsSection = dynamic(
  () => import('./TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })),
  { loading: () => <SectionSkeleton /> }
)

const CustomHTMLSection = dynamic(
  () => import('./CustomHTMLSection').then(mod => ({ default: mod.CustomHTMLSection })),
  { loading: () => <SectionSkeleton /> }
)

const InquirySection = dynamic(
  () => import('./InquirySection').then(mod => ({ default: mod.InquirySection })),
  { loading: () => <SectionSkeleton /> }
)

function SectionSkeleton() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  )
}

interface SectionRendererProps {
  sections: PageSection[]
  businessHandle: string
  businessId: string
  businessName: string
  businessData: {
    phone?: string
    email?: string
    address?: string
    website?: string
    socialLinks?: {
      facebook?: string
      instagram?: string
      twitter?: string
      linkedin?: string
      tiktok?: string
      youtube?: string
      website?: string
    }
  }
  showInquiryForm?: boolean
  trustSignals?: PresenceTrustSignals
  servicesOverride?: CanonicalPreviewService[]
  bookingHrefOverride?: string
  showConversionCtas?: boolean
}

function hasMeaningfulTrustSignals(signals: PresenceTrustSignals) {
  return Object.values(signals).some(value => {
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== null && value !== '' && value !== 0
  })
}

export function SectionRenderer({
  sections,
  businessHandle,
  businessData,
  businessId,
  businessName,
  showInquiryForm = true,
  trustSignals = {},
  servicesOverride,
  bookingHrefOverride,
  showConversionCtas = true,
}: SectionRendererProps) {
  const visibleSections = sections
    .filter(section => section.isVisible)
    .sort((a, b) => a.order - b.order)

  const bookingHref = bookingHrefOverride || `/${businessHandle}/book`
  const showTrustStrip = hasMeaningfulTrustSignals(trustSignals)
  const ctaSectionTypes = new Set(['SERVICES', 'FAQ'])

  return (
    <div className="pb-24 md:pb-0">
      {visibleSections.map((section, index) => {
        const isAboveFold = index < 2

        const sectionComponent = (() => {
          switch (section.type) {
            case 'NAVBAR':
              return (
                <NavbarSection
                  key={section.id}
                  section={section}
                  businessName={businessName}
                  bookingHref={bookingHref}
                />
              )

            case 'HERO':
              return <HeroSection key={section.id} section={section} bookingHref={bookingHref} />

            case 'ABOUT':
              return <AboutSection key={section.id} section={section} />

            case 'SERVICES':
              return servicesOverride ? (
                <CanonicalPreviewServicesSection
                  key={section.id}
                  section={section}
                  services={servicesOverride}
                  bookingHref={bookingHref}
                />
              ) : (
                <ServicesSection
                  key={section.id}
                  section={section}
                  businessHandle={businessHandle}
                />
              )

            case 'GALLERY':
              return <GallerySection key={section.id} section={section} />

            case 'CONTACT':
              return (
                <ContactSection
                  key={section.id}
                  section={section}
                  businessData={businessData}
                  bookingHref={bookingHref}
                />
              )

            case 'FAQ':
              return <FAQSection key={section.id} section={section} businessName={businessName} />

            case 'TESTIMONIALS':
              return <TestimonialsSection key={section.id} section={section} />

            case 'CUSTOM_HTML':
              return <CustomHTMLSection key={section.id} section={section} />

            default:
              return null
          }
        })()

        const renderedSection = isAboveFold ? (
          sectionComponent
        ) : (
          <Suspense fallback={<SectionSkeleton />}>{sectionComponent}</Suspense>
        )

        return (
          <div key={section.id}>
            {renderedSection}
            {section.type === 'HERO' && showTrustStrip && (
              <PresenceTrustStrip signals={trustSignals} />
            )}
            {showConversionCtas && ctaSectionTypes.has(section.type) && (
              <SectionBookingCta bookingHref={bookingHref} businessName={businessName} />
            )}
          </div>
        )
      })}

      {showInquiryForm && (
        <Suspense fallback={<SectionSkeleton />}>
          <InquirySection
            businessId={businessId}
            businessName={businessName}
            title="Have Questions?"
            description="We're here to help. Send us a message and we'll get back to you soon."
          />
        </Suspense>
      )}

      {showConversionCtas && (
        <StickyMobileBookingCta bookingHref={bookingHref} businessName={businessName} />
      )}
    </div>
  )
}
