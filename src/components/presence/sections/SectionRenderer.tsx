'use client'

import { PageSection } from '@/types/page-sections'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import {
  PresenceTrustSignals,
  PresenceTrustStrip,
  SectionBookingCta,
  StickyMobileBookingCta,
} from '@/components/presence/PresenceConversion'

// Static imports for above-the-fold sections
import { HeroSection } from './HeroSection'
import { AboutSection } from './AboutSection'
import { NavbarSection } from './NavbarSection'

// Dynamic imports for below-the-fold sections (lazy loaded)
const ServicesSection = dynamic(
  () => import('./ServicesSection').then(mod => ({ default: mod.ServicesSection })),
  {
    loading: () => <SectionSkeleton />,
  }
)

const GallerySection = dynamic(
  () => import('./GallerySection').then(mod => ({ default: mod.GallerySection })),
  {
    loading: () => <SectionSkeleton />,
  }
)

const ContactSection = dynamic(
  () => import('./ContactSection').then(mod => ({ default: mod.ContactSection })),
  {
    loading: () => <SectionSkeleton />,
  }
)

const FAQSection = dynamic(
  () => import('./FAQSection').then(mod => ({ default: mod.FAQSection })),
  {
    loading: () => <SectionSkeleton />,
  }
)

const TestimonialsSection = dynamic(
  () => import('./TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })),
  {
    loading: () => <SectionSkeleton />,
  }
)

const CustomHTMLSection = dynamic(
  () => import('./CustomHTMLSection').then(mod => ({ default: mod.CustomHTMLSection })),
  {
    loading: () => <SectionSkeleton />,
  }
)

const InquirySection = dynamic(
  () => import('./InquirySection').then(mod => ({ default: mod.InquirySection })),
  {
    loading: () => <SectionSkeleton />,
  }
)

function SectionSkeleton() {
  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="h-64 bg-gray-200 animate-pulse rounded-xl" />
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
}

export function SectionRenderer({
  sections,
  businessHandle,
  businessData,
  businessId,
  businessName,
  showInquiryForm = true,
  trustSignals = {},
}: SectionRendererProps) {
  const visibleSections = sections
    .filter(section => section.isVisible)
    .sort((a, b) => a.order - b.order)

  const bookingHref = `/${businessHandle}/book`
  const ctaSectionTypes = new Set(['ABOUT', 'SERVICES', 'GALLERY', 'TESTIMONIALS', 'FAQ'])

  return (
    <div className="pb-24 md:pb-0">
      {visibleSections.map((section, index) => {
        // First 2 sections load immediately (above fold)
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
              return (
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
                <ContactSection key={section.id} section={section} businessData={businessData} />
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

        // Wrap below-fold sections in Suspense
        const renderedSection = isAboveFold ? (
          sectionComponent
        ) : (
          <Suspense fallback={<SectionSkeleton />}>{sectionComponent}</Suspense>
        )

        return (
          <div key={section.id}>
            {renderedSection}
            {section.type === 'HERO' && <PresenceTrustStrip signals={trustSignals} />}
            {ctaSectionTypes.has(section.type) && (
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

      <StickyMobileBookingCta bookingHref={bookingHref} businessName={businessName} />
    </div>
  )
}
