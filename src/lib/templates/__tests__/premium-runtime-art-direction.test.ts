import type { PageSection } from '@/types/page-sections'
import {
  applyPremiumRuntimeArtDirection,
  getPremiumTemplateSlug,
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
  it('replaces the prototype-like Try Booking label', () => {
    expect(normalizeBookingCtaLabel('Try Booking')).toBe('Book an appointment')
    expect(normalizeBookingCtaLabel('  try   booking ')).toBe('Book an appointment')
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
})
