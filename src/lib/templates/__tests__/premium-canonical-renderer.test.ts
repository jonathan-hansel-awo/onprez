import { BusinessCategory } from '@prisma/client'
import { presenceTemplateCatalogue } from '@/data/presence-template-catalogue'
import { createCanonicalPresencePageContent } from '@/lib/templates/canonical-template-engine'

describe('premium canonical renderer contract', () => {
  it.each(presenceTemplateCatalogue.map(template => [template.slug, template.name]))(
    'gives %s a complete premium art direction',
    slug => {
      const page = createCanonicalPresencePageContent(
        'Example Business',
        BusinessCategory.OTHER,
        slug,
        { mode: 'preview' }
      )
      const navbar = page.sections.find(section => section.type === 'NAVBAR')
      const hero = page.sections.find(section => section.type === 'HERO')
      const about = page.sections.find(section => section.type === 'ABOUT')
      const contact = page.sections.find(section => section.type === 'CONTACT')

      expect(page.templateVersion).toBe(2)
      expect(page.theme).toMatchObject({
        spacing: 'relaxed',
        backgroundType: expect.stringMatching(/solid|gradient|pattern/),
      })
      expect(navbar).toMatchObject({
        data: {
          variant: expect.stringMatching(/standard|floating|editorial/),
          monogram: 'E',
        },
      })
      expect(hero).toMatchObject({
        data: {
          variant: expect.any(String),
          imageTreatment: expect.any(String),
          floatingCard: expect.objectContaining({ title: expect.any(String) }),
          meta: expect.arrayContaining([expect.any(String)]),
          decorativeText: expect.any(String),
        },
      })
      expect(about).toMatchObject({
        data: {
          variant: expect.any(String),
          quote: expect.any(String),
          stats: expect.arrayContaining([
            expect.objectContaining({ value: expect.any(String), label: expect.any(String) }),
          ]),
          imageTreatment: expect.any(String),
        },
      })
      expect(contact).toMatchObject({
        data: {
          layout: expect.stringMatching(/panel|immersive/),
          eyebrow: expect.any(String),
          description: expect.any(String),
          ctaText: expect.any(String),
          ctaLink: '#book',
        },
      })
    }
  )

  it('keeps flagship templates visually distinct rather than palette-swapped', () => {
    const heavenly = createCanonicalPresencePageContent(
      'Heavenly Pamper Palace',
      BusinessCategory.SPA,
      'heavenly-pamper-palace',
      { mode: 'preview' }
    )
    const editorial = createCanonicalPresencePageContent(
      'Hanselisky',
      BusinessCategory.BEAUTY,
      'editorial-beauty',
      { mode: 'preview' }
    )
    const heavenlyHero = heavenly.sections.find(section => section.type === 'HERO')
    const editorialHero = editorial.sections.find(section => section.type === 'HERO')

    expect(heavenlyHero).toMatchObject({
      data: { variant: 'luxury', imageTreatment: 'arch', decorativeText: 'HEAVENLY' },
    })
    expect(editorialHero).toMatchObject({
      data: { variant: 'editorial', imageTreatment: 'collage', decorativeText: 'FORM' },
    })
    expect(heavenlyHero?.data).not.toEqual(editorialHero?.data)
  })
})
