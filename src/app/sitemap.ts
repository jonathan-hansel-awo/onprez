import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getAppUrl } from '@/lib/utils/get-app-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-07-22'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-07-22'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date('2026-07-22'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]

  let presenceRoutes: MetadataRoute.Sitemap = []

  try {
    const businesses = await prisma.business.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    presenceRoutes = businesses.map(business => ({
      url: `${baseUrl}/${business.slug}`,
      lastModified: business.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch (error) {
    console.warn('Dynamic sitemap entries are temporarily unavailable.', error)
  }

  return [...staticRoutes, ...presenceRoutes]
}
