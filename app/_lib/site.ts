export const SITE_NAME = '7amdi'
export const SITE_DESCRIPTION = 'salam ana 7amdi'
export const SITE_DOMAIN = '7amdi.vercel.app'
export const LEGACY_SITE_NAME = '7amdi'
export const LEGACY_SITE_DOMAIN = '7amdi.vercel.app'
export const SITE_AUTHOR_NAME = '7amdi'
export const SITE_SOCIAL_URLS = [
  'https://x.com/74mdi',
  'https://github.com/74mdi',
  'https://www.tiktok.com/@74mdi',
]
export const SITE_KEYWORDS = [
  '7amdi',
  'hamdi',
  '74mdi',
  'mohamed',
  'ana7amdi',
  '7amdi911',
  'personal website',
  'blog',
  'portfolio',
]

export function isSitePlaceholder(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return true

  return normalized === SITE_NAME.toLowerCase() || normalized === LEGACY_SITE_NAME
}

function normalizeSiteUrl(candidate: string | undefined): string | null {
  const trimmed = candidate?.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return url.toString().replace(/\/+$/, '')
  } catch {
    return null
  }
}

function isLegacySiteUrl(candidate: string | null): boolean {
  if (!candidate) return false

  try {
    const url = new URL(candidate)
    return url.hostname === LEGACY_SITE_DOMAIN
  } catch {
    return false
  }
}

export function getSiteUrl(): string {
  const explicit = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
  if (explicit && !isLegacySiteUrl(explicit)) return explicit

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const normalizedProduction = normalizeSiteUrl(production)
  if (normalizedProduction && !isLegacySiteUrl(normalizedProduction)) {
    return normalizedProduction
  }

  const preview = process.env.VERCEL_URL?.trim()
  const normalizedPreview = normalizeSiteUrl(preview)
  if (normalizedPreview && !isLegacySiteUrl(normalizedPreview)) {
    return normalizedPreview
  }

  return `https://${SITE_DOMAIN}`
}

export function toAbsoluteUrl(pathname = '/'): string {
  return new URL(pathname, `${getSiteUrl()}/`).toString()
}
