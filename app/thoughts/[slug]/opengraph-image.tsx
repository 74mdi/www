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
        position: 'relative',
        padding: '64px',
        background: 'linear-gradient(135deg, #ffffff 0%, #eef1f5 100%)',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '38px',
          right: '48px',
          width: '100px',
          height: '100px',
          borderRadius: '9999px',
          background: '#111111',
        }}
      />
      <div
        style={{
          fontSize: 26,
          fontWeight: 500,
          color: '#475569',
          lineHeight: 1.2,
        }}
      >
        thought by 7amdi
      </div>
      <div
        style={{
          fontSize: 76,
          fontWeight: 600,
          color: '#020617',
          lineHeight: 1.06,
          maxWidth: 1000,
          letterSpacing: -1.4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 34,
          color: '#334155',
          maxWidth: 960,
          lineHeight: 1.26,
          letterSpacing: -0.2,
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
