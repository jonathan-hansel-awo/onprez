import type { BusinessCategory } from '@prisma/client'
import type { PageSection } from '@/types/page-sections'
import { getPresenceTemplate } from '@/data/presence-template-catalogue'
import { createDefaultPresencePageContent } from '@/lib/utils/default-presence-page'

export interface AppliedSignupTemplate {
  templateSlug?: string
  templateName?: string
  sections: PageSection[]
}

function sectionId(type: string, order: number) {
  return `section-${type.toLowerCase()}-${order}`
}

export function createSignupPresencePageContent(
  businessName: string,
  category: BusinessCategory,
  templateSlug?: string | null
): AppliedSignupTemplate {
  const template = templateSlug ? getPresenceTemplate(templateSlug) : undefined

  if (!template) {
    return {
      sections: createDefaultPresencePageContent(businessName, category),
    }
  }

  const sections: PageSection[] = [
    {
      id: sectionId('navbar', 0),
      type: 'NAVBAR',
      order: 0,
      isVisible: true,
      data: {
        showLogo: true,
        showLogoText: true,
        logoText: businessName,
        links: [
          { id: 'link-about', label: 'About', href: '#about' },
          { id: 'link-services', label: 'Services', href: '#services' },
          { id: 'link-contact', label: 'Contact', href: '#contact' },
        ],
        showCta: true,
        ctaText: 'Book Now',
        ctaLink: '#services',
        style: 'solid',
        position: 'sticky',
        textColor: 'dark',
      },
    },
    {
      id: sectionId('hero', 1),
      type: 'HERO',
      order: 1,
      isVisible: true,
      data: {
        title: businessName,
        subtitle: template.preview.headline,
        ctaText: 'View Services',
        ctaLink: '#services',
        alignment: 'center',
        overlay: true,
        overlayColor: template.palette.primary,
        overlayOpacity: 55,
        overlayStyle: 'gradient-diagonal',
        textColor: 'light',
        textShadow: true,
      },
    },
    {
      id: sectionId('about', 2),
      type: 'ABOUT',
      order: 2,
      isVisible: true,
      data: {
        title: `About ${businessName}`,
        content:
          '<p>Add your real business story, qualifications, approach, and what customers can expect.</p>',
        imagePosition: 'right',
      },
    },
    {
      id: sectionId('services', 3),
      type: 'SERVICES',
      order: 3,
      isVisible: true,
      data: {
        title: 'Services',
        description:
          'Add your real services, prices, durations, and availability before publishing.',
        layout: template.category === 'PROFESSIONAL' ? 'list' : 'grid',
        showPrices: true,
      },
    },
    {
      id: sectionId('gallery', 4),
      type: 'GALLERY',
      order: 4,
      isVisible: true,
      data: {
        title: 'Gallery',
        images: [],
        layout: 'grid',
        columns: template.category === 'CREATIVE' ? 4 : 3,
      },
    },
    {
      id: sectionId('faq', 5),
      type: 'FAQ',
      order: 5,
      isVisible: true,
      data: {
        title: 'Frequently Asked Questions',
        items: [],
      },
    },
    {
      id: sectionId('contact', 6),
      type: 'CONTACT',
      order: 6,
      isVisible: true,
      data: {
        title: 'Contact',
        showPhone: true,
        showEmail: true,
        showAddress: true,
        showMap: false,
        showSocialMedia: true,
      },
    },
  ]

  return {
    templateSlug: template.slug,
    templateName: template.name,
    sections,
  }
}
