import type { MetadataRoute } from 'next'

import { getCanonicalSiteUrl } from '@/app/_lib/site'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/projects',
          '/projects/',
          '/siftli',
          '/siftli/',
          '/ogc',
          '/ogc/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
