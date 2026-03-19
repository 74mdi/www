import type { Metadata } from 'next'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import SiftliClient from './siftli-client'

export const metadata: Metadata = {
  title: 'SIFTLI',
  description: 'siftli msg wela aya haja ghir mn site :)',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'SIFTLI',
    description: 'siftli msg wela aya haja ghir mn site :)',
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: 'SIFTLI',
        description: 'siftli msg wela aya haja ghir mn site :)',
      }),
    ],
  },
  twitter: {
    title: 'SIFTLI',
    description: 'siftli msg wela aya haja ghir mn site :)',
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: 'SIFTLI',
        description: 'siftli msg wela aya haja ghir mn site :)',
      }),
    ],
  },
}

export default function Page() {
  return <SiftliClient />
}
