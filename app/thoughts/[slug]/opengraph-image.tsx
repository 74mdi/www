import { notFound } from 'next/navigation'
import {
  createSimpleOgImage,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from '@/app/_lib/og-image'

// export const alt = 'Article'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

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

export default async function OpenGraphImage(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const { metadata } = await import(`../_articles/${params.slug}.mdx`)

  if (metadata.draft) {
    notFound()
  }

  const title = resolveArticleTitle(metadata.title, params.slug)
  const description =
    metadata.description?.trim() &&
    metadata.description.trim().toLowerCase() !== 'qaiik'
      ? metadata.description.trim()
      : 'salam ana 7amdi'

  return createSimpleOgImage({ title, description })
}
