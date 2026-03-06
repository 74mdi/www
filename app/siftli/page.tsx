import type { Metadata } from 'next'

import SiftliClient from './siftli-client'

export const metadata: Metadata = {
  title: 'SIFTLI',
  description: 'siftli msg wela aya haja ghir mn site :)',
  openGraph: {
    title: 'SIFTLI',
    description: 'siftli msg wela aya haja ghir mn site :)',
    images: ['/siftli/opengraph-image'],
  },
  twitter: {
    title: 'SIFTLI',
    description: 'siftli msg wela aya haja ghir mn site :)',
    images: ['/siftli/opengraph-image'],
  },
}

export default function Page() {
  return <SiftliClient />
}
