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
]

const SITE_NAME = 'qaiik'

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

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '66px 74px',
        background: '#ffffff',
        fontFamily: 'Inter',
      }}
    >
      <h1
        style={{
          margin: 0,
          maxWidth: '86%',
          fontSize: 86,
          fontWeight: 500,
          lineHeight: 1.06,
          color: '#111111',
          letterSpacing: -1.1,
          fontFamily: 'serif',
        }}
      >
        {title}
      </h1>

      <p
        style={{
          fontSize: 34,
          color: '#2f2f2f',
          maxWidth: '86%',
          lineHeight: 1.24,
          letterSpacing: -0.1,
          margin: 0,
        }}
      >
        {description}
      </p>

      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 20,
        }}
      >
        <span
          style={{
            fontSize: 28,
            lineHeight: 1,
            color: '#5a5a5a',
            letterSpacing: 0.2,
          }}
        >
          {SITE_NAME}
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts,
    },
  )
}
