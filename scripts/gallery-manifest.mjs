import fs from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'
import exifReader from 'exif-reader'
import { getPlaiceholder } from 'plaiceholder'

const GALLERY_DIR = path.join(process.cwd(), 'public', 'gallery')
const MANIFEST_PATH = path.join(GALLERY_DIR, 'manifest.json')
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

const BLUR_LIMIT = Number(process.env.GALLERY_BLUR_LIMIT ?? 24)
const BLUR_SIZE = Number(process.env.GALLERY_BLUR_SIZE ?? 6)

function isImageFile(filename) {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase())
}

function parseExifDate(value) {
  if (value instanceof Date) return value
  if (typeof value !== 'string') return undefined
  const normalized = value.replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2})/, '$1-$2-$3')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

async function main() {
  let entries = []
  try {
    entries = await fs.readdir(GALLERY_DIR, { withFileTypes: true })
  } catch {
    console.error('Gallery directory not found:', GALLERY_DIR)
    process.exit(1)
  }

  const files = entries
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => entry.name)

  const images = []

  for (let index = 0; index < files.length; index += 1) {
    const filename = files[index]
    const filePath = path.join(GALLERY_DIR, filename)

    let metadata
    try {
      metadata = await sharp(filePath).metadata()
    } catch {
      continue
    }

    const width = metadata.width ?? 1
    const height = metadata.height ?? 1

    let date
    if (metadata.exif) {
      try {
        const exifData = exifReader(metadata.exif)
        const imageTags = exifData?.image ?? {}
        const exifTags = exifData?.exif ?? {}
        date =
          parseExifDate(exifTags.DateTimeOriginal) ??
          parseExifDate(exifTags.CreateDate) ??
          parseExifDate(imageTags.DateTime)
      } catch {
        date = undefined
      }
    }

    let blurDataURL
    if (index < BLUR_LIMIT) {
      try {
        const { base64 } = await getPlaiceholder(filePath, { size: BLUR_SIZE })
        blurDataURL = base64
      } catch {
        blurDataURL = undefined
      }
    }

    images.push({
      src: `/gallery/${filename}`,
      filename,
      width,
      height,
      blurDataURL,
      date: date ? date.toISOString() : undefined,
    })
  }

  images.sort((a, b) => {
    const dateScore = (a.date ? Date.parse(a.date) : 0) - (b.date ? Date.parse(b.date) : 0)
    if (dateScore !== 0) return dateScore
    return a.filename.localeCompare(b.filename)
  })

  const manifest = {
    generatedAt: new Date().toISOString(),
    blurLimit: BLUR_LIMIT,
    blurSize: BLUR_SIZE,
    images,
  }

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Wrote ${images.length} images to ${MANIFEST_PATH}`)
}

await main()
