import type { Metadata } from 'next'
import Link from 'next/link'

import { getListeningCharts, type ListeningPeriod } from '@/app/_lib/lastfm-history'
import PeriodSelect from '@/app/top/period-select'

/* eslint-disable @next/next/no-img-element */

const title = 'Top music'
const description = 'Top tracks, artists, and albums from Last.fm.'
const FALLBACK_COVER = '/images/cover-placeholder.svg'
const PERIODS = new Set<ListeningPeriod>(['overall', '7day', '1month', '3month', '6month', '12month'])

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/top' },
  openGraph: { title, description, url: '/top' },
  twitter: { card: 'summary', title, description },
}

function ArtistTile({
  artist,
  featured = false,
}: {
  artist: { name: string; cover: string | null; playCount: number; url: string | null }
  featured?: boolean
}) {
  const content = (
    <>
      <img
        src={artist.cover ?? FALLBACK_COVER}
        alt=''
        loading={featured ? 'eager' : 'lazy'}
        decoding='async'
        className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]'
      />
      <span className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/0' />
      <span className={`absolute inset-x-3 bottom-3 text-white drop-shadow-sm sm:inset-x-4 sm:bottom-4 ${featured ? 'sm:inset-x-5 sm:bottom-5' : ''}`}>
        <span className={`block truncate font-semibold ${featured ? 'text-base sm:text-lg' : 'text-sm'}`}>
          {artist.name}
        </span>
        <span className='block text-[11px] tabular-nums text-white/85'>
          {artist.playCount.toLocaleString()} plays
        </span>
      </span>
    </>
  )

  const className = `group relative block min-h-0 overflow-hidden bg-[#171717] ${featured ? 'row-span-2' : ''}`
  return artist.url ? (
    <a href={artist.url} target='_blank' rel='noopener noreferrer' className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  )
}

export default async function TopMusicPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const period = PERIODS.has(params.period as ListeningPeriod)
    ? (params.period as ListeningPeriod)
    : 'overall'
  const { tracks, artists, albums, moreArtistsUrl } = await getListeningCharts(period)
  const artistTiles = artists.slice(0, 5)
  const bestArtistCover = artistTiles.find((artist) => artist.cover)?.cover
  const bestAlbumCover = albums.find((album) => album.cover)?.cover

  return (
    <section className='space-y-8'>
      <header className='flex min-h-12 items-center justify-between gap-3'>
        <h1 className='m-0 text-[1.35rem] leading-tight font-normal tracking-normal text-rurikon-700 sm:text-[1.5rem]'>
          Top Artists
        </h1>
        <PeriodSelect value={period} />
      </header>

      {artistTiles.length ? (
        <div className='grid h-[24rem] grid-cols-2 grid-rows-2 sm:h-[28rem]'>
          {artistTiles.map((artist, index) => (
            <ArtistTile key={`${artist.name}-${index}`} artist={artist} featured={index === 0} />
          ))}
        </div>
      ) : (
        <p className='text-rurikon-400'>No artist chart data is available.</p>
      )}

      <div className='flex justify-end'>
        <a
          href={moreArtistsUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='text-sm text-rurikon-400 hover:text-rurikon-600'
        >
          More artists <span aria-hidden='true'>›</span>
        </a>
      </div>

      {albums.length ? (
        <section>
          <h2 className='mb-3 font-medium text-rurikon-600'>Top Albums</h2>
          <div className='grid grid-cols-3 gap-0'>
            {albums.map((album, index) => {
              const cover = album.cover ?? bestArtistCover ?? FALLBACK_COVER
              return (
                <a
                  key={`${album.name}-${album.artist}-${index}`}
                  href={album.url ?? undefined}
                  target={album.url ? '_blank' : undefined}
                  rel={album.url ? 'noopener noreferrer' : undefined}
                  className='group relative aspect-square min-w-0 overflow-hidden bg-[#171717]'
                >
                  <img src={cover} alt='' loading='lazy' decoding='async' className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]' />
                  <span className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent' />
                  <span className='absolute inset-x-2 bottom-2 text-white drop-shadow-sm sm:inset-x-3 sm:bottom-3'>
                    <span className='block truncate text-xs font-medium sm:text-sm'>{album.name}</span>
                    <span className='block truncate text-[10px] text-white/80 sm:text-xs'>{album.artist || 'Unknown artist'}</span>
                  </span>
                </a>
              )
            })}
          </div>
        </section>
      ) : null}

      <section>
        <header className='mb-2 flex items-baseline justify-between gap-3'>
          <h2 className='m-0 font-medium text-rurikon-600'>Top Tracks</h2>
          <span className='text-xs text-rurikon-300'>10 songs</span>
        </header>
        {tracks.length ? (
          <ol>
            {tracks.map((track, index) => {
              const cover = track.cover ?? bestAlbumCover ?? bestArtistCover ?? FALLBACK_COVER
              return (
                <li key={`${track.name}-${track.artist}-${index}`} className='flex min-w-0 items-center gap-3 py-2.5'>
                  <span className='w-5 shrink-0 font-mono text-xs tabular-nums text-rurikon-300'>{String(index + 1).padStart(2, '0')}</span>
                  <img src={cover} alt='' width='48' height='48' loading={index < 3 ? 'eager' : 'lazy'} decoding='async' className='h-12 w-12 shrink-0 object-cover' />
                  <div className='min-w-0 flex-1'>
                    <p className='m-0 truncate font-medium'>
                      {track.url ? <a href={track.url} target='_blank' rel='noopener noreferrer' className='text-rurikon-600 hover:underline hover:decoration-rurikon-300 hover:underline-offset-2'>{track.name}</a> : <span className='text-rurikon-600'>{track.name}</span>}
                    </p>
                    <p className='m-0 truncate text-sm text-rurikon-400'>{track.artist || 'Unknown artist'}</p>
                  </div>
                  <span className='shrink-0 text-xs tabular-nums text-rurikon-300'>{track.playCount.toLocaleString()}</span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className='text-rurikon-400'>No track chart data is available.</p>
        )}
      </section>

      <p className='m-0 text-xs text-rurikon-300'>Charts from Last.fm. <Link href='/mh' className='underline decoration-rurikon-200 underline-offset-2 hover:text-rurikon-500'>Listening history</Link></p>
    </section>
  )
}
