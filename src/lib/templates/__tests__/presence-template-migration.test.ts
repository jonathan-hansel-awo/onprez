import { BusinessCategory } from '@prisma/client'
import { createCanonicalPresencePageContent } from '@/lib/templates/canonical-template-engine'
import { createPresenceTemplateMigrationPlan } from '@/lib/templates/presence-template-migration'
import type { PageSection } from '@/types/page-sections'

const existingSections: PageSection[] = [
  {
    id: 'old-hero',
    type: 'HERO',
    order: 0,
    isVisible: true,
    data: {
      title: 'Old business title',
      subtitle: 'Old owner-written subtitle',
      backgroundImage: 'https://example.com/old-hero.jpg',
    },
  },
  {
    id: 'old-custom-html',
    type: 'CUSTOM_HTML',
    order: 1,
    isVisible: true,
    data: {
      html: '<div>Legacy section</div>',
    },
  },
]

describe('presence template migration planning', () => {
  it('overhauls page-owned content into an exact template mirror', () => {
    const preview = createCanonicalPresencePageContent(
      'Heavenly Pamper Palace',
      BusinessCategory.SPA,
      'heavenly-pamper-palace',
      { mode: 'preview' }
    )
    const plan = createPresenceTemplateMigrationPlan({
      businessName: 'Heavenly Pamper Palace',
      category: BusinessCategory.SPA,
      templateSlug: 'heavenly-pamper-palace',
      existingSections,
      migrationMode: 'overhaul',
    })

    expect(plan.page.sections).toEqual(preview.sections)
    expect(plan.page.previewServices).toBeUndefined()
    expect(plan.page.previewBusinessData).toBeUndefined()
    expect(plan.page.sections.some(section => section.type === 'CUSTOM_HTML')).toBe(false)
    expect(plan.page.sections.find(section => section.type === 'HERO')).toMatchObject({
      data: {
        title: 'Heavenly Pamper Palace',
        subtitle: expect.not.stringContaining('Old owner-written subtitle'),
        backgroundImage: expect.not.stringContaining('old-hero.jpg'),
      },
    })
    expect(plan.page.sections.find(section => section.type === 'TESTIMONIALS')).toMatchObject({
      isVisible: true,
      data: { testimonials: expect.arrayContaining([expect.objectContaining({ rating: 5 })]) },
    })
    expect(plan.page.sections.find(section => section.type === 'FAQ')).toMatchObject({
      isVisible: true,
      data: { items: expect.arrayContaining([expect.objectContaining({ question: expect.any(String) })]) },
    })
    expect(plan.summary).toMatchObject({
      migrationMode: 'overhaul',
      templateDemoContentIncluded: true,
      removedSectionTypes: ['CUSTOM_HTML'],
    })
  })

  it('keeps the existing preservation-heavy repair behaviour available', () => {
    const plan = createPresenceTemplateMigrationPlan({
      businessName: 'Heavenly Pamper Palace',
      category: BusinessCategory.SPA,
      templateSlug: 'heavenly-pamper-palace',
      existingSections,
      migrationMode: 'repair',
    })
    const hero = plan.page.sections.find(section => section.type === 'HERO')
    const testimonials = plan.page.sections.find(section => section.type === 'TESTIMONIALS')
    const faq = plan.page.sections.find(section => section.type === 'FAQ')

    expect(hero).toMatchObject({
      data: {
        title: 'Old business title',
        subtitle: 'Old owner-written subtitle',
        backgroundImage: 'https://example.com/old-hero.jpg',
      },
    })
    expect(testimonials).toMatchObject({ isVisible: false, data: { testimonials: [] } })
    expect(faq).toMatchObject({ isVisible: false, data: { items: [] } })
    expect(plan.summary.templateDemoContentIncluded).toBe(false)
  })

  it('documents the operational records that the migration deliberately leaves untouched', () => {
    const plan = createPresenceTemplateMigrationPlan({
      businessName: 'Hanselisky',
      category: BusinessCategory.BEAUTY,
      templateSlug: 'editorial-beauty',
      existingSections,
      migrationMode: 'overhaul',
    })

    expect(plan.summary.preservedDataSources).toEqual(
      expect.arrayContaining([
        expect.stringContaining('service records'),
        expect.stringContaining('booking'),
        expect.stringContaining('business contact'),
        expect.stringContaining('published status'),
      ])
    )
  })
})
