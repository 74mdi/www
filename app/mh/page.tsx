import type { Metadata } from 'next'
import Image from 'next/image'

import { getListeningHistory } from '@/app/_lib/lastfm-history'

export const metadata: Metadata = {
  title: 'Listening history',
  description: 'Recent tracks from Last.fm.',
  robots: { index: false, follow: false },
}

export default async function ListeningHistoryPage() {
  const tracks = await getListeningHistory()

  return (
    <section className='space-y-6'>
      <header className='space-y-2'>
        <h1 className='m-0 text-[1.55rem] leading-[1.15] font-semibold text-rurikon-700 sm:text-[1.78rem]'>
          Listening history
        </h1>
        <p className='text-rurikon-400'>Recent tracks from Last.fm.</p>
      </header>

      {tracks.length ? (
        <ol className='divide-y divide-[var(--color-rurikon-border)]'>
          {tracks.map((track, index) => (
            <li key={`${track.timestamp ?? 'live'}-${track.title}-${track.artist}`} className='flex items-center gap-3 py-3'>
              {track.cover ? (
                <Image
                  src={track.cover}
                  alt=''
                  width={48}
                  height={48}
                  sizes='48px'
                  quality={70}
                  priority={index < 4}
                  className='h-12 w-12 shrink-0 rounded-md object-cover'
                />
              ) : (
                <span aria-hidden='true' className='h-12 w-12 shrink-0 rounded-md bg-[var(--surface-soft)]' />
              )}
              <div className='min-w-0 flex-1'>
                <p className='truncate font-medium text-rurikon-600'>{track.title}</p>
                <p className='truncate text-sm text-rurikon-400'>
                  {track.artist}{track.album ? ` · ${track.album}` : ''}
                </p>
              </div>
              <time className='shrink-0 text-xs tabular-nums text-rurikon-300'>
                {track.nowPlaying ? 'now' : track.timestamp ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(track.timestamp) : ''}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className='text-rurikon-400'>No listening history is available right now.</p>
      )}
    </section>
  )
}
