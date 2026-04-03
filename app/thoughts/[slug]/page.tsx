import { promises as fs } from 'fs'
import path from 'path'
import cn from 'clsx'
import { notFound } from 'next/navigation'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import { isSitePlaceholder, SITE_DESCRIPTION } from '@/app/_lib/site'
import {
  buildArticleStructuredData,
  buildBreadcrumbStructuredData,
} from '@/app/_lib/seo'
import StructuredData from '@/components/structured-data'

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

function resolveArticleDescription(rawDescription: string | undefined): string {
  const description = rawDescription?.trim()
  return description && !isSitePlaceholder(description)
    ? description
    : SITE_DESCRIPTION
}

export default async function Page(props: {
  params: Promise<{
    slug: string
  }>
}) {
  const params = await props.params
  const { default: MDXContent, metadata } = await import(
    '../_articles/' + `${params.slug}.mdx`
  )

  if (metadata.draft) {
    notFound()
  }

  const title = resolveArticleTitle(metadata?.title, params.slug)
  const description = resolveArticleDescription(metadata?.description)

  return (
    <>
      <StructuredData
        data={[
          buildBreadcrumbStructuredData([
            { name: '7amdi', path: '/' },
            { name: 'Thoughts', path: '/thoughts' },
            { name: title, path: `/thoughts/${params.slug}` },
          ]),
          buildArticleStructuredData({
            slug: params.slug,
            title,
            description,
            date: metadata?.date,
          }),
        ]}
      />
      <div
        className={cn(metadata.chinese && 'text-justify font-zh')}
        lang={metadata.chinese ? 'zh-Hans' : 'en'}
      >
        <MDXContent />
      </div>
    </>
  )
}

export async function generateStaticParams() {
  const articles = await fs.readdir(
    path.join(process.cwd(), 'app', 'thoughts', '_articles'),
  )

  const slugs: { params: { slug: string } }[] = []
  for (const name of articles) {
    if (!name.endsWith('.mdx')) continue

    const articleModule = await import('../_articles/' + name)
    if (articleModule.metadata?.draft) continue

    slugs.push({
      params: {
        slug: name.replace(/\.mdx$/, ''),
      },
    })
  }

  return slugs
}

export async function generateMetadata(props: {
  params: Promise<{
    slug: string
  }>
}) {
  const params = await props.params
  const articleModule = await import('../_articles/' + `${params.slug}.mdx`)

  if (articleModule.metadata?.draft) {
    notFound()
  }

  const title = resolveArticleTitle(articleModule.metadata?.title, params.slug)
  const normalizedDescription = resolveArticleDescription(
    articleModule.metadata?.description,
  )

  return {
    title,
    description: normalizedDescription,
    alternates: {
      canonical: `/thoughts/${params.slug}`,
    },
    openGraph: {
      type: 'article',
      url: `/thoughts/${params.slug}`,
      title,
      description: normalizedDescription,
      images: [
        buildOgImageUrl({
          variant: 'thoughts',
          title,
          description: normalizedDescription,
        }),
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: normalizedDescription,
      images: [
        buildOgImageUrl({
          variant: 'thoughts',
          title,
          description: normalizedDescription,
        }),
      ],
    },
  }
}
