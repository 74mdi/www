'use client'

import dynamic from 'next/dynamic'

const LastFmStatus = dynamic(
  () =>
    import('@/components/lastfm-status').then((module) => module.LastFmStatus),
  {
    ssr: false,
    loading: () => <HomeLastFmFallback />,
  },
)

function HomeLastFmFallback() {
  return (
    <section className='mt-4'>
      <p className='m-0 text-rurikon-400'>Loading Last.fm status...</p>
    </section>
  )
}

export default function HomeLastFmDeferred() {
  return <LastFmStatus />
}
