import type { Metadata } from 'next'
import Link from 'next/link'

import { getListeningCharts } from '@/app/_lib/lastfm-history'

/* eslint-disable @next/next/no-img-element */

const title = 'Top music'
const description = 'Top tracks, artists, and albums from the past month.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/top' },
  openGraph: { title, description, url: '/top' },
  twitter: { card: 'summary', title, description },
}

function ChartName({ href, children }: { href: string | null; children: string }) {
  if (!href) return <span>{children}</span>
  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='text-rurikon-600 hover:underline hover:decoration-rurikon-300 hover:underline-offset-2 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted'
    >
      {children}
    </a>
  )
}

export default async function TopMusicPage() {
  const { tracks, artists, albums } = await getListeningCharts()

  return (
    <section className='space-y-8'>
      <header className='space-y-2'>
        <h1 className='m-0 text-[1.55rem] leading-[1.15] font-semibold text-rurikon-700 sm:text-[1.78rem]'>
          Top music
        </h1>
        <p className='text-rurikon-400'>Most played this past month.</p>
        <Link href='/mh' className='inline-block text-sm text-rurikon-400 underline decoration-rurikon-200 underline-offset-2 hover:text-rurikon-600'>
          Listening history
        </Link>
      </header>

      <div className='grid grid-cols-2 gap-0'>
        <section>
          <h2 className='mb-2 font-medium text-rurikon-600'>Artists</h2>
          {artists.length ? (
            <ol>
              {artists.map((artist, index) => (
                <li key={`${artist.name}-${index}`} className='flex min-w-0 items-center gap-2 py-2'>
                  <span className='w-5 shrink-0 font-mono text-[11px] tabular-nums text-rurikon-300'>{String(index + 1).padStart(2, '0')}</span>
                  {artist.cover ? (
                    <img src={artist.cover} alt='' width='44' height='44' loading={index === 0 ? 'eager' : 'lazy'} decoding='async' className='h-11 w-11 shrink-0 object-cover transition-transform duration-200 ease-out hover:scale-105' />
                  ) : null}
                  <div className='min-w-0'>
                    <p className='m-0 truncate text-sm font-medium'><ChartName href={artist.url}>{artist.name}</ChartName></p>
                    <p className='m-0 text-xs text-rurikon-300'>{artist.playCount.toLocaleString()} plays</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className='text-sm text-rurikon-400'>No chart data.</p>}
        </section>

        <section>
          <h2 className='mb-2 font-medium text-rurikon-600'>Albums</h2>
          {albums.length ? (
            <ol>
              {albums.map((album, index) => (
                <li key={`${album.name}-${album.artist}-${index}`} className='flex min-w-0 items-center gap-2 py-2'>
                  <span className='w-5 shrink-0 font-mono text-[11px] tabular-nums text-rurikon-300'>{String(index + 1).padStart(2, '0')}</span>
                  {album.cover ? (
                    <img src={album.cover} alt='' width='44' height='44' loading={index === 0 ? 'eager' : 'lazy'} decoding='async' className='h-11 w-11 shrink-0 object-cover transition-transform duration-200 ease-out hover:scale-105' />
                  ) : null}
                  <div className='min-w-0'>
                    <p className='m-0 truncate text-sm font-medium'><ChartName href={album.url}>{album.name}</ChartName></p>
                    <p className='m-0 truncate text-xs text-rurikon-400'>{album.artist || 'Unknown artist'}</p>
                    <p className='m-0 text-xs text-rurikon-300'>{album.playCount.toLocaleString()} plays</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className='text-sm text-rurikon-400'>No chart data.</p>}
        </section>
      </div>

      <section>
        <header className='mb-2 flex items-baseline justify-between gap-3'>
          <h2 className='m-0 font-medium text-rurikon-600'>Tracks</h2>
          <span className='text-xs text-rurikon-300'>top 10</span>
        </header>
        {tracks.length ? (
          <ol>
            {tracks.map((track, index) => (
              <li key={`${track.name}-${track.artist}-${index}`} className='flex min-w-0 items-center gap-3 py-2.5'>
                <span className='w-5 shrink-0 font-mono text-xs tabular-nums text-rurikon-300'>{String(index + 1).padStart(2, '0')}</span>
                {track.cover ? (
                  <img src={track.cover} alt='' width='48' height='48' loading={index < 3 ? 'eager' : 'lazy'} decoding='async' className='h-12 w-12 shrink-0 object-cover transition-transform duration-200 ease-out hover:scale-105' />
                ) : null}
                <div className='min-w-0 flex-1'>
                  <p className='m-0 truncate font-medium'><ChartName href={track.url}>{track.name}</ChartName></p>
                  <p className='m-0 truncate text-sm text-rurikon-400'>{track.artist || 'Unknown artist'}</p>
                </div>
                <span className='shrink-0 text-xs tabular-nums text-rurikon-300'>{track.playCount.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        ) : <p className='text-rurikon-400'>No chart data available.</p>}
      </section>

      <p className='m-0 text-xs text-rurikon-300'>Charts from Last.fm · updated every five minutes.</p>
    </section>
  )
}
