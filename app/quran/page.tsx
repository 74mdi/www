import type { Metadata } from 'next'
import { Noto_Naskh_Arabic } from 'next/font/google'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import QuranPageClient from '@/app/quran/components/quran-page-client'

const arabic = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quran',
  description: 'Minimal Quran page with streaming reciters, search, and verse reading.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/quran',
  },
  openGraph: {
    title: 'Quran',
    description: 'Minimal Quran page with streaming reciters, search, and verse reading.',
    images: [
      buildOgImageUrl({
        variant: 'thoughts',
        title: 'Quran',
        description: 'Minimal Quran page with streaming reciters, search, and verse reading.',
      }),
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quran',
    description: 'Minimal Quran page with streaming reciters, search, and verse reading.',
    images: [
      buildOgImageUrl({
        variant: 'thoughts',
        title: 'Quran',
        description: 'Minimal Quran page with streaming reciters, search, and verse reading.',
      }),
    ],
  },
}

export default function Page() {
  return <QuranPageClient arabicFontClassName={arabic.className} />
}
