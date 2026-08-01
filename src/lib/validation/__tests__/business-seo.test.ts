import { updateBusinessProfileSchema } from '../business'

describe('business SEO validation', () => {
  it('accepts owner-controlled indexing and bounded search metadata', () => {
    expect(
      updateBusinessProfileSchema.safeParse({
        seoTitle: 'Heavenly Pamper Palace | Cambridge Massage',
        seoDescription: 'Book restorative massage and beauty treatments in Cambridge.',
        seoKeywords: ['massage Cambridge', 'pregnancy massage'],
        allowSearchEngineIndexing: false,
      }).success
    ).toBe(true)
  })

  it('rejects non-boolean indexing values and overlong metadata', () => {
    expect(
      updateBusinessProfileSchema.safeParse({
        seoTitle: 'x'.repeat(61),
        allowSearchEngineIndexing: 'yes',
      }).success
    ).toBe(false)
  })
})
