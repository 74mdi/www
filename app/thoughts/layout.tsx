import 'katex/dist/katex.min.css'
import type { Metadata } from 'next'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import { SITE_DESCRIPTION } from '@/app/_lib/site'

export const metadata: Metadata = {
  openGraph: {
    images: [
      buildOgImageUrl({
        variant: 'thoughts',
        title: 'Thoughts',
        description: SITE_DESCRIPTION,
      }),
    ],
  },
  twitter: {
    images: [
      buildOgImageUrl({
        variant: 'thoughts',
        title: 'Thoughts',
        description: SITE_DESCRIPTION,
      }),
    ],
  },
}

export default function ThoughtsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
