import type { Metadata } from 'next'
import Image from 'next/image'

import { getGalleryImages } from '@/app/_lib/gallery'

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

type MetaRowProps = {
  label: string
  value?: string
}

function MetaRow({ label, value }: MetaRowProps) {
  if (!value) return null
  return (
    <div className='flex items-baseline justify-between gap-3 text-xs text-rurikon-500'>
      <dt className='text-rurikon-400'>{label}</dt>
      <dd className='text-right text-rurikon-600'>{value}</dd>
    </div>
  )
}

export default async function GalleryPage() {
  const images = await getGalleryImages()

  return (
    <section className='space-y-6'>
      <header className='space-y-2'>
        <h1 className='m-0 inline-block whitespace-nowrap break-normal font-semibold tracking-normal text-[1.62rem] leading-[1.13] sm:text-[1.95rem] sm:leading-[1.08] text-rurikon-700'>
          gallery
        </h1>
        <p className='text-sm text-rurikon-500'>
          drop images into <code>public/gallery</code> and this page will pick up
          the metadata automatically.
        </p>
      </header>

      {images.length === 0 ? (
        <p className='text-sm text-rurikon-400'>
          no images yet. add files to <code>public/gallery</code>.
        </p>
      ) : (
        <ul className='grid gap-8 sm:grid-cols-2'>
          {images.map((image, index) => {
            const title = humanizeFilename(image.filename)
            const settings = [image.aperture, image.shutter, image.iso]
              .filter(Boolean)
              .join(' | ')
            return (
              <li key={image.src} className='space-y-3'>
                <div className='border border-rurikon-border bg-[var(--frame-background)] p-3'>
                  <Image
                    src={image.src}
                    alt={title}
                    width={image.width}
                    height={image.height}
                    sizes='(min-width: 640px) 50vw, 100vw'
                    quality={82}
                    priority={index < 2}
                    className='h-auto w-full'
                  />
                </div>
                <div className='space-y-2'>
                  <div className='text-sm text-rurikon-600'>{title}</div>
                  <dl className='space-y-1'>
                    <MetaRow label='date' value={formatDate(image.date)} />
                    <MetaRow label='camera' value={image.camera} />
                    <MetaRow label='lens' value={image.lens} />
                    <MetaRow label='settings' value={settings || undefined} />
                    <MetaRow label='location' value={image.location} />
                    <MetaRow label='size' value={image.fileSize} />
                    <MetaRow label='dimensions' value={image.dimensions} />
                  </dl>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
