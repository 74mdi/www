import type { MetadataRoute } from 'next'

function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/+$/, '')
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) {
    return `https://${production.replace(/\/+$/, '')}`
  }

  const preview = process.env.VERCEL_URL?.trim()
  if (preview) {
    return `https://${preview.replace(/\/+$/, '')}`
  }

  return 'https://qaiik.vercel.app'
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

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
          '/quran',
          '/quran/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
