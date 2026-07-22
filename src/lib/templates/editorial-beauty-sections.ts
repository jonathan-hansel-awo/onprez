import { hairMakeupDemoBusiness } from '@/data/hair-makeup-demo-business'
import type { PageSection } from '@/types/page-sections'

const palette = {
  background: '#fff7f8',
  surface: '#f5dfe4',
  primary: '#9c4960',
  text: '#301f25',
  dark: '#181411',
  light: '#fdf7f0',
}

function editorialSectionId(type: string, order: number) {
  return `editorial-${type.toLowerCase()}-${order}`
}

export function createEditorialBeautySections(businessName: string): PageSection[] {
  const navbarId = editorialSectionId('navbar', 0)
  const heroId = editorialSectionId('hero', 1)
  const aboutId = editorialSectionId('about', 2)
  const servicesId = editorialSectionId('services', 3)
  const galleryId = editorialSectionId('gallery', 4)
  const testimonialsId = editorialSectionId('testimonials', 5)
  const faqId = editorialSectionId('faq', 6)
  const contactId = editorialSectionId('contact', 7)

  return [
    {
      id: navbarId,
      type: 'NAVBAR',
      order: 0,
      isVisible: true,
      data: {
        showLogo: true,
        showLogoText: true,
        logoText: businessName,
        links: [
          { id: 'editorial-link-about', label: 'About', href: `#${aboutId}` },
          { id: 'editorial-link-services', label: 'Services', href: `#${servicesId}` },
          { id: 'editorial-link-gallery', label: 'Portfolio', href: `#${galleryId}` },
          { id: 'editorial-link-faq', label: 'FAQ', href: `#${faqId}` },
        ],
        showCta: true,
        ctaText: 'Book an appointment',
        ctaLink: '#services',
        style: 'solid',
        position: 'sticky',
        backgroundColor: palette.background,
        textColor: 'dark',
      },
    },
    {
      id: heroId,
      type: 'HERO',
      order: 1,
      isVisible: true,
      appearance: {
        backgroundColor: palette.background,
        textColor: palette.text,
        accentColor: palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: hairMakeupDemoBusiness.tagline,
        title: businessName,
        subtitle: hairMakeupDemoBusiness.description,
        backgroundImage: hairMakeupDemoBusiness.images.hero,
        ctaText: 'Book an appointment',
        ctaLink: `#${servicesId}`,
        secondaryCtaText: 'Explore our work',
        secondaryCtaLink: `#${galleryId}`,
        layout: 'editorial',
        imagePosition: 'right',
        imageFocalPoint: 'top',
        minHeight: 'viewport',
        alignment: 'left',
        overlay: false,
        textColor: 'dark',
        textShadow: false,
      },
    },
    {
      id: aboutId,
      type: 'ABOUT',
      order: 2,
      isVisible: true,
      appearance: {
        backgroundColor: '#fffdfb',
        textColor: palette.text,
        accentColor: palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: hairMakeupDemoBusiness.owner.role,
        title: 'The artist behind the studio',
        content: `<p>${hairMakeupDemoBusiness.owner.biography}</p>`,
        image: hairMakeupDemoBusiness.images.owner,
        imagePosition: 'right',
        layout: 'editorial',
        imageShape: 'portrait',
        highlights: hairMakeupDemoBusiness.owner.credentials,
      },
    },
    {
      id: servicesId,
      type: 'SERVICES',
      order: 3,
      isVisible: true,
      appearance: {
        backgroundColor: '#f3eee7',
        textColor: palette.text,
        accentColor: palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'The service menu',
        title: 'Hair and makeup, fully considered',
        description:
          'Clear timing, transparent pricing and thoughtful preparation for every appointment.',
        layout: 'editorial',
        cardStyle: 'minimal',
        showImages: true,
        showPrices: true,
      },
    },
    {
      id: galleryId,
      type: 'GALLERY',
      order: 4,
      isVisible: true,
      appearance: {
        backgroundColor: palette.dark,
        textColor: palette.light,
        accentColor: '#d8a5b1',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'Selected work',
        title: 'Texture, colour and finish',
        images: [
          {
            url: hairMakeupDemoBusiness.images.hero,
            alt: 'Editorial hair and makeup look',
            caption: 'A polished finish shaped around texture and features.',
          },
          {
            url: hairMakeupDemoBusiness.images.braids,
            alt: 'Detailed knotless braids',
            caption: 'Clean parting and a lightweight, comfortable base.',
          },
          {
            url: hairMakeupDemoBusiness.images.silkPress,
            alt: 'Silk press styling',
            caption: 'Healthy movement, shine and a careful thermal finish.',
          },
          {
            url: hairMakeupDemoBusiness.images.makeup,
            alt: 'Soft-glam makeup look',
            caption: 'Skin-focused makeup that still looks like skin.',
          },
          {
            url: hairMakeupDemoBusiness.images.bridal,
            alt: 'Bridal hair and makeup',
            caption: 'A complete bridal look planned without the rush.',
          },
          {
            url: hairMakeupDemoBusiness.images.studio,
            alt: 'Beauty studio interior',
            caption: 'A calm, considered studio experience.',
          },
        ],
        layout: 'editorial',
        featuredImageIndex: 0,
        gap: 'tight',
        imageRadius: 'none',
      },
    },
    {
      id: testimonialsId,
      type: 'TESTIMONIALS',
      order: 5,
      isVisible: true,
      appearance: {
        backgroundColor: palette.surface,
        textColor: palette.text,
        accentColor: palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'Client notes',
        title: 'What the experience feels like',
        testimonials: hairMakeupDemoBusiness.reviews.map(review => ({
          id: review.id,
          name: review.name,
          role: review.service,
          content: review.quote,
          rating: review.rating,
        })),
        layout: 'editorial',
        showRatings: true,
      },
    },
    {
      id: faqId,
      type: 'FAQ',
      order: 6,
      isVisible: true,
      data: {
        title: 'Before your appointment',
        items: hairMakeupDemoBusiness.faqs.map(faq => ({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
        })),
      },
    },
    {
      id: contactId,
      type: 'CONTACT',
      order: 7,
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
