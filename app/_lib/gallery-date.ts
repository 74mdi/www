const galleryDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

export function parseGalleryFilenameDate(candidate: string): Date | undefined {
  const filename = candidate.split('/').pop() ?? candidate
  const match = filename.match(/^(\d{2})(\d{2})(\d{4})/)
  if (!match) return undefined

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return undefined
  }

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return undefined
  }

  const parsed = new Date(Date.UTC(year, month - 1, day, 12))
  if (Number.isNaN(parsed.getTime())) return undefined

  return parsed
}

export function formatGalleryDate(value?: Date): string | undefined {
  if (!value) return undefined
  return galleryDateFormatter.format(value)
}

export function getGalleryDateSortTime(
  value?: Date,
  fallbackCandidate?: string,
): number | null {
  const resolved = value ?? (fallbackCandidate ? parseGalleryFilenameDate(fallbackCandidate) : undefined)
  return resolved ? resolved.getTime() : null
}
