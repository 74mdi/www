import fs from 'node:fs/promises'
import path from 'node:path'

import sharp, { type Metadata } from 'sharp'
import exifReader from 'exif-reader'
import { cache } from 'react'

type ExifRational =
  | number
  | {
      numerator: number
      denominator: number
    }

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
  date?: Date
  camera?: string
  lens?: string
  focalLength?: string
  aperture?: string
  shutter?: string
  iso?: string
  exposureBias?: string
  location?: string
  dimensions?: string
  fileSize?: string
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

function toNumber(value: ExifRational | undefined): number | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'object') {
    if (value.denominator === 0) return null
    return value.numerator / value.denominator
  }
  return null
}

function formatExposureTime(value: ExifRational | undefined): string | undefined {
  const exposure = toNumber(value)
  if (!exposure) return undefined
  if (exposure >= 1) return `${exposure.toFixed(1)}s`
  const denominator = Math.round(1 / exposure)
  return `1/${denominator}s`
}

function formatAperture(value: ExifRational | undefined): string | undefined {
  const aperture = toNumber(value)
  if (!aperture) return undefined
  return `f/${aperture.toFixed(1)}`
}

function formatFocalLength(value: ExifRational | undefined): string | undefined {
  const focal = toNumber(value)
  if (!focal) return undefined
  return `${Math.round(focal)}mm`
}

function formatExposureBias(value: ExifRational | undefined): string | undefined {
  const bias = toNumber(value)
  if (bias === null) return undefined
  return `${bias > 0 ? '+' : ''}${bias.toFixed(1)} EV`
}

function formatIso(value: unknown): string | undefined {
  if (typeof value === 'number') return `ISO ${Math.round(value)}`
  if (Array.isArray(value) && typeof value[0] === 'number') {
    return `ISO ${Math.round(value[0])}`
  }
  return undefined
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function parseExifDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value
  if (typeof value !== 'string') return undefined
  const normalized = value.replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2})/, '$1-$2-$3')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

function toDegrees(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (!Array.isArray(value) || value.length < 3) return null
  const [deg, min, sec] = value as ExifRational[]
  const degValue = toNumber(deg)
  const minValue = toNumber(min)
  const secValue = toNumber(sec)
  if (degValue === null || minValue === null || secValue === null) return null
  return degValue + minValue / 60 + secValue / 3600
}

function formatLocation(gps: Record<string, unknown> | undefined): string | undefined {
  if (!gps) return undefined
  const lat = toDegrees(gps.GPSLatitude)
  const lon = toDegrees(gps.GPSLongitude)
  if (lat === null || lon === null) return undefined
  const latRef = gps.GPSLatitudeRef === 'S' ? -1 : 1
  const lonRef = gps.GPSLongitudeRef === 'W' ? -1 : 1
  const latValue = lat * latRef
  const lonValue = lon * lonRef
  return `${latValue.toFixed(5)}, ${lonValue.toFixed(5)}`
}

function formatCamera(make: unknown, model: unknown): string | undefined {
  const pieces = [make, model]
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
  return pieces.length ? pieces.join(' ') : undefined
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

  const images = await Promise.all(
    files.map(async (filename) => {
      const filePath = path.join(GALLERY_DIR, filename)
      let metadata: Metadata
      try {
        metadata = await sharp(filePath).metadata()
      } catch {
        return null
      }

      const stats = await fs.stat(filePath)
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

      const imageTags = exifData?.image ?? {}
      const exifTags = exifData?.exif ?? {}
      const gpsTags = exifData?.gps ?? {}

      const date =
        parseExifDate(exifTags.DateTimeOriginal) ??
        parseExifDate(exifTags.CreateDate) ??
        parseExifDate(imageTags.DateTime)

      const camera = formatCamera(imageTags.Make, imageTags.Model)
      const lens = typeof exifTags.LensModel === 'string' ? exifTags.LensModel : undefined

      return {
        src: `/gallery/${filename}`,
        filename,
        width,
        height,
        date,
        camera,
        lens,
        focalLength: formatFocalLength(exifTags.FocalLength as ExifRational | undefined),
        aperture: formatAperture(exifTags.FNumber as ExifRational | undefined),
        shutter: formatExposureTime(exifTags.ExposureTime as ExifRational | undefined),
        iso: formatIso(exifTags.ISOSpeedRatings),
        exposureBias: formatExposureBias(
          exifTags.ExposureBiasValue as ExifRational | undefined,
        ),
        location: formatLocation(gpsTags),
        dimensions: `${width}x${height}`,
        fileSize: formatBytes(stats.size),
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
