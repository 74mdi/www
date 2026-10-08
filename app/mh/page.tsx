import type { Metadata } from 'next'
import Link from 'next/link'

import AlbumCover from '@/app/mh/album-cover'
import { getListeningHistory } from '@/app/_lib/lastfm-history'

const title = 'Listening history'
const description = 'Recently played tracks from Last.fm.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/mh' },
  openGraph: { title, description, url: '/mh' },
  twitter: { card: 'summary', title, description },
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default async function ListeningHistoryPage() {
  const tracks = await getListeningHistory()

  return (
    <section className='space-y-6'>
      <header className='space-y-2'>
        <h1 className='m-0 text-[1.55rem] leading-[1.15] font-semibold text-rurikon-700 sm:text-[1.78rem]'>
          Listening history
        </h1>
        <p className='text-rurikon-400'>Recently played on Last.fm.</p>
        <Link href='/top' className='inline-block text-sm text-rurikon-400 underline decoration-rurikon-200 underline-offset-2 hover:text-rurikon-600'>
          Top music
        </Link>
      </header>

      {tracks.length ? (
        <ol className='divide-y divide-[var(--color-rurikon-border)]'>
          {tracks.map((track, index) => (
            <li key={`${track.timestamp ?? 'live'}-${track.title}-${track.artist}-${index}`} className='flex items-center gap-3 py-3'>
              {track.cover ? (
                <AlbumCover src={track.cover} title={track.title} />
              ) : (
                <span aria-hidden='true' className='h-12 w-12 shrink-0 rounded-[3px] bg-[var(--surface-soft)]' />
              )}
              <div className='min-w-0 flex-1'>
                <p className='m-0 truncate font-medium text-rurikon-600'>{track.title}</p>
                <p className='m-0 truncate text-sm text-rurikon-400'>
                  {track.artist}{track.album ? ` · ${track.album}` : ''}
                </p>
              </div>
              <time
                dateTime={track.timestamp ? new Date(track.timestamp).toISOString() : undefined}
                className='shrink-0 text-xs tabular-nums text-rurikon-300'
              >
                {track.nowPlaying ? 'now' : track.timestamp ? dateFormatter.format(track.timestamp) : ''}
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
