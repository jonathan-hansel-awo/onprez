import { BusinessCategory } from '@prisma/client'
import { createSignupPresencePageContent } from '@/lib/templates/apply-signup-template'

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

    expect(hero?.data.title).toBe('Heavenly Pamper Palace')
    expect(services?.data).not.toHaveProperty('serviceIds')
    expect(JSON.stringify(applied.sections)).not.toContain('Deep Rest Massage')
    expect(JSON.stringify(applied.sections)).not.toContain('£65')
    expect(faq?.data.items).toEqual([])
  })

  it('falls back to normal unpublished presence content for an unknown template', () => {
    const applied = createSignupPresencePageContent(
      'Safe Fallback Business',
      BusinessCategory.OTHER,
      'missing-template'
    )

    expect(applied.templateSlug).toBeUndefined()
    expect(applied.sections.length).toBeGreaterThan(0)
    expect(applied.sections.find(section => section.type === 'HERO')?.data.title).toContain(
      'Safe Fallback Business'
    )
  })
})
