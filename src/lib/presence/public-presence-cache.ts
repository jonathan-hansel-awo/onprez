import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const PUBLIC_PRESENCE_REVALIDATE_SECONDS = 300
const PUBLIC_PRESENCE_CACHE_KEY = 'public-presence-by-handle'

export function normalizePublicPresenceHandle(handle?: string | null): string {
  return typeof handle === 'string' ? handle.trim().toLowerCase() : ''
}

export function publicPresenceCacheTag(handle: string): string {
  return `public-presence:${normalizePublicPresenceHandle(handle)}`
}

async function loadPublishedPresence(handle: string) {
  const business = await prisma.business.findUnique({
    where: { slug: handle },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      website: true,
      socialLinks: true,
      settings: true,
      branding: true,
      isPublished: true,
      logoUrl: true,
      coverImageUrl: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
    },
  })

  if (!business?.isPublished) return null

  const [page, reviewSummary] = await Promise.all([
    prisma.page.findFirst({
      where: {
        businessId: business.id,
        slug: 'home',
        isPublished: true,
      },
      select: {
        id: true,
        content: true,
        publishedContent: true,
        isPublished: true,
      },
    }),
    prisma.review.aggregate({
      where: { businessId: business.id, isPublished: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  if (!page?.isPublished) return null

  return {
    business,
    page,
    reviewSummary: {
      averageRating: reviewSummary._avg.rating,
      reviewCount: reviewSummary._count.rating,
    },
  }
}

export async function getCachedPublicPresence(handle: string) {
  const normalizedHandle = normalizePublicPresenceHandle(handle)
  if (!normalizedHandle) return null

  return unstable_cache(
    () => loadPublishedPresence(normalizedHandle),
    [PUBLIC_PRESENCE_CACHE_KEY, normalizedHandle],
    {
      revalidate: PUBLIC_PRESENCE_REVALIDATE_SECONDS,
      tags: [publicPresenceCacheTag(normalizedHandle)],
    }
  )()
}

function reportInvalidationFailure(
  operation: 'tag' | 'path',
  normalizedHandle: string,
  error: unknown
) {
  if (process.env.NODE_ENV === 'test') return

  console.error(`Failed to revalidate public presence ${operation} for ${normalizedHandle}:`, error)
}

export function invalidatePublicPresence(handle?: string | null) {
  const normalizedHandle = normalizePublicPresenceHandle(handle)
  if (!normalizedHandle) return

  try {
    revalidateTag(publicPresenceCacheTag(normalizedHandle), { expire: 0 })
  } catch (error) {
    reportInvalidationFailure('tag', normalizedHandle, error)
  }

  try {
    revalidatePath(`/${normalizedHandle}`)
  } catch (error) {
    reportInvalidationFailure('path', normalizedHandle, error)
  }
}
