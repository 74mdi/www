type OgVariant = 'default' | 'thoughts'
type OgTheme = 'light' | 'dark'

type BuildOgImageUrlOptions = {
  variant?: OgVariant
  title?: string
  description?: string
  site?: string
  tag?: string
  section?: string
  theme?: OgTheme
  accent?: string
}

function normalizeText(value: string | undefined, maxLength: number): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function buildOgImageUrl({
  variant = 'default',
  title,
  description,
  site,
  tag,
  section,
  theme,
  accent,
}: BuildOgImageUrlOptions): string {
  const params = new URLSearchParams()

  const normalizedTitle = normalizeText(title, 120)
  const normalizedDescription = normalizeText(description, 220)
  const normalizedSite = normalizeText(site, 80)
  const normalizedTag = normalizeText(tag, 80)
  const normalizedSection = normalizeText(section, 50)
  const normalizedAccent = normalizeText(accent, 16)
  const normalizedTheme = theme === 'dark' || theme === 'light' ? theme : ''

  if (normalizedTitle) {
    params.set('title', normalizedTitle)
  }

  if (normalizedDescription) {
    params.set('description', normalizedDescription)
  }

  if (normalizedSite) {
    params.set('site', normalizedSite)
  }

  if (normalizedTag) {
    params.set('tag', normalizedTag)
  }

  if (normalizedSection) {
    params.set('section', normalizedSection)
  }

  if (normalizedTheme) {
    params.set('theme', normalizedTheme)
  }

  if (normalizedAccent) {
    params.set('accent', normalizedAccent)
  }

  const pathname = variant === 'thoughts' ? '/api/og/thoughts' : '/api/og'
  const query = params.toString()

  return query ? `${pathname}?${query}` : pathname
}
