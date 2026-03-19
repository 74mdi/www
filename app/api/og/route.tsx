import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }

function pickText(
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
  maxLength: number,
): string {
  const value = searchParams.get(key)
  if (!value) return fallback

  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return fallback

  return normalized.slice(0, maxLength)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const title = pickText(searchParams, 'title', 'qaiik', 120)
  const description = pickText(
    searchParams,
    'description',
    'salam ana 7amdi. whadi personal website dyalii akankherbeq wsafiiii.',
    220,
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '62px 68px',
          background:
            'radial-gradient(circle at 22% 0%, #f2f2f2 0%, #ffffff 45%, #fafafa 100%)',
          color: '#0f0f0f',
          border: '1px solid #e5e5e5',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            opacity: 0.35,
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(to right, transparent 0, transparent calc(100% - 1px), #d4d4d4 calc(100% - 1px), #d4d4d4 100%), linear-gradient(to bottom, transparent 0, transparent calc(100% - 1px), #d4d4d4 calc(100% - 1px), #d4d4d4 100%)',
            backgroundSize: '100% 100%, 100% 100%',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 24,
            letterSpacing: 3.4,
            textTransform: 'uppercase',
            color: '#525252',
          }}
        >
          <span>qaiik</span>
          <span
            style={{
              width: 42,
              height: 1,
              background: '#a3a3a3',
            }}
          />
          <span style={{ letterSpacing: 2.2, fontSize: 20 }}>website</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            maxWidth: 1020,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 88,
              lineHeight: 1.04,
              letterSpacing: -2.1,
              color: '#0a0a0a',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.26,
              color: '#404040',
            }}
          >
            {description}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#525252',
            fontSize: 24,
          }}
        >
          <span>qaiik.vercel.app</span>
          <span style={{ letterSpacing: 2.6, textTransform: 'uppercase' }}>
            personal notes
          </span>
        </div>
      </div>
    ),
    SIZE,
  )
}
