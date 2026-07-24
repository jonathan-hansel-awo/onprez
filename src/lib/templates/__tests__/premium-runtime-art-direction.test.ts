import { BusinessCategory } from '@prisma/client'
import type { PageSection } from '@/types/page-sections'
import { createCanonicalPresencePageContent } from '../canonical-template-engine'
import {
  applyPremiumRuntimeArtDirection,
  getPremiumTemplateSlug,
  materializePremiumTemplateSections,
  normalizeBookingCtaLabel,
} from '../premium-runtime-art-direction'

const editorialSections: PageSection[] = [
  {
    id: 'editorial-beauty-navbar-0',
    type: 'NAVBAR',
    order: 0,
    isVisible: true,
    data: {
      links: [],
      ctaText: 'Try Booking',
      ctaLink: '#book',
    },
  },
  {
    id: 'editorial-beauty-hero-1',
    type: 'HERO',
    order: 1,
    isVisible: true,
    appearance: {
      backgroundColor: '#fff7f8',
      textColor: '#301f25',
      accentColor: '#9c4960',
    },
    data: {
      title: 'Studio Example',
      subtitle: 'Texture-led hair and makeup.',
      backgroundImage: 'https://example.com/hero.jpg',
      ctaText: 'Try Booking',
      ctaLink: '#book',
      layout: 'editorial',
      imageTreatment: 'collage',
      textColor: 'dark',
      overlay: false,
      floatingCard: {
        eyebrow: 'Studio note',
        title: 'Your look, fully considered',
      },
      meta: ['Texture-aware'],
    },
  },
]

describe('premium runtime art direction', () => {
  it('replaces prototype-like Try Booking labels', () => {
    expect(normalizeBookingCtaLabel('Try Booking')).toBe('Book an appointment')
    expect(normalizeBookingCtaLabel('  try   booking ')).toBe('Book an appointment')
    expect(normalizeBookingCtaLabel('Try booking this')).toBe('Book an appointment')
    expect(normalizeBookingCtaLabel('Check availability')).toBe('Check availability')
  })

  it('detects canonical premium template sections', () => {
    expect(getPremiumTemplateSlug(editorialSections)).toBe('editorial-beauty')
    expect(
      getPremiumTemplateSlug([
        {
          id: 'custom-hero',
          type: 'HERO',
          order: 0,
          isVisible: true,
          data: { title: 'Custom page' },
        },
      ])
    ).toBeUndefined()
  })

  it('restores the full-bleed Editorial Beauty hero without mutating the source', () => {
    const repaired = applyPremiumRuntimeArtDirection(editorialSections)
    const hero = repaired.find(section => section.type === 'HERO')
    const navbar = repaired.find(section => section.type === 'NAVBAR')

    expect(repaired).not.toBe(editorialSections)
    expect(editorialSections[1].type === 'HERO' && editorialSections[1].data.layout).toBe(
      'editorial'
    )

    expect(hero?.type).toBe('HERO')
    if (hero?.type === 'HERO') {
      expect(hero.data.layout).toBe('cover')
      expect(hero.data.overlay).toBe(true)
      expect(hero.data.overlayColor).toBe('#2f1720')
      expect(hero.data.textColor).toBe('light')
      expect(hero.data.imageTreatment).toBe('full')
      expect(hero.data.floatingCard).toBeUndefined()
      expect(hero.data.meta).toEqual([])
      expect(hero.data.ctaText).toBe('Book an appointment')
    }

    expect(navbar?.type).toBe('NAVBAR')
    if (navbar?.type === 'NAVBAR') {
      expect(navbar.data.ctaText).toBe('Book an appointment')
    }
  })

  it('materializes a therapist template with separate practice, owner, and process sections', () => {
    const canonical = createCanonicalPresencePageContent(
      'Stillpoint Therapy',
      BusinessCategory.OTHER,
      'stillpoint-therapy',
      { mode: 'preview' }
    )
    const originalSections = canonical.sections
    const materialized = materializePremiumTemplateSections(originalSections)

    expect(materialized).not.toBe(originalSections)
    expect(originalSections.some(section => section.type === 'OWNER')).toBe(false)
    expect(originalSections.some(section => section.type === 'PROCESS')).toBe(false)

    const about = materialized.find(section => section.type === 'ABOUT')
    const owner = materialized.find(section => section.type === 'OWNER')
    const process = materialized.find(section => section.type === 'PROCESS')
    const services = materialized.find(section => section.type === 'SERVICES')
    const gallery = materialized.find(section => section.type === 'GALLERY')

    expect(about).toMatchObject({
      order: 2,
      data: {
        eyebrow: 'The practice',
        title: 'A private place to pause and be heard',
      },
    })
    expect(owner).toMatchObject({
      order: 3,
      data: {
        eyebrow: 'Meet your therapist',
        name: 'Dr Sarah Bennett',
        layout: 'editorial',
      },
    })
    expect(process).toMatchObject({
      order: 5,
      data: {
        title: 'Starting therapy should feel clear',
        layout: 'cards',
        steps: expect.arrayContaining([
          expect.objectContaining({ title: 'Choose a consultation' }),
        ]),
      },
    })
    expect(services).toMatchObject({
      order: 4,
      data: { layout: 'grid', showImages: false },
    })
    expect(gallery).toMatchObject({
      order: 6,
      data: { layout: 'carousel' },
    })
  })

  it('does not recreate rich therapist sections after a user deletes them from a saved design', () => {
    const canonical = createCanonicalPresencePageContent(
      'Stillpoint Therapy',
      BusinessCategory.OTHER,
      'stillpoint-therapy',
      { mode: 'preview' }
    )
    const materialized = materializePremiumTemplateSections(canonical.sections)
    const withoutOwner = materialized.filter(section => section.type !== 'OWNER')
    const repairedAgain = materializePremiumTemplateSections(withoutOwner)

    expect(repairedAgain.some(section => section.type === 'OWNER')).toBe(false)
    expect(repairedAgain.filter(section => section.type === 'PROCESS')).toHaveLength(1)
  })
})
