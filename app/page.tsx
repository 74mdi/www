import type { Metadata } from 'next'

import { AboutAge } from '@/components/about-age'
import { HomeLastFm } from '@/components/home-lastfm'

const INITIAL_NOW_MS = Date.now()

export const metadata: Metadata = {
  title: {
    absolute: '7amdi',
  },
  description:
    'salam ana 7amdi. personal website with thoughts, experiments, and SIFTLI.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '7amdi',
    description:
      'salam ana 7amdi. personal website with thoughts, experiments, and SIFTLI.',
    images: ['/opengraph-image'],
  },
  twitter: {
    title: '7amdi',
    description:
      'salam ana 7amdi. personal website with thoughts, experiments, and SIFTLI.',
    images: ['/opengraph-image'],
  },
}

export default function Page() {
  return (
    <section className='px-0 py-0'>
      <h1
        className='m-0 inline-block whitespace-nowrap break-normal font-semibold tracking-normal text-[1.62rem] leading-[1.13] sm:text-[1.95rem] sm:leading-[1.08] text-rurikon-700'
        style={{
          fontFeatureSettings:
            "'cpsp' 1, 'cv01', 'cv03', 'cv04', 'calt', 'ss03', 'liga', 'ordn' 0",
          letterSpacing: '0',
          wordSpacing: '0',
        }}
      >
        7amdi
      </h1>

      <HomeLastFm />

      <div className='mt-7 flex flex-wrap items-center gap-x-5 gap-y-2'>
        <a
          href='https://x.com/74mdi'
          target='_blank'
          rel='noopener noreferrer'
          className='break-words decoration-from-font underline underline-offset-2 decoration-rurikon-300 hover:decoration-rurikon-600 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-offset-1 focus-visible:outline-dotted'
        >
          x
        </a>
        <a
          href='https://github.com/74mdi'
          target='_blank'
          rel='noopener noreferrer'
          className='break-words decoration-from-font underline underline-offset-2 decoration-rurikon-300 hover:decoration-rurikon-600 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-offset-1 focus-visible:outline-dotted'
        >
          github
        </a>
        <span className='text-rurikon-400'>discord</span>
        <a
          href='https://www.tiktok.com/@74mdi'
          target='_blank'
          rel='noopener noreferrer'
          className='break-words decoration-from-font underline underline-offset-2 decoration-rurikon-300 hover:decoration-rurikon-600 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-offset-1 focus-visible:outline-dotted'
        >
          tiktok
        </a>
        <span className='text-rurikon-400'>email</span>
      </div>

      <AboutAge initialNowMs={INITIAL_NOW_MS} />
    </section>
  )
}
