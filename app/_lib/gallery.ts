import fs from 'node:fs/promises'
import path from 'node:path'

import sharp, { type Metadata } from 'sharp'
import exifReader from 'exif-reader'
import { getPlaiceholder } from 'plaiceholder'
import { cache } from 'react'

type ExifData = {
  image?: Record<string, unknown>
  exif?: Record<string, unknown>
  gps?: Record<string, unknown>
}

export type GalleryImage = {
  src: string
  filename: string
  width: number
  height: number
  blurDataURL: string | undefined
  date: Date | undefined
}

const GALLERY_DIR = path.join(process.cwd(), 'public', 'gallery')
const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.tif',
  '.tiff',
])

function isImageFile(filename: string) {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase())
}

function parseExifDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value
  if (typeof value !== 'string') return undefined
  const normalized = value.replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2})/, '$1-$2-$3')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

export const getGalleryImages = cache(async (): Promise<GalleryImage[]> => {
  let entries
  try {
    entries = await fs.readdir(GALLERY_DIR, { withFileTypes: true })
  } catch {
    return []
  }

  const files = entries
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => entry.name)

  const images: Array<GalleryImage | null> = await Promise.all(
    files.map(async (filename) => {
      const filePath = path.join(GALLERY_DIR, filename)
      let metadata: Metadata
      let blurDataURL: string | undefined
      let buffer: Buffer
      try {
        buffer = await fs.readFile(filePath)
        metadata = await sharp(buffer).metadata()
      } catch {
        return null
      }

      const width = metadata.width ?? 1
      const height = metadata.height ?? 1

      let exifData: ExifData | undefined
      if (metadata.exif) {
        try {
          exifData = exifReader(metadata.exif) as ExifData
        } catch {
          exifData = undefined
        }
      }

      try {
        const { base64 } = await getPlaiceholder(buffer, { size: 12 })
        blurDataURL = base64
      } catch {
        blurDataURL = undefined
      }

      const imageTags = exifData?.image ?? {}
      const exifTags = exifData?.exif ?? {}

      const date =
        parseExifDate(exifTags.DateTimeOriginal) ??
        parseExifDate(exifTags.CreateDate) ??
        parseExifDate(imageTags.DateTime)

      return {
        src: `/gallery/${filename}`,
        filename,
        width,
        height,
        blurDataURL,
        date,
      } satisfies GalleryImage
    }),
  )

  const normalized = images.filter((item): item is GalleryImage => Boolean(item))

  normalized.sort((a, b) => {
    const dateScore = (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)
    if (dateScore !== 0) return dateScore
    return a.filename.localeCompare(b.filename)
  })

  return normalized
})
