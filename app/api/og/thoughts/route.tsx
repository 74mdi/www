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

  const title = pickText(searchParams, 'title', 'Thoughts', 120)
  const description = pickText(searchParams, 'description', 'salam ana 7amdi', 220)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '58px 66px',
          background:
            'linear-gradient(140deg, #111111 0%, #0a0a0a 42%, #161616 100%)',
          color: '#f5f5f5',
          position: 'relative',
          border: '1px solid #2a2a2a',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 310,
            height: 310,
            borderRadius: '50%',
            right: -48,
            top: -70,
            opacity: 0.17,
            background:
              'radial-gradient(circle at center, #ffffff 0%, #ffffff00 68%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 24,
              letterSpacing: 4.2,
              textTransform: 'uppercase',
              color: '#d4d4d4',
            }}
          >
            thoughts
          </span>
          <span
            style={{
              width: 48,
              height: 1,
              background: '#737373',
            }}
          />
          <span
            style={{
              fontSize: 22,
              letterSpacing: 2.8,
              color: '#a3a3a3',
            }}
          >
            qaiik
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxWidth: 1030,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: -1.7,
              color: '#ffffff',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 33,
              lineHeight: 1.28,
              color: '#d4d4d4',
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
            fontSize: 23,
            color: '#a3a3a3',
          }}
        >
          <span>qaiik.vercel.app/thoughts</span>
          <span style={{ letterSpacing: 2.6, textTransform: 'uppercase' }}>
            essays and notes
          </span>
        </div>
      </div>
    ),
    SIZE,
  )
}
