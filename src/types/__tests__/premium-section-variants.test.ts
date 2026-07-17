import {
  getPremiumSectionVariant,
  premiumSectionVariants,
  type PremiumSectionVariantId,
} from '@/types/premium-section-variants'

const requiredVariants: PremiumSectionVariantId[] = [
  'hero-full-bleed',
  'hero-split',
  'intro-editorial',
  'practitioner-profile',
  'services-image-cards',
  'services-compact-list',
  'gallery-full-width',
  'testimonial-feature',
  'trust-strip',
  'location-hours',
  'faq-accordion',
  'booking-cta-banner',
  'booking-cta-sticky-mobile',
  'social-instagram',
]

describe('premium section variant registry', () => {
  it('contains every FP-003 required variant', () => {
    const registeredIds = premiumSectionVariants.map(variant => variant.id)

    expect(registeredIds).toEqual(expect.arrayContaining(requiredVariants))
  })

  it('does not contain duplicate identifiers', () => {
    const ids = premiumSectionVariants.map(variant => variant.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('marks every initial premium section as mobile-first', () => {
    expect(premiumSectionVariants.every(variant => variant.mobileFirst)).toBe(true)
  })

  it('returns a registered variant by identifier', () => {
    expect(getPremiumSectionVariant('hero-full-bleed').name).toBe('Full-bleed image hero')
  })
})
