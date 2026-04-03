import fs from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import {
  getGalleryDateSortTime,
  parseGalleryFilenameDate,
} from '@/app/_lib/gallery-date'

type GalleryManifestImage = {
  src: string
  filename: string
  width: number
  height: number
  blurDataURL?: string
  date?: string
}

type GalleryManifest = {
  generatedAt?: string
  blurLimit?: number
  blurSize?: number
  images: GalleryManifestImage[]
}

export type GalleryImage = {
  src: string
  filename: string
  width: number
  height: number
  blurDataURL: string | undefined
  date: Date | undefined
}

const MANIFEST_PATH = path.join(
  process.cwd(),
  'public',
  'gallery',
  'manifest.json',
)

function parseDate(value?: string, filename?: string): Date | undefined {
  const filenameDate = filename ? parseGalleryFilenameDate(filename) : undefined
  if (filenameDate) return filenameDate

  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

export const getGalleryImages = cache(async (): Promise<GalleryImage[]> => {
  let raw
  try {
    raw = await fs.readFile(MANIFEST_PATH, 'utf8')
  } catch {
    return []
  }

  let manifest: GalleryManifest
  try {
    manifest = JSON.parse(raw) as GalleryManifest
  } catch {
    return []
  }

  const images = (manifest.images ?? []).map((image) => ({
    src: image.src,
    filename: image.filename,
    width: image.width,
    height: image.height,
    blurDataURL: image.blurDataURL,
    date: parseDate(image.date, image.filename),
  }))

  images.sort((a, b) => {
    const aDate = getGalleryDateSortTime(a.date, a.filename)
    const bDate = getGalleryDateSortTime(b.date, b.filename)

    if (aDate === null && bDate === null) {
      return a.filename.localeCompare(b.filename)
    }

    if (aDate === null) return 1
    if (bDate === null) return -1

    const dateScore = aDate - bDate
    if (dateScore !== 0) return dateScore
    return a.filename.localeCompare(b.filename)
  })

  return images
})
