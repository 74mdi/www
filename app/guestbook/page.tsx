import type { Metadata } from 'next'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import GuestbookClient from '@/app/guestbook/guestbook-client'

export const metadata: Metadata = {
  title: 'Guestbook',
  description: 'Sign the guestbook with Discord, GitHub, or Google.',
  alternates: {
    canonical: '/guestbook',
  },
  openGraph: {
    title: 'Guestbook',
    description: 'Sign the guestbook with Discord, GitHub, or Google.',
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: 'Guestbook',
        description: 'Sign the guestbook with Discord, GitHub, or Google.',
      }),
    ],
  },
  twitter: {
    title: 'Guestbook',
    description: 'Sign the guestbook with Discord, GitHub, or Google.',
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: 'Guestbook',
        description: 'Sign the guestbook with Discord, GitHub, or Google.',
      }),
    ],
  },
}

export default function GuestbookPage() {
  return (
    <section className='space-y-6'>
      <header className='space-y-2'>
        <h1 className='m-0 text-[1.55rem] leading-[1.15] sm:text-[1.78rem] sm:leading-[1.12] font-semibold tracking-normal text-rurikon-700'>
          Guestbook
        </h1>
        <p className='max-w-prose text-rurikon-400'>
          khlili msg wla ktb aya haja qidqbqmofyigqvchkcvqyie
        </p>
      </header>

      <GuestbookClient />
    </section>
  )
}
