'use client'

import { PageSection } from '@/types/page-sections'
import { HeroSection } from './HeroSection'
import { AboutSection } from './AboutSection'
import { ServicesSection } from './ServicesSection'
import { GallerySection } from './GallerySection'
import { ContactSection } from './ContactSection'
import { FAQSection } from './FAQSection'
import { TestimonialsSection } from './TestimonialsSection'
import { CustomHTMLSection } from './CustomHTMLSection'
import { InquirySection } from './InquirySection'

interface SectionRendererProps {
  sections: PageSection[]
  businessHandle: string
  businessId: string
  businessName: string
  businessData: {
    phone?: string
    email?: string
    address?: string
    socialMedia?: {
      facebook?: string
      instagram?: string
      twitter?: string
      linkedin?: string
    }
  }
  showInquiryForm?: boolean
}

export function SectionRenderer({
  sections,
  businessHandle,
  businessData,
  businessId,
  businessName,
  showInquiryForm = true,
}: SectionRendererProps) {
  // Filter only visible sections and sort by order
  const visibleSections = sections
    .filter(section => section.isVisible)
    .sort((a, b) => a.order - b.order)

  return (
    <>
      {visibleSections.map(section => {
        switch (section.type) {
          case 'HERO':
            return <HeroSection key={section.id} section={section} />

          case 'ABOUT':
            return <AboutSection key={section.id} section={section} />

          case 'SERVICES':
            return (
              <ServicesSection key={section.id} section={section} businessHandle={businessHandle} />
            )

          case 'GALLERY':
            return <GallerySection key={section.id} section={section} />

          case 'CONTACT':
            return <ContactSection key={section.id} section={section} businessData={businessData} />

          case 'FAQ':
            return <FAQSection key={section.id} section={section} businessName={businessName} />

          case 'TESTIMONIALS':
            return <TestimonialsSection key={section.id} section={section} />

          case 'CUSTOM_HTML':
            return <CustomHTMLSection key={section.id} section={section} />

          default:
            return null
        }
      })}

      {showInquiryForm && (
        <InquirySection
          businessId={businessId}
          businessName={businessName}
          title="Have Questions?"
          description="We're here to help. Send us a message and we'll get back to you soon."
        />
      )}
    </>
  )
}
