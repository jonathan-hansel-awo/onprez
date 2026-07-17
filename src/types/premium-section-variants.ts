export type PremiumSectionVariantId =
  | 'hero-full-bleed'
  | 'hero-split'
  | 'intro-editorial'
  | 'practitioner-profile'
  | 'services-image-cards'
  | 'services-compact-list'
  | 'gallery-full-width'
  | 'testimonial-feature'
  | 'trust-strip'
  | 'location-hours'
  | 'faq-accordion'
  | 'booking-cta-banner'
  | 'booking-cta-sticky-mobile'
  | 'social-instagram'

export type PremiumSectionFamily =
  | 'HERO'
  | 'ABOUT'
  | 'SERVICES'
  | 'GALLERY'
  | 'TESTIMONIALS'
  | 'TRUST'
  | 'CONTACT'
  | 'FAQ'
  | 'BOOKING_CTA'
  | 'SOCIAL'

export interface PremiumSectionVariantDefinition {
  id: PremiumSectionVariantId
  family: PremiumSectionFamily
  name: string
  description: string
  mobileFirst: boolean
}

export const premiumSectionVariants: readonly PremiumSectionVariantDefinition[] = [
  {
    id: 'hero-full-bleed',
    family: 'HERO',
    name: 'Full-bleed image hero',
    description: 'Immersive image hero with layered copy and a primary booking action.',
    mobileFirst: true,
  },
  {
    id: 'hero-split',
    family: 'HERO',
    name: 'Split image-and-copy hero',
    description: 'Editorial two-column hero that stacks cleanly on small screens.',
    mobileFirst: true,
  },
  {
    id: 'intro-editorial',
    family: 'ABOUT',
    name: 'Editorial introduction',
    description: 'Large-heading introduction for a distinctive brand story.',
    mobileFirst: true,
  },
  {
    id: 'practitioner-profile',
    family: 'ABOUT',
    name: 'Practitioner profile',
    description: 'Image-led founder or practitioner profile with credentials and biography.',
    mobileFirst: true,
  },
  {
    id: 'services-image-cards',
    family: 'SERVICES',
    name: 'Image-led service cards',
    description: 'Premium service cards with imagery, duration, price, and booking action.',
    mobileFirst: true,
  },
  {
    id: 'services-compact-list',
    family: 'SERVICES',
    name: 'Compact service list',
    description: 'Space-efficient treatment or service menu with fast booking actions.',
    mobileFirst: true,
  },
  {
    id: 'gallery-full-width',
    family: 'GALLERY',
    name: 'Full-width gallery',
    description: 'Edge-to-edge visual gallery with responsive image crops.',
    mobileFirst: true,
  },
  {
    id: 'testimonial-feature',
    family: 'TESTIMONIALS',
    name: 'Testimonial feature',
    description: 'Prominent customer quote with optional rating and attribution.',
    mobileFirst: true,
  },
  {
    id: 'trust-strip',
    family: 'TRUST',
    name: 'Trust and credentials strip',
    description: 'Compact trust markers for qualifications, experience, and service standards.',
    mobileFirst: true,
  },
  {
    id: 'location-hours',
    family: 'CONTACT',
    name: 'Location and opening hours',
    description: 'Accessible address, directions, and weekly opening-hours panel.',
    mobileFirst: true,
  },
  {
    id: 'faq-accordion',
    family: 'FAQ',
    name: 'FAQ accordion',
    description: 'Expandable frequently asked questions optimised for mobile reading.',
    mobileFirst: true,
  },
  {
    id: 'booking-cta-banner',
    family: 'BOOKING_CTA',
    name: 'Booking CTA banner',
    description: 'High-contrast booking prompt for conversion points within a page.',
    mobileFirst: true,
  },
  {
    id: 'booking-cta-sticky-mobile',
    family: 'BOOKING_CTA',
    name: 'Sticky mobile booking CTA',
    description: 'Persistent small-screen booking action with safe-area support.',
    mobileFirst: true,
  },
  {
    id: 'social-instagram',
    family: 'SOCIAL',
    name: 'Instagram and social links',
    description: 'Branded social profile callout with optional image tiles.',
    mobileFirst: true,
  },
] as const

export function getPremiumSectionVariant(
  id: PremiumSectionVariantId
): PremiumSectionVariantDefinition {
  const variant = premiumSectionVariants.find(item => item.id === id)

  if (!variant) {
    throw new Error(`Unknown premium section variant: ${id}`)
  }

  return variant
}
