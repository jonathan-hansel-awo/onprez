import type { BusinessCategory } from '@prisma/client'
import type { PageSection } from '@/types/page-sections'
import { getPresenceTemplate } from '@/data/presence-template-catalogue'
import { createDefaultPresencePageContent } from '@/lib/utils/default-presence-page'

export interface AppliedSignupTemplate {
  templateSlug?: string
  templateName?: string
  sections: PageSection[]
  theme?: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
    fontFamily: string
  }
}

function sectionId(type: string, order: number) {
  return `section-${type.toLowerCase()}-${order}`
}

function createPremiumTemplateSections(
  businessName: string,
  templateSlug: string
): PageSection[] | undefined {
  if (templateSlug === 'heavenly-pamper-palace') {
    return [
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
            { id: 'link-about', label: 'The Experience', href: '#about' },
            { id: 'link-services', label: 'Treatments', href: '#services' },
            { id: 'link-contact', label: 'Contact', href: '#contact' },
          ],
          showCta: true,
          ctaText: 'Book Now',
          ctaLink: '#services',
          style: 'solid',
          position: 'sticky',
          backgroundColor: '#fffdf7',
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
          subtitle: 'A luminous retreat for calm, confidence, and beautifully considered care.',
          backgroundImage:
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1800&q=85',
          ctaText: 'View Treatments',
          ctaLink: '#services',
          alignment: 'left',
          overlay: true,
          overlayColor: '#fffaf0',
          overlayOpacity: 42,
          overlayStyle: 'gradient-diagonal',
          textColor: 'dark',
          textShadow: false,
        },
      },
      {
        id: sectionId('about', 2),
        type: 'ABOUT',
        order: 2,
        isVisible: true,
        data: {
          title: 'Serenity, polished with a touch of glamour',
          content:
            '<p>Personalised treatments, thoughtful rituals, and unhurried care in a peaceful setting designed around every client.</p>',
          image:
            'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=85',
          imagePosition: 'right',
        },
      },
      {
        id: sectionId('services', 3),
        type: 'SERVICES',
        order: 3,
        isVisible: true,
        data: {
          title: 'Choose your moment of calm',
          description: 'Explore treatments and choose the care that feels right for you.',
          layout: 'grid',
          showPrices: true,
        },
      },
      {
        id: sectionId('gallery', 4),
        type: 'GALLERY',
        order: 4,
        isVisible: true,
        data: {
          title: 'Inside the experience',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1400&q=85',
              alt: 'Luxury spa treatment room placeholder',
            },
            {
              url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=85',
              alt: 'Facial treatment placeholder',
            },
          ],
          layout: 'grid',
          columns: 2,
        },
      },
      {
        id: sectionId('faq', 5),
        type: 'FAQ',
        order: 5,
        isVisible: true,
        data: {
          title: 'Before your visit',
          items: [],
        },
      },
      {
        id: sectionId('contact', 6),
        type: 'CONTACT',
        order: 6,
        isVisible: true,
        data: {
          title: 'Plan your visit',
          showPhone: true,
          showEmail: true,
          showAddress: true,
          showMap: false,
          showSocialMedia: true,
        },
      },
    ]
  }

  if (templateSlug === 'regent-barber') {
    return [
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
            { id: 'link-services', label: 'Services', href: '#services' },
            { id: 'link-gallery', label: 'The Shop', href: '#gallery' },
            { id: 'link-contact', label: 'Visit', href: '#contact' },
          ],
          showCta: true,
          ctaText: 'Book a Chair',
          ctaLink: '#services',
          style: 'solid',
          position: 'sticky',
          backgroundColor: '#171717',
          textColor: 'light',
        },
      },
      {
        id: sectionId('hero', 1),
        type: 'HERO',
        order: 1,
        isVisible: true,
        data: {
          title: businessName,
          subtitle: 'Sharp cuts, considered grooming, and time in the chair done properly.',
          backgroundImage:
            'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1800&q=85',
          ctaText: 'Book a Chair',
          ctaLink: '#services',
          alignment: 'left',
          overlay: true,
          overlayColor: '#151515',
          overlayOpacity: 58,
          overlayStyle: 'gradient-diagonal',
          textColor: 'light',
          textShadow: true,
        },
      },
      {
        id: sectionId('services', 2),
        type: 'SERVICES',
        order: 2,
        isVisible: true,
        data: {
          title: 'The service menu',
          description: 'Precision cuts and grooming with clear timing and pricing.',
          layout: 'grid',
          showPrices: true,
        },
      },
      {
        id: sectionId('gallery', 3),
        type: 'GALLERY',
        order: 3,
        isVisible: true,
        data: {
          title: 'The shop',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85',
              alt: 'Barber at work placeholder',
            },
            {
              url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=85',
              alt: 'Premium barbershop interior placeholder',
            },
          ],
          layout: 'grid',
          columns: 2,
        },
      },
      {
        id: sectionId('contact', 4),
        type: 'CONTACT',
        order: 4,
        isVisible: true,
        data: {
          title: 'Find your chair',
          showPhone: true,
          showEmail: true,
          showAddress: true,
          showMap: false,
          showSocialMedia: true,
        },
      },
    ]
  }

  return undefined
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

  const premiumSections = createPremiumTemplateSections(businessName, template.slug)

  const sections: PageSection[] = premiumSections || [
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
    theme: {
      primaryColor: template.palette.primary,
      secondaryColor: template.palette.surface,
      backgroundColor: template.palette.background,
      textColor: template.palette.text,
      fontFamily: template.slug === 'regent-barber' ? 'Georgia' : 'Inter',
    },
  }
}
