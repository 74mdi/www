import type { Metadata } from 'next'

import AlbumCover from '@/app/mh/album-cover'
import { getListeningCharts } from '@/app/_lib/lastfm-history'

const title = 'Listening history'
const description = 'The most played tracks, artists, and albums from the past month.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/mh' },
  openGraph: { title, description, url: '/mh' },
  twitter: { card: 'summary', title, description },
}

function Rank({ value }: { value: number }) {
  return (
    <span className='w-6 shrink-0 font-mono text-xs tabular-nums text-rurikon-300'>
      {String(value).padStart(2, '0')}
    </span>
  )
}

function ChartLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <span className='text-rurikon-600'>{children}</span>
  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='text-rurikon-600 decoration-rurikon-300 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted'
    >
      {children}
    </a>
  )
}

export default async function ListeningHistoryPage() {
  const { tracks, artists, albums } = await getListeningCharts()

  return (
    <section className='space-y-8'>
      <header className='space-y-2'>
        <p className='m-0 text-xs uppercase tracking-[0.16em] text-rurikon-300'>Last.fm · past month</p>
        <h1 className='m-0 text-[1.55rem] leading-[1.15] font-semibold text-rurikon-700 sm:text-[1.78rem]'>
          Listening history
        </h1>
        <p className='text-rurikon-400'>A small map of what’s been on repeat.</p>
      </header>

      <div className='grid gap-4 sm:grid-cols-2'>
        <section className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5'>
          <header className='mb-3 flex items-baseline justify-between gap-3'>
            <h2 className='m-0 font-medium text-rurikon-600'>Top artists</h2>
            <span className='text-xs text-rurikon-300'>most played</span>
          </header>
          {artists.length ? (
            <ol className='divide-y divide-[var(--color-rurikon-border)]'>
              {artists.map((artist, index) => (
                <li key={`${artist.name}-${index}`} className='flex items-center gap-3 py-2.5'>
                  <Rank value={index + 1} />
                  {artist.cover ? (
                    <AlbumCover src={artist.cover} title={artist.name} />
                  ) : (
                    <span aria-hidden='true' className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-sm text-rurikon-400'>
                      {artist.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='m-0 truncate font-medium'>
                      <ChartLink href={artist.url}>{artist.name}</ChartLink>
                    </p>
                    <p className='m-0 text-xs text-rurikon-300'>{artist.playCount.toLocaleString()} plays</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className='text-sm text-rurikon-400'>No chart data available.</p>}
        </section>

        <section className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5'>
          <header className='mb-3 flex items-baseline justify-between gap-3'>
            <h2 className='m-0 font-medium text-rurikon-600'>Top albums</h2>
            <span className='text-xs text-rurikon-300'>most played</span>
          </header>
          {albums.length ? (
            <ol className='divide-y divide-[var(--color-rurikon-border)]'>
              {albums.map((album, index) => (
                <li key={`${album.name}-${album.artist}-${index}`} className='flex items-center gap-3 py-2.5'>
                  <Rank value={index + 1} />
                  {album.cover ? (
                    <AlbumCover src={album.cover} title={album.name} />
                  ) : (
                    <span aria-hidden='true' className='h-12 w-12 shrink-0 rounded-[3px] bg-[var(--surface-soft)]' />
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='m-0 truncate font-medium'>
                      <ChartLink href={album.url}>{album.name}</ChartLink>
                    </p>
                    <p className='m-0 truncate text-xs text-rurikon-400'>{album.artist || 'Unknown artist'}</p>
                    <p className='m-0 text-xs text-rurikon-300'>{album.playCount.toLocaleString()} plays</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className='text-sm text-rurikon-400'>No chart data available.</p>}
        </section>
      </div>

      <section>
        <header className='mb-2 flex items-baseline justify-between gap-3'>
          <h2 className='m-0 font-medium text-rurikon-600'>Top tracks</h2>
          <span className='text-xs text-rurikon-300'>10 songs · most played</span>
        </header>
        {tracks.length ? (
          <ol className='divide-y divide-[var(--color-rurikon-border)]'>
            {tracks.map((track, index) => (
              <li key={`${track.name}-${track.artist}-${index}`} className='flex items-center gap-3 py-3'>
                <Rank value={index + 1} />
                {track.cover ? (
                  <AlbumCover src={track.cover} title={track.name} />
                ) : (
                  <span aria-hidden='true' className='h-12 w-12 shrink-0 rounded-[3px] bg-[var(--surface-soft)]' />
                )}
                <div className='min-w-0 flex-1'>
                  <p className='m-0 truncate font-medium'>
                    <ChartLink href={track.url}>{track.name}</ChartLink>
                  </p>
                  <p className='m-0 truncate text-sm text-rurikon-400'>{track.artist || 'Unknown artist'}</p>
                </div>
                <span className='shrink-0 text-xs tabular-nums text-rurikon-300'>
                  {track.playCount.toLocaleString()} plays
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className='py-3 text-rurikon-400'>No listening charts are available right now.</p>
        )}
      </section>

      <p className='m-0 text-xs text-rurikon-300'>Charts provided by Last.fm.</p>
    </section>
  )
}
