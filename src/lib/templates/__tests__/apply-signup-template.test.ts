import { BusinessCategory } from '@prisma/client'
import { createSignupPresencePageContent } from '@/lib/templates/apply-signup-template'
import { createSelectedSignupPresencePageContent } from '@/lib/templates/select-signup-template'

describe('createSignupPresencePageContent', () => {
  it('applies the selected template structure without copying demo services or prices', () => {
    const applied = createSignupPresencePageContent(
      'Heavenly Pamper Palace',
      BusinessCategory.MASSAGE,
      'serene-wellness'
    )

    expect(applied.templateSlug).toBe('serene-wellness')
    expect(applied.templateName).toBe('Serene Wellness')

    const hero = applied.sections.find(section => section.type === 'HERO')
    const services = applied.sections.find(section => section.type === 'SERVICES')
    const faq = applied.sections.find(section => section.type === 'FAQ')

    expect((hero?.data as { title?: string }).title).toBe('Heavenly Pamper Palace')
    expect(services?.data).not.toHaveProperty('serviceIds')
    expect(JSON.stringify(applied.sections)).not.toContain('Deep Rest Massage')
    expect(JSON.stringify(applied.sections)).not.toContain('£65')
    expect((faq?.data as { items?: unknown[] }).items).toEqual([])
  })

  it('applies premium editorial controls for the Editorial Beauty template', () => {
    const applied = createSelectedSignupPresencePageContent(
      'Crown & Canvas Studio',
      BusinessCategory.BEAUTY,
      'editorial-beauty'
    )

    expect(applied.templateSlug).toBe('editorial-beauty')
    expect(applied.templateName).toBe('Editorial Beauty')
    expect(applied.theme).toMatchObject({
      primaryColor: '#9c4960',
      backgroundColor: '#fff7f8',
      headingFont: 'Georgia',
      buttonStyle: 'square',
      spacing: 'relaxed',
    })

    expect(applied.sections.find(section => section.type === 'HERO')).toMatchObject({
      type: 'HERO',
      appearance: {
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        layout: 'editorial',
        secondaryCtaText: 'Explore our work',
        minHeight: 'viewport',
      },
    })

    expect(applied.sections.find(section => section.type === 'ABOUT')).toMatchObject({
      type: 'ABOUT',
      data: {
        layout: 'editorial',
        imageShape: 'portrait',
      },
    })

    expect(applied.sections.find(section => section.type === 'SERVICES')).toMatchObject({
      type: 'SERVICES',
      data: {
        layout: 'editorial',
        showImages: true,
        showPrices: true,
      },
    })

    expect(applied.sections.find(section => section.type === 'GALLERY')).toMatchObject({
      type: 'GALLERY',
      data: {
        layout: 'editorial',
        featuredImageIndex: 0,
        imageRadius: 'none',
      },
    })

    expect(applied.sections.find(section => section.type === 'TESTIMONIALS')).toMatchObject({
      type: 'TESTIMONIALS',
      data: {
        layout: 'editorial',
        showRatings: true,
      },
    })

    expect(applied.sections.find(section => section.type === 'SERVICES')?.data).not.toHaveProperty(
      'serviceIds'
    )
  })

  it('falls back to normal unpublished presence content for an unknown template', () => {
    const applied = createSignupPresencePageContent(
      'Safe Fallback Business',
      BusinessCategory.OTHER,
      'missing-template'
    )

    const hero = applied.sections.find(section => section.type === 'HERO')

    expect(applied.templateSlug).toBeUndefined()
    expect(applied.sections.length).toBeGreaterThan(0)
    expect((hero?.data as { title?: string }).title).toContain('Safe Fallback Business')
  })
})
