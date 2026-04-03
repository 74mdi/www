import type { Metadata } from 'next'
import Link from 'next/link'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import { SITE_DESCRIPTION, SITE_NAME } from '@/app/_lib/site'
import {
  buildProfilePageStructuredData,
  buildWebsiteStructuredData,
} from '@/app/_lib/seo'
import { AboutAge } from '@/components/about-age'
import { HomeLastFm } from '@/components/home-lastfm'
import StructuredData from '@/components/structured-data'

const INITIAL_NOW_MS = Date.now()

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
      }),
    ],
  },
  twitter: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
      }),
    ],
  },
}

export default function Page() {
  return (
    <section className='px-0 py-0'>
      <StructuredData
        data={[buildWebsiteStructuredData(), buildProfilePageStructuredData()]}
      />
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

      <p className='mt-5 max-w-prose text-rurikon-500'>
        personal website dyl 7amdi(ana). kankteb(kdob) ikhan ela web development, design,
        performance, wchi experiments, wkan posti notes and photos.
      </p>

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
