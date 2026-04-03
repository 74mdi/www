import { ImageResponse } from 'next/og'

import { SITE_DESCRIPTION, SITE_DOMAIN, SITE_NAME } from '@/app/_lib/site'

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
  fallback: ThemeMode = 'light',
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
  const safe = normalizeHexColor(hex) ?? '#171717'
  const r = Number.parseInt(safe.slice(1, 3), 16)
  const g = Number.parseInt(safe.slice(3, 5), 16)
  const b = Number.parseInt(safe.slice(5, 7), 16)
  const clamped = Math.max(0, Math.min(1, alpha))

  return `rgba(${r}, ${g}, ${b}, ${clamped})`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const theme = pickTheme(searchParams, 'light')
  const accent = pickAccent(searchParams, theme === 'dark' ? '#fafafa' : '#171717')
  const title = pickText(searchParams, 'title', SITE_NAME, 120)
  const description = pickText(searchParams, 'description', SITE_DESCRIPTION, 220)
  const site = pickText(searchParams, 'site', SITE_DOMAIN, 80)
  const tag = pickText(searchParams, 'tag', 'personal notes', 80)

  const colors =
    theme === 'dark'
      ? {
          background:
            'radial-gradient(circle at 22% 0%, #1f1f1f 0%, #0a0a0a 45%, #111111 100%)',
          text: '#f5f5f5',
          title: '#ffffff',
          description: '#d4d4d4',
          subdued: '#d4d4d4',
          border: '#2b2b2b',
          grid: hexToRgba(accent, 0.28),
          accent,
        }
      : {
          background:
            'radial-gradient(circle at 22% 0%, #f2f2f2 0%, #ffffff 45%, #fafafa 100%)',
          text: '#0f0f0f',
          title: '#0a0a0a',
          description: '#404040',
          subdued: '#525252',
          border: '#e5e5e5',
          grid: hexToRgba(accent, 0.2),
          accent,
        }

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
          background: colors.background,
          color: colors.text,
          border: `1px solid ${colors.border}`,
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
              `linear-gradient(to right, transparent 0, transparent calc(100% - 1px), ${colors.grid} calc(100% - 1px), ${colors.grid} 100%), linear-gradient(to bottom, transparent 0, transparent calc(100% - 1px), ${colors.grid} calc(100% - 1px), ${colors.grid} 100%)`,
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
            color: colors.subdued,
          }}
        >
          <span>{SITE_NAME}</span>
          <span
            style={{
              width: 42,
              height: 1,
              background: colors.accent,
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
              color: colors.title,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.26,
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
            color: colors.subdued,
            fontSize: 24,
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
