import { getAppUrl } from '@/lib/utils/get-app-url'
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/admin/'],
      },
    ],
    sitemap: `${getAppUrl()}/sitemap.xml`,
  }
}
