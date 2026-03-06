'use client'

import dynamic from 'next/dynamic'

const LastFmStatus = dynamic(
  () => import('@/components/lastfm-status').then((module) => module.LastFmStatus),
  {
    ssr: false,
    loading: () => (
      <section className='mt-4'>
        <p className='m-0 text-rurikon-400'>Loading Last.fm status...</p>
      </section>
    ),
  },
)

export function HomeLastFm() {
  return <LastFmStatus />
}
