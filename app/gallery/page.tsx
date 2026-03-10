import type { Metadata } from 'next'
import { getGalleryImages } from '@/app/_lib/gallery'
import GalleryGrid from '@/app/gallery/gallery-grid'

export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: {
    absolute: 'Gallery',
  },
  description: 'Photo gallery with metadata and capture details.',
  alternates: {
    canonical: '/gallery',
  },
  openGraph: {
    title: 'Gallery',
    description: 'Photo gallery with metadata and capture details.',
    images: ['/opengraph-image'],
  },
  twitter: {
    title: 'Gallery',
    description: 'Photo gallery with metadata and capture details.',
    images: ['/opengraph-image'],
  },
}

function humanizeFilename(filename: string) {
  const base = filename.replace(/\.[^/.]+$/, '')
  const spaced = base.replace(/[-_]+/g, ' ').trim()
  return spaced.length ? spaced : filename
}

function formatDate(value?: Date) {
  if (!value) return undefined
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(value)
}

export default async function GalleryPage() {
  const images = await getGalleryImages()
  const countLabel = images.length === 1 ? '1 photo' : `${images.length} photos`
  const gridImages = images.map((image) => ({
    src: image.src,
    width: image.width,
    height: image.height,
    blurDataURL: image.blurDataURL,
    title: humanizeFilename(image.filename),
    dateText: formatDate(image.date),
  }))

  return (
    <section className='space-y-8'>
      <header className='space-y-3'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div className='space-y-2'>
            <div className='text-[11px] uppercase tracking-[0.32em] text-rurikon-400'>
              gallery
            </div>
            <h1 className='m-0 inline-block break-normal font-semibold tracking-normal text-[1.62rem] leading-[1.13] sm:text-[1.95rem] sm:leading-[1.08] text-rurikon-700'>
              moments
            </h1>
          </div>
          <div className='text-xs text-rurikon-400'>{countLabel}</div>
        </div>
        <p className='text-sm text-rurikon-500'>
          salam hna kanhet aya haja wsf ;0
        </p>
      </header>

      {images.length === 0 ? (
        <p className='text-sm text-rurikon-400'>
          no images yet. add files to <code>public/gallery</code>.
        </p>
      ) : (
        <GalleryGrid images={gridImages} />
      )}
    </section>
  )
}
