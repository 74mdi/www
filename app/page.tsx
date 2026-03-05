import type { Metadata } from 'next'

import { AboutAge } from '@/components/about-age'
import { LastFmStatus } from '@/components/lastfm-status'

export const metadata: Metadata = {
  title: {
    absolute: '7amdi',
  },
}

export default function Page() {
  return (
    <section className='max-w-[46rem] bg-black px-6 py-7 font-mono text-[1.85rem] leading-[1.45] text-zinc-100 sm:px-8 sm:py-9'>
      <h1 className='m-0 text-[1em] font-normal tracking-wide text-zinc-100'>
        M07AM3D_
      </h1>

      <LastFmStatus />

      <nav className='mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[1em] text-zinc-100'>
        <a
          href='https://x.com/74mdi'
          target='_blank'
          rel='noopener noreferrer'
          className='decoration-zinc-500 underline-offset-2 hover:underline'
        >
          x
        </a>
        <a
          href='https://github.com/74mdi'
          target='_blank'
          rel='noopener noreferrer'
          className='decoration-zinc-500 underline-offset-2 hover:underline'
        >
          github
        </a>
        <span>discord</span>
        <a
          href='https://www.tiktok.com/@74mdi'
          target='_blank'
          rel='noopener noreferrer'
          className='decoration-zinc-500 underline-offset-2 hover:underline'
        >
          tiktok
        </a>
        <span>email</span>
      </nav>

      <AboutAge />
    </section>
  )
}
