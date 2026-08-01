import { buildMissingPresenceMetadata, buildPresenceMetadata } from '../presence-metadata'

const business = {
  name: 'Heavenly Pamper Palace',
  slug: 'heavenly-pamper-palace',
  description: 'Massage and beauty treatments in Cambridge.',
  city: 'Cambridge',
  country: 'GB',
  seoTitle: 'Heavenly Pamper Palace | Massage in Cambridge',
  seoDescription: 'Book massage and beauty treatments in Cambridge.',
  seoKeywords: ['massage Cambridge', 'beauty treatments'],
  coverImageUrl: 'https://images.example.test/heavenly-cover.jpg',
  logoUrl: null,
  allowSearchEngineIndexing: true,
}

describe('presence metadata', () => {
  it('builds canonical, social, and indexable metadata for an opted-in published business', () => {
    const metadata = buildPresenceMetadata(business, 'https://onprez.com')

    expect(metadata.title).toBe('Heavenly Pamper Palace | Massage in Cambridge')
    expect(metadata.alternates).toEqual({
      canonical: 'https://onprez.com/heavenly-pamper-palace',
    })
    expect(metadata.robots).toEqual({
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    })
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        url: 'https://onprez.com/heavenly-pamper-palace',
        type: 'website',
      })
    )
  })

  it('keeps the canonical page available but emits noindex when the owner opts out', () => {
    const metadata = buildPresenceMetadata(
      { ...business, allowSearchEngineIndexing: false },
      'https://onprez.com'
    )

    expect(metadata.alternates).toEqual({
      canonical: 'https://onprez.com/heavenly-pamper-palace',
    })
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    })
  })

  it('marks missing or unpublished pages as noindex', () => {
    expect(buildMissingPresenceMetadata()).toEqual(
      expect.objectContaining({ robots: { index: false, follow: false } })
    )
  })
})
