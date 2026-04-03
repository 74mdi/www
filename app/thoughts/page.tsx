import type { Metadata } from 'next'
import Link from 'next/link'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import { SITE_DESCRIPTION } from '@/app/_lib/site'
import { getThoughtArticles } from '@/app/thoughts/articles'

export const metadata: Metadata = {
  title: 'Thoughts',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/thoughts',
  },
  openGraph: {
    title: 'Thoughts',
    description: SITE_DESCRIPTION,
    url: '/thoughts',
    images: [
      buildOgImageUrl({
        variant: 'thoughts',
        title: 'Thoughts',
        description: SITE_DESCRIPTION,
      }),
    ],
  },
  twitter: {
    title: 'Thoughts',
    description: SITE_DESCRIPTION,
    images: [
      buildOgImageUrl({
        variant: 'thoughts',
        title: 'Thoughts',
        description: SITE_DESCRIPTION,
      }),
    ],
  },
}

export default async function Page() {
  const items = await getThoughtArticles()

  return (
    <section className='space-y-6'>
      <header className='space-y-2'>
        <h1 className='m-0 text-[1.55rem] leading-[1.15] sm:text-[1.78rem] sm:leading-[1.12] font-semibold tracking-normal text-rurikon-700'>
          Thoughts
        </h1>
        <p className='max-w-prose text-rurikon-400'>
          notes and essays on programming, design, performance, and internet
          experiments.
        </p>
      </header>

      {items.length === 0 ? (
        <p className='text-rurikon-300'>All posts are in draft.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.slug} className='font-medium'>
              <Link
                href={`/thoughts/${item.slug}`}
                className='group flex gap-1 -mx-2 px-2 justify-between items-center focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-dotted focus-visible:text-rurikon-600'
                draggable={false}
              >
                <span className='block text-rurikon-500 group-hover:text-rurikon-700 group-focus-visible:text-rurikon-700'>
                  {item.title}
                </span>
                <span className='text-sm dot-leaders flex-1 text-rurikon-100 font-normal group-hover:text-rurikon-500 group-focus-visible:text-rurikon-500 transition-colors group-hover:transition-none leading-none' />
                <time className='block text-rurikon-200 tabular-nums font-normal tracking-tighter group-hover:text-rurikon-500 group-focus-visible:text-rurikon-500 transition-colors group-hover:transition-none self-start'>
                  {item.date}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
