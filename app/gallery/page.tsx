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
    <section className='space-y-8'>
      <header className='relative isolate overflow-hidden rounded-[2rem] border border-[var(--color-rurikon-border)] bg-[linear-gradient(145deg,var(--surface-overlay),var(--surface-soft))] px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:px-7 sm:py-8'>
        <div className='absolute -right-16 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,var(--color-rurikon-200),transparent_70%)] opacity-60' />
        <div className='absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,var(--color-rurikon-100),transparent_70%)] opacity-70' />

        <div className='relative flex flex-wrap items-start justify-between gap-6'>
          <div className='max-w-xl space-y-4'>
            <div className='text-[11px] uppercase tracking-[0.32em] text-rurikon-400'>
              gallery
            </div>
            <div className='space-y-3'>
              <h1 className='m-0 max-w-lg text-balance font-semibold tracking-normal text-[1.95rem] leading-[1.02] text-rurikon-700 sm:text-[2.55rem]'>
                A wall of moments, stacked like scraps on a studio board.
              </h1>
              <p className='max-w-prose text-sm leading-6 text-rurikon-500 sm:text-[15px]'>
                A fast, mobile-first masonry feed for photos I wanted to keep:
                textures, streets, quiet scenes, and the little frames that would
                otherwise disappear.
              </p>
            </div>

            <div className='flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-rurikon-500'>
              <span className='rounded-full border border-[var(--color-rurikon-border)] bg-[var(--background)]/85 px-3 py-1.5'>
                {countLabel}
              </span>
              {latestLabel ? (
                <span className='rounded-full border border-[var(--color-rurikon-border)] bg-[var(--background)]/85 px-3 py-1.5'>
                  latest {latestLabel}
                </span>
              ) : null}
              <span className='rounded-full border border-[var(--color-rurikon-border)] bg-[var(--background)]/85 px-3 py-1.5'>
                masonry layout
              </span>
            </div>
          </div>

          <div className='grid min-w-[14rem] gap-3 text-xs text-rurikon-500 sm:grid-cols-2 sm:text-sm'>
            <div className='rounded-[1.25rem] border border-[var(--color-rurikon-border)] bg-[var(--background)]/82 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.05)]'>
              <div className='text-[10px] uppercase tracking-[0.24em] text-rurikon-400'>
                browsing
              </div>
              <p className='mt-2 text-sm leading-5 text-rurikon-600 sm:text-[15px]'>
                tap any frame for a full-screen preview with keyboard navigation
                on desktop.
              </p>
            </div>
            <div className='rounded-[1.25rem] border border-[var(--color-rurikon-border)] bg-[var(--background)]/82 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.05)]'>
              <div className='text-[10px] uppercase tracking-[0.24em] text-rurikon-400'>
                performance
              </div>
              <p className='mt-2 text-sm leading-5 text-rurikon-600 sm:text-[15px]'>
                light image quality, progressive loading, and a layout that stays
                smooth on phones.
              </p>
            </div>
          </div>
        </div>
      </header>

      {images.length === 0 ? (
        <div className='rounded-[1.5rem] border border-dashed border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/75 px-5 py-8 text-sm text-rurikon-400'>
          no images yet. add files to <code>public/gallery</code>.
        </div>
      ) : (
        <GalleryGrid images={gridImages} />
      )}
    </section>
  )
}
