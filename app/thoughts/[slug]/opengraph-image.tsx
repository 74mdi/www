import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'

// export const alt = 'Article'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const fonts = [
  {
    name: 'Inter',
    data: readFileSync(
      path.join(process.cwd(), 'app', '_fonts', 'Inter-Medium.ttf'),
    ),
    style: 'normal' as const,
    weight: 600 as const,
  },
  {
    name: 'GeistPixel-Square',
    data: readFileSync(
      path.join(process.cwd(), 'app', '_fonts', 'GeistPixel-Square.ttf'),
    ),
    style: 'normal' as const,
    weight: 600 as const,
  },
]

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
  const description = metadata.description?.trim() || ''

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '60px 80px 80px',
        background: '#f5f7fa',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          fontSize: 82,
          fontWeight: 600,
          color: '#0e0f11',
          lineHeight: 1.4,
          maxWidth: 1000,
          textWrap: 'pretty',
          letterSpacing: -0.6,
          fontFamily: 'GeistPixel-Square',
        }}
      >
        {title + ' →'}
      </div>
      <div
        style={{
          fontSize: 42,
          color: '#4a515b',
          marginTop: 36,
          maxWidth: 900,
          lineHeight: 1.5,
          letterSpacing: -0.2,
          fontFamily: 'GeistPixel-Square',
        }}
      >
        {description}
      </div>
    </div>,
    {
      ...size,
      fonts,
    },
  )
}
