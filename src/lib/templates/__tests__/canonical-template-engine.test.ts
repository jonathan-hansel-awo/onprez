import { BusinessCategory } from '@prisma/client'
import { presenceTemplateCatalogue } from '@/data/presence-template-catalogue'
import {
  CANONICAL_TEMPLATE_VERSION,
  createCanonicalPresencePageContent,
} from '@/lib/templates/canonical-template-engine'
import type { PageSection } from '@/types/page-sections'

describe('canonical presence template engine', () => {
  it.each(presenceTemplateCatalogue.map(template => [template.slug, template.name]))(
    'uses the same presentation contract for %s preview and account pages',
    (slug, name) => {
      const preview = createCanonicalPresencePageContent(
        'Example Business',
        BusinessCategory.OTHER,
        slug,
        { mode: 'preview' }
      )
      const account = createCanonicalPresencePageContent(
        'Example Business',
        BusinessCategory.OTHER,
        slug,
        { mode: 'account' }
      )

      expect(preview.templateName).toBe(name)
      expect(account.templateName).toBe(name)
      expect(account.templateVersion).toBe(CANONICAL_TEMPLATE_VERSION)
      expect(account.theme).toEqual(preview.theme)
      expect(account.sections.map(section => section.type)).toEqual(
        preview.sections.map(section => section.type)
      )
      expect(account.sections.map(section => section.appearance)).toEqual(
        preview.sections.map(section => section.appearance)
      )
      expect(account.sections.map(section => section.id)).toEqual(
        preview.sections.map(section => section.id)
      )
      expect(preview.previewServices?.length).toBeGreaterThan(0)
      expect(account.previewServices).toBeUndefined()
    }
  )

  it('retains the flagship premium compositions in the account result', () => {
    const heavenly = createCanonicalPresencePageContent(
      'Heavenly Pamper Palace',
      BusinessCategory.SPA,
      'heavenly-pamper-palace',
      { mode: 'account' }
    )
    const editorial = createCanonicalPresencePageContent(
      'Hanselisky',
      BusinessCategory.BEAUTY,
      'editorial-beauty',
      { mode: 'account' }
    )

    expect(heavenly.theme).toMatchObject({
      backgroundColor: '#fffaf0',
      headingFont: 'Georgia',
      buttonStyle: 'pill',
      spacing: 'relaxed',
    })
    expect(heavenly.sections.find(section => section.type === 'HERO')).toMatchObject({
      data: { minHeight: 'viewport' },
      appearance: { contentWidth: 'wide', spacing: 'spacious' },
    })
    expect(editorial.sections.find(section => section.type === 'HERO')).toMatchObject({
      data: { layout: 'editorial', minHeight: 'viewport' },
      appearance: { contentWidth: 'wide', spacing: 'spacious' },
    })
    expect(editorial.sections.find(section => section.type === 'GALLERY')).toMatchObject({
      data: { layout: 'editorial', imageRadius: 'none' },
    })
  })

  it('does not copy fictional preview services, prices, reviews, or FAQs into accounts', () => {
    const account = createCanonicalPresencePageContent(
      'Real Customer Business',
      BusinessCategory.BEAUTY,
      'editorial-beauty',
      { mode: 'account' }
    )
    const serialized = JSON.stringify(account.sections)
    const testimonials = account.sections.find(section => section.type === 'TESTIMONIALS')
    const faq = account.sections.find(section => section.type === 'FAQ')

    expect(serialized).not.toContain('Medium Knotless Braids')
    expect(serialized).not.toContain('£145')
    expect(serialized).not.toContain('Ada M.')
    expect((testimonials?.data as { testimonials?: unknown[] }).testimonials).toEqual([])
    expect((faq?.data as { items?: unknown[] }).items).toEqual([])
    expect(testimonials?.isVisible).toBe(false)
    expect(faq?.isVisible).toBe(false)
  })

  it('preserves meaningful user content while adopting the selected template presentation', () => {
    const existingSections: PageSection[] = [
      {
        id: 'old-hero',
        type: 'HERO',
        order: 0,
        isVisible: true,
        data: {
          title: 'Louise Beauty & Wellness',
          subtitle: 'Personal care in a quiet private studio.',
          backgroundImage: 'https://example.com/real-hero.jpg',
        },
      },
      {
        id: 'old-about',
        type: 'ABOUT',
        order: 1,
        isVisible: true,
        data: {
          title: 'My approach',
          content: '<p>This is the owner-written biography.</p>',
          image: 'https://example.com/real-owner.jpg',
        },
      },
      {
        id: 'old-faq',
        type: 'FAQ',
        order: 2,
        isVisible: true,
        data: {
          title: 'Questions',
          items: [{ id: 'real-faq', question: 'Do you patch test?', answer: 'Yes.' }],
        },
      },
    ]

    const applied = createCanonicalPresencePageContent(
      'Louise Beauty & Wellness',
      BusinessCategory.BEAUTY,
      'heavenly-pamper-palace',
      { mode: 'account', existingSections, preserveContent: true }
    )
    const hero = applied.sections.find(section => section.type === 'HERO')
    const about = applied.sections.find(section => section.type === 'ABOUT')
    const faq = applied.sections.find(section => section.type === 'FAQ')

    expect(hero).toMatchObject({
      id: 'heavenly-pamper-palace-hero-1',
      data: {
        title: 'Louise Beauty & Wellness',
        subtitle: 'Personal care in a quiet private studio.',
        backgroundImage: 'https://example.com/real-hero.jpg',
        minHeight: 'viewport',
      },
    })
    expect(about).toMatchObject({
      data: {
        title: 'My approach',
        content: '<p>This is the owner-written biography.</p>',
        image: 'https://example.com/real-owner.jpg',
        layout: 'editorial',
      },
    })
    expect(faq).toMatchObject({
      isVisible: true,
      data: { items: [{ id: 'real-faq', question: 'Do you patch test?', answer: 'Yes.' }] },
    })
  })
})
