import type { Metadata } from 'next'

import SiftliClient from './siftli-client'

export const metadata: Metadata = {
  title: 'SIFTLI',
  description: 'salam ana 7amdi',
  openGraph: {
    title: 'SIFTLI',
    description: 'salam ana 7amdi',
    images: ['/siftli/opengraph-image'],
  },
  twitter: {
    title: 'SIFTLI',
    description: 'salam ana 7amdi',
    images: ['/siftli/opengraph-image'],
  },
}

export default function Page() {
  return <SiftliClient />
}
