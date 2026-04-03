export const SITE_NAME = '7amdi'
export const SITE_DESCRIPTION = 'salam ana 7amdi'
export const SITE_DOMAIN = '7amdi.vercel.app'
export const LEGACY_SITE_NAME = 'qaiik'
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

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return `https://${production.replace(/\/+$/, '')}`

  const preview = process.env.VERCEL_URL?.trim()
  if (preview) return `https://${preview.replace(/\/+$/, '')}`

  return `https://${SITE_DOMAIN}`
}
