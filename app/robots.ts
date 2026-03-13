import type { MetadataRoute } from 'next'

function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/+$/, '')
  }

  return 'https://qaiik.replit.app'
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/projects', '/projects/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
