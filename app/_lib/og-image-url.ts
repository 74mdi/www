type OgVariant = 'default' | 'thoughts'

type BuildOgImageUrlOptions = {
  variant?: OgVariant
  title?: string
  description?: string
}

function normalizeText(value: string | undefined, maxLength: number): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function buildOgImageUrl({
  variant = 'default',
  title,
  description,
}: BuildOgImageUrlOptions): string {
  const params = new URLSearchParams()

  const normalizedTitle = normalizeText(title, 120)
  const normalizedDescription = normalizeText(description, 220)

  if (normalizedTitle) {
    params.set('title', normalizedTitle)
  }

  if (normalizedDescription) {
    params.set('description', normalizedDescription)
  }

  const pathname = variant === 'thoughts' ? '/api/og/thoughts' : '/api/og'
  const query = params.toString()

  return query ? `${pathname}?${query}` : pathname
}
