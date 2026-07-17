import {
  getPresenceTemplate,
  presenceTemplateCatalogue,
  templateCategories,
} from '@/data/presence-template-catalogue'

describe('presence template catalogue', () => {
  it('contains one template for every public category', () => {
    const categories = new Set(presenceTemplateCatalogue.map(template => template.category))

    for (const category of templateCategories.filter(category => category !== 'ALL')) {
      expect(categories.has(category)).toBe(true)
    }
  })

  it('uses unique slugs and clearly fictional demo business names', () => {
    const slugs = presenceTemplateCatalogue.map(template => template.slug)

    expect(new Set(slugs).size).toBe(slugs.length)
    expect(
      presenceTemplateCatalogue.every(template => template.preview.businessName.length > 0)
    ).toBe(true)
    expect(
      presenceTemplateCatalogue.some(template =>
        template.preview.businessName.toLowerCase().includes('hanseljonathan')
      )
    ).toBe(false)
  })

  it('resolves templates by slug', () => {
    const template = presenceTemplateCatalogue[0]

    expect(getPresenceTemplate(template.slug)).toEqual(template)
    expect(getPresenceTemplate('missing-template')).toBeUndefined()
  })
})
