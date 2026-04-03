import type { Metadata } from 'next'
import { getGalleryImages } from '@/app/_lib/gallery'
import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import GalleryGrid from '@/app/gallery/gallery-grid'

export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'A fast masonry photo gallery of moments, textures, and small observations by 7amdi.',
  alternates: {
    canonical: '/gallery',
  },
  openGraph: {
    title: 'Gallery',
    description: 'A fast masonry photo gallery of moments, textures, and small observations by 7amdi.',
    url: '/gallery',
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: 'Gallery',
        description:
          'A fast masonry photo gallery of moments, textures, and small observations by 7amdi.',
      }),
    ],
  },
  twitter: {
    title: 'Gallery',
    description: 'A fast masonry photo gallery of moments, textures, and small observations by 7amdi.',
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: 'Gallery',
        description:
          'A fast masonry photo gallery of moments, textures, and small observations by 7amdi.',
      }),
    ],
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
  const latestLabel = formatDate(images[0]?.date)
  const gridImages = images.map((image) => ({
    src: image.src,
    width: image.width,
    height: image.height,
    blurDataURL: image.blurDataURL,
    title: humanizeFilename(image.filename),
    dateText: formatDate(image.date),
  }))

  return (
    <section className='space-y-6 sm:space-y-7'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='space-y-2'>
          <div className='text-[11px] uppercase tracking-[0.3em] text-rurikon-400'>
            gallery
          </div>
          <h1 className='m-0 font-semibold tracking-normal text-[1.78rem] leading-[1.04] text-rurikon-700 sm:text-[2.08rem]'>
            Quiet frames.
          </h1>
          <p className='max-w-prose text-sm leading-6 text-rurikon-500 sm:text-[15px]'>
            Minimal masonry view. Tap any image to open it full screen.
          </p>
        </div>
        <div className='flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-rurikon-400'>
          <span>{countLabel}</span>
          {latestLabel ? <span>latest {latestLabel}</span> : null}
        </div>
      </header>

      {images.length === 0 ? (
        <div className='rounded-[1.5rem] border border-dashed border-[var(--color-rurikon-border)] px-5 py-8 text-sm text-rurikon-400'>
          no images yet. add files to <code>public/gallery</code>.
        </div>
      ) : (
        <GalleryGrid images={gridImages} />
      )}
    </section>
  )
}
