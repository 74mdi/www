import { promises as fs } from 'fs'
import path from 'path'
import cn from 'clsx'
import { notFound } from 'next/navigation'

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(' ')
}

function resolveArticleTitle(rawTitle: string | undefined, slug: string): string {
  const title = rawTitle?.trim()
  if (!title || title.toLowerCase() === 'qaiik') {
    return slugToTitle(slug)
  }
  return title
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

  return (
    <div
      className={cn(metadata.chinese && 'text-justify font-zh')}
      lang={metadata.chinese ? 'zh-Hans' : 'en'}
    >
      <MDXContent />
    </div>
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
  const description = articleModule.metadata?.description?.trim()

  return {
    title,
    description:
      description && description.toLowerCase() !== 'qaiik'
        ? description
        : `Thought by qaiik: ${title}`,
    alternates: {
      canonical: `/thoughts/${params.slug}`,
    },
    openGraph: {
      type: 'article',
      url: `/thoughts/${params.slug}`,
      title,
      description:
        description && description.toLowerCase() !== 'qaiik'
          ? description
          : `Thought by qaiik: ${title}`,
      images: [`/thoughts/${params.slug}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description:
        description && description.toLowerCase() !== 'qaiik'
          ? description
          : `Thought by qaiik: ${title}`,
      images: [`/thoughts/${params.slug}/opengraph-image`],
    },
  }
}
