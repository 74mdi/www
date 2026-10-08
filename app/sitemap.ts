import type { MetadataRoute } from 'next'

import { getCanonicalSiteUrl } from '@/app/_lib/site'
import { getThoughtArticles } from '@/app/thoughts/articles'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getCanonicalSiteUrl()
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
      url: `${siteUrl}/guestbook`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/mh`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/top`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  const thoughtRoutes: MetadataRoute.Sitemap = thoughtArticles.map((article) => ({
    url: `${siteUrl}/thoughts/${article.slug}`,
    lastModified: article.lastModified ? new Date(article.lastModified) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...thoughtRoutes]
}
