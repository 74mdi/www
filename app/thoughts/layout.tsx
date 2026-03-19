import 'katex/dist/katex.min.css'
import type { Metadata } from 'next'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'

export const metadata: Metadata = {
  openGraph: {
    images: [
      buildOgImageUrl({
        variant: 'thoughts',
        title: 'Thoughts',
        description: 'salam ana 7amdi',
      }),
    ],
  },
  twitter: {
    images: [
      buildOgImageUrl({
        variant: 'thoughts',
        title: 'Thoughts',
        description: 'salam ana 7amdi',
      }),
    ],
  },
}

export default function ThoughtsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
