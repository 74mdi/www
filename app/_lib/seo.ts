import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import {
  SITE_AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SOCIAL_URLS,
  toAbsoluteUrl,
} from '@/app/_lib/site'

type BreadcrumbItem = {
  name: string
  path: string
}

type ArticleStructuredDataOptions = {
  slug: string
  title: string
  description: string
  date?: string
}

export function parseDottedDate(value?: string): string | undefined {
  if (!value) return undefined

  const match = value.match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
  if (!match) return undefined

  const [, year, month, day] = match
  return `${year}-${month}-${day}`
}

export function buildWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: toAbsoluteUrl('/'),
    description: SITE_DESCRIPTION,
  }
}

export function buildProfilePageStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: toAbsoluteUrl('/'),
    mainEntity: {
      '@type': 'Person',
      name: SITE_AUTHOR_NAME,
      url: toAbsoluteUrl('/'),
      description: SITE_DESCRIPTION,
      sameAs: SITE_SOCIAL_URLS,
    },
  }
}

export function buildBreadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  }
}

export function buildArticleStructuredData({
  slug,
  title,
  description,
  date,
}: ArticleStructuredDataOptions) {
  const publishedDate = parseDottedDate(date)
  const articlePath = `/thoughts/${slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: toAbsoluteUrl(articlePath),
    mainEntityOfPage: toAbsoluteUrl(articlePath),
    image: [toAbsoluteUrl(buildOgImageUrl({
      variant: 'thoughts',
      title,
      description,
    }))],
    articleSection: 'Thoughts',
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR_NAME,
      url: toAbsoluteUrl('/'),
      sameAs: SITE_SOCIAL_URLS,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_AUTHOR_NAME,
      url: toAbsoluteUrl('/'),
    },
    ...(publishedDate
      ? {
          datePublished: publishedDate,
          dateModified: publishedDate,
        }
      : {}),
  }
}
