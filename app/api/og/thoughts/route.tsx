import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }
type ThemeMode = 'light' | 'dark'

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

function pickTheme(
  searchParams: URLSearchParams,
  fallback: ThemeMode = 'dark',
): ThemeMode {
  const value = searchParams.get('theme')
  if (value === 'light' || value === 'dark') {
    return value
  }
  return fallback
}

function normalizeHexColor(input: string): string | null {
  const value = input.trim()
  if (!value) return null

  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase()
  }

  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return `#${value.toLowerCase()}`
  }

  return null
}

function pickAccent(searchParams: URLSearchParams, fallback: string): string {
  const raw = searchParams.get('accent')
  if (!raw) return fallback

  return normalizeHexColor(raw) ?? fallback
}

function hexToRgba(hex: string, alpha: number): string {
  const safe = normalizeHexColor(hex) ?? '#d4d4d4'
  const r = Number.parseInt(safe.slice(1, 3), 16)
  const g = Number.parseInt(safe.slice(3, 5), 16)
  const b = Number.parseInt(safe.slice(5, 7), 16)
  const clamped = Math.max(0, Math.min(1, alpha))

  return `rgba(${r}, ${g}, ${b}, ${clamped})`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const theme = pickTheme(searchParams, 'dark')
  const accent = pickAccent(searchParams, theme === 'dark' ? '#d4d4d4' : '#171717')
  const title = pickText(searchParams, 'title', 'Thoughts', 120)
  const description = pickText(searchParams, 'description', 'salam ana 7amdi', 220)
  const site = pickText(searchParams, 'site', 'qaiik.vercel.app/thoughts', 80)
  const tag = pickText(searchParams, 'tag', 'essays and notes', 80)
  const section = pickText(searchParams, 'section', 'thoughts', 50)

  const colors =
    theme === 'dark'
      ? {
          background:
            'linear-gradient(140deg, #111111 0%, #0a0a0a 42%, #161616 100%)',
          text: '#f5f5f5',
          title: '#ffffff',
          description: '#d4d4d4',
          subdued: '#a3a3a3',
          accent,
          glow: hexToRgba(accent, 0.18),
          border: '#2a2a2a',
        }
      : {
          background:
            'linear-gradient(140deg, #fcfcfc 0%, #f4f4f4 42%, #ffffff 100%)',
          text: '#111111',
          title: '#0a0a0a',
          description: '#363636',
          subdued: '#595959',
          accent,
          glow: hexToRgba(accent, 0.14),
          border: '#dadada',
        }

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
          background: colors.background,
          color: colors.text,
          position: 'relative',
          border: `1px solid ${colors.border}`,
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
            background: `radial-gradient(circle at center, ${colors.glow} 0%, #ffffff00 68%)`,
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
              color: colors.subdued,
            }}
          >
            {section}
          </span>
          <span
            style={{
              width: 48,
              height: 1,
              background: colors.accent,
            }}
          />
          <span
            style={{
              fontSize: 22,
              letterSpacing: 2.8,
              color: colors.subdued,
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
              color: colors.title,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 33,
              lineHeight: 1.28,
              color: colors.description,
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
            color: colors.subdued,
          }}
        >
          <span>{site}</span>
          <span style={{ letterSpacing: 2.6, textTransform: 'uppercase' }}>
            {tag}
          </span>
        </div>
      </div>
    ),
    SIZE,
  )
}
