import type { MetadataRoute } from 'next'

import { getThoughtArticles } from '@/app/thoughts/articles'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()
  const thoughtArticles = await getThoughtArticles()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${siteUrl}/thoughts`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/gallery`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/siftli`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  const thoughtRoutes: MetadataRoute.Sitemap = thoughtArticles.map((article) => ({
    url: `${siteUrl}/thoughts/${article.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...thoughtRoutes]
}
