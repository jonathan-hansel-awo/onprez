import assert from 'node:assert/strict'
import { buildPresenceMetadata } from '../src/lib/seo/presence-metadata'
import { buildPresenceStructuredData } from '../src/lib/seo/presence-structured-data'
import type { PageSection } from '../src/types/page-sections'

const cases = [
  {
    business: {
      id: 'seo-heavenly',
      name: 'Heavenly Pamper Palace',
      slug: 'heavenly-pamper-palace',
      category: 'SPA',
      description: 'Massage and beauty treatments in Cambridge.',
      phone: '+44 1223 555 010',
      email: 'hello@heavenly.example',
      website: 'https://heavenly.example',
      address: '12 Rose Crescent',
      city: 'Cambridge',
      state: 'Cambridgeshire',
      zipCode: 'CB2 3LL',
      country: 'GB',
      latitude: 52.2053,
      longitude: 0.1218,
      logoUrl: 'https://images.example.test/heavenly-logo.png',
      coverImageUrl: 'https://images.example.test/heavenly-cover.jpg',
      socialLinks: { instagram: 'https://instagram.com/heavenlypamper' },
      seoTitle: 'Heavenly Pamper Palace | Cambridge Massage',
      seoDescription: 'Book massage and beauty treatments in Cambridge.',
      seoKeywords: ['massage Cambridge'],
      allowSearchEngineIndexing: true,
    },
    services: [
      {
        id: 'pregnancy-massage',
        name: 'Pregnancy Massage',
        description: 'A gentle, tailored treatment.',
        imageUrl: 'https://images.example.test/pregnancy-massage.jpg',
        price: '70',
        priceType: 'FIXED',
        priceRangeMin: null,
        priceRangeMax: null,
        currency: 'GBP',
      },
    ],
    businessHours: [{ dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' }],
    reviewSummary: { averageRating: 4.9, reviewCount: 18 },
    sections: [
      {
        id: 'faq-heavenly',
        type: 'FAQ',
        order: 4,
        isVisible: true,
        data: {
          title: 'Common questions',
          items: [
            {
              id: 'faq-1',
              question: 'Do you offer pregnancy massage?',
              answer: 'Yes, after the first trimester with suitable adaptations.',
            },
          ],
        },
      },
    ] as PageSection[],
  },
  {
    business: {
      id: 'seo-northstar',
      name: 'Northstar Business Advisory',
      slug: 'northstar-advisory',
      category: 'CONSULTING',
      description: 'Practical operations consulting for independent UK businesses.',
      phone: null,
      email: 'hello@northstar.example',
      website: 'https://northstar.example',
      address: null,
      city: 'Ely',
      state: 'Cambridgeshire',
      zipCode: null,
      country: 'GB',
      latitude: null,
      longitude: null,
      logoUrl: null,
      coverImageUrl: null,
      socialLinks: {},
      seoTitle: null,
      seoDescription: null,
      seoKeywords: [],
      allowSearchEngineIndexing: false,
    },
    services: [
      {
        id: 'strategy-session',
        name: 'Strategy Session',
        description: 'A focused 90-minute planning session.',
        imageUrl: null,
        price: '120',
        priceType: 'FIXED',
        priceRangeMin: null,
        priceRangeMax: null,
        currency: 'GBP',
      },
    ],
    businessHours: [],
    reviewSummary: { averageRating: null, reviewCount: 0 },
    sections: [] as PageSection[],
  },
]

for (const item of cases) {
  const metadata = buildPresenceMetadata(item.business, 'https://onprez.com')
  const structuredData = buildPresenceStructuredData({
    baseUrl: 'https://onprez.com',
    business: item.business,
    services: item.services,
    businessHours: item.businessHours,
    reviewSummary: item.reviewSummary,
    sections: item.sections,
  })

  assert.equal(
    metadata.alternates?.canonical,
    `https://onprez.com/${item.business.slug}`,
    `${item.business.slug}: canonical URL`
  )
  assert.equal(
    typeof metadata.description === 'string' && metadata.description.length > 0,
    true,
    `${item.business.slug}: description`
  )
  assert.equal(
    structuredData['@graph'].some(node => node['@id']?.toString().endsWith('#business')),
    true,
    `${item.business.slug}: business entity`
  )
  assert.equal(
    structuredData['@graph'].some(node => node['@type'] === 'BreadcrumbList'),
    true,
    `${item.business.slug}: breadcrumb entity`
  )
}

const optedOutMetadata = buildPresenceMetadata(cases[1].business, 'https://onprez.com')
assert.deepEqual(optedOutMetadata.robots, {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
})

console.warn(`Validated presence SEO for ${cases.length} realistic published businesses.`)
