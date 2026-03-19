import type { Metadata } from 'next'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import OgCreatorClient from '@/app/ogc/ogc-client'

export const metadata: Metadata = {
  title: 'OG Creator',
  description: 'Create customizable Open Graph images powered by @vercel/og.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'OG Creator',
    description: 'Create customizable Open Graph images powered by @vercel/og.',
    images: [
      buildOgImageUrl({
        title: 'OG Creator',
        description: 'Create customizable Open Graph images powered by @vercel/og.',
      }),
    ],
  },
  twitter: {
    title: 'OG Creator',
    description: 'Create customizable Open Graph images powered by @vercel/og.',
    images: [
      buildOgImageUrl({
        title: 'OG Creator',
        description: 'Create customizable Open Graph images powered by @vercel/og.',
      }),
    ],
  },
}

export default function OgCreatorPage() {
  return (
    <section className='space-y-6'>
      <header className='space-y-2'>
        <p className='text-[11px] uppercase tracking-[0.28em] text-rurikon-400'>
          Hidden Tool
        </p>
        <h1 className='m-0 text-[1.55rem] leading-[1.15] sm:text-[1.78rem] sm:leading-[1.12] font-semibold tracking-normal text-rurikon-700'>
          OGC
        </h1>
        <p className='max-w-prose text-rurikon-400'>
          Build and export OG image URLs for any website with live preview.
        </p>
      </header>

      <OgCreatorClient />
    </section>
  )
}
