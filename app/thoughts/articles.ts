import { promises as fs } from 'fs'
import path from 'path'

import { isSitePlaceholder } from '@/app/_lib/site'

type ThoughtMetadata = {
  title?: string
  description?: string
  date?: string
  draft?: boolean
}

export type ThoughtArticle = {
  slug: string
  title: string
  description: string
  date: string
  sort: number
}

const articlesDirectory = path.join(
  process.cwd(),
  'app',
  'thoughts',
  '_articles',
)

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(' ')
}

function resolveArticleTitle(rawTitle: string | undefined, slug: string): string {
  const title = rawTitle?.trim()
  if (isSitePlaceholder(title)) {
    return slugToTitle(slug)
  }
  return title ?? slugToTitle(slug)
}

export async function getThoughtArticles(): Promise<ThoughtArticle[]> {
  const articles = await fs.readdir(articlesDirectory)

  const items: ThoughtArticle[] = []
  for (const article of articles) {
    if (!article.endsWith('.mdx')) continue

    const articleModule = (await import('./_articles/' + article)) as {
      metadata?: ThoughtMetadata
    }

    if (!articleModule.metadata) {
      throw new Error('Missing `metadata` in ' + article)
    }
    if (articleModule.metadata.draft) continue

    const slug = article.replace(/\.mdx$/, '')
    const normalizedDate = articleModule.metadata.date || '-'

    items.push({
      slug,
      title: resolveArticleTitle(articleModule.metadata.title, slug),
      description: articleModule.metadata.description || '',
      date: normalizedDate,
      sort: Number(normalizedDate.replaceAll('.', '')) || 0,
    })
  }

  items.sort((a, b) => b.sort - a.sort)
  return items
}
