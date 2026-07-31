import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  getCachedPublicPresence,
  invalidatePublicPresence,
  normalizePublicPresenceHandle,
  PUBLIC_PRESENCE_REVALIDATE_SECONDS,
  publicPresenceCacheTag,
} from '@/lib/presence/public-presence-cache'

jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((callback: () => Promise<unknown>) => callback),
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: { findUnique: jest.fn() },
    page: { findFirst: jest.fn() },
    review: { aggregate: jest.fn() },
  },
}))

const mockUnstableCache = jest.mocked(unstable_cache)
const mockRevalidatePath = jest.mocked(revalidatePath)
const mockRevalidateTag = jest.mocked(revalidateTag)
const mockFindBusiness = jest.mocked(prisma.business.findUnique)
const mockFindPage = jest.mocked(prisma.page.findFirst)
const mockAggregateReviews = jest.mocked(prisma.review.aggregate)

const publishedBusiness = {
  id: 'business-1',
  name: 'Aurelia Wellness House',
  slug: 'aurelia-wellness',
  phone: null,
  email: 'hello@example.test',
  address: null,
  city: 'Cambridge',
  state: null,
  zipCode: null,
  country: 'GB',
  website: null,
  socialLinks: {},
  settings: {},
  branding: {},
  isPublished: true,
  logoUrl: null,
  coverImageUrl: null,
  description: 'A calm wellness studio.',
  seoTitle: null,
  seoDescription: null,
  seoKeywords: [],
}

describe('public presence cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('normalises handles and creates a stable handle-scoped tag', () => {
    expect(normalizePublicPresenceHandle('  Aurelia-Wellness  ')).toBe('aurelia-wellness')
    expect(publicPresenceCacheTag(' Aurelia-Wellness ')).toBe(
      'public-presence:aurelia-wellness'
    )
  })

  it('caches the published shell and rating summary by normalised handle', async () => {
    mockFindBusiness.mockResolvedValue(publishedBusiness as never)
    mockFindPage.mockResolvedValue({
      id: 'page-1',
      content: [],
      publishedContent: [{ id: 'hero-1', type: 'HERO' }],
      isPublished: true,
    } as never)
    mockAggregateReviews.mockResolvedValue({
      _avg: { rating: 4.8 },
      _count: { rating: 12 },
    } as never)

    const result = await getCachedPublicPresence(' Aurelia-Wellness ')

    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ['public-presence-by-handle', 'aurelia-wellness'],
      {
        revalidate: PUBLIC_PRESENCE_REVALIDATE_SECONDS,
        tags: ['public-presence:aurelia-wellness'],
      }
    )
    expect(mockFindBusiness).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'aurelia-wellness' } })
    )
    expect(result).toEqual(
      expect.objectContaining({
        business: expect.objectContaining({ slug: 'aurelia-wellness' }),
        reviewSummary: { averageRating: 4.8, reviewCount: 12 },
      })
    )
  })

  it('does not query page content or reviews for an unpublished business', async () => {
    mockFindBusiness.mockResolvedValue({ ...publishedBusiness, isPublished: false } as never)

    await expect(getCachedPublicPresence('aurelia-wellness')).resolves.toBeNull()
    expect(mockFindPage).not.toHaveBeenCalled()
    expect(mockAggregateReviews).not.toHaveBeenCalled()
  })

  it('expires both the data tag and the rendered handle route after a live mutation', () => {
    invalidatePublicPresence(' Aurelia-Wellness ')

    expect(mockRevalidateTag).toHaveBeenCalledWith('public-presence:aurelia-wellness', {
      expire: 0,
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/aurelia-wellness')
  })
})
