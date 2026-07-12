import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getAppUrl } from '@/lib/utils/get-app-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl()

  // Static routes
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
    // Keep the static sitemap available during builds or transient database outages.
    console.warn('Dynamic sitemap entries are temporarily unavailable.', error)
  }

  return [...staticRoutes, ...presenceRoutes]
}
