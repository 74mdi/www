import type { Metadata } from 'next'

import { AboutAge } from '@/components/about-age'
import { LastFmStatus } from '@/components/lastfm-status'

export const metadata: Metadata = {
  title: {
    absolute: '7amdi',
  },
}

export default function Page() {
  const nowMs = Date.now()

  return (
    <section className='rounded-xs bg-[var(--surface-raised)] px-5 py-6 sm:px-7 sm:py-7'>
      <h1 className='m-0 font-semibold text-[1.62rem] leading-[1.13] sm:text-[1.95rem] sm:leading-[1.08] text-rurikon-700 text-balance'>
        7amdi
      </h1>

      <LastFmStatus />

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

      <AboutAge initialNowMs={nowMs} />
    </section>
  )
}
