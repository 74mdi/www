type LastFmArtist = {
  '#text'?: string
}

type LastFmAttrs = {
  nowplaying?: string
}

type LastFmTrack = {
  '@attr'?: LastFmAttrs
  artist?: LastFmArtist
  image?: LastFmImage[]
  name?: string
  url?: string
}

type LastFmImage = {
  '#text'?: string
  size?: string
}

type LastFmResponse = {
  track?: LastFmTrack
}

const LAST_FM_USERNAME = 'khrya'
const LAST_FM_PROFILE_URL = `https://www.last.fm/user/${LAST_FM_USERNAME}`
const LAST_FM_LATEST_SONG_URL = `https://lastfm-last-played.biancarosa.com.br/${LAST_FM_USERNAME}/latest-song`
const AVATAR_URL = 'https://github.com/74mdi.png'

async function getLatestTrack(): Promise<LastFmTrack | null> {
  try {
    const response = await fetch(LAST_FM_LATEST_SONG_URL, {
      next: { revalidate: 60 },
    })

    if (!response.ok) return null

    const data = (await response.json()) as LastFmResponse
    return data.track ?? null
  } catch {
    return null
  }
}

function getAlbumArtUrl(track: LastFmTrack | null): string | null {
  if (!track?.image || track.image.length === 0) return null

  const priority = ['extralarge', 'large', 'medium', 'small']
  for (const size of priority) {
    const match = track.image.find((item) => item.size === size)
    if (match?.['#text']) return match['#text']
  }

  return track.image.find((item) => Boolean(item['#text']))?.['#text'] ?? null
}

export async function LastFmStatus() {
  const track = await getLatestTrack()
  const isNowPlaying = track?.['@attr']?.nowplaying === 'true'
  const trackName = track?.name?.trim()
  const artistName = track?.artist?.['#text']?.trim()
  const trackUrl = track?.url ?? LAST_FM_PROFILE_URL
  const albumArtUrl = getAlbumArtUrl(track)
  const prefix = isNowPlaying ? 'Listening to ' : 'Last listened to '
  const dotClass = isNowPlaying ? 'bg-emerald-400' : 'bg-rurikon-300'

  return (
    <div className='mt-4 flex items-center gap-2 text-rurikon-500'>
      {albumArtUrl ? (
        <a
          href={trackUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='block shrink-0'
          aria-label='Open current track on Last.fm'
        >
          <img
            src={albumArtUrl}
            alt='Current track album art'
            className={`h-5 w-5 rounded-[3px] border border-rurikon-border object-cover ${isNowPlaying ? 'ring-1 ring-emerald-400/70' : ''}`}
            loading='lazy'
            draggable={false}
          />
        </a>
      ) : (
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass} ${isNowPlaying ? 'shadow-[0_0_10px_rgba(74,222,128,0.8)]' : ''}`}
        />
      )}
      <img
        src={AVATAR_URL}
        alt='7amdi avatar'
        className='h-6 w-6 shrink-0 rounded-full border border-rurikon-border object-cover'
        loading='lazy'
        draggable={false}
      />
      {trackName ? (
        <a
          href={trackUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='break-words decoration-from-font underline underline-offset-2 decoration-rurikon-300 hover:decoration-rurikon-600 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-offset-1 focus-visible:outline-dotted'
        >
          {prefix}
          <strong className='font-semibold text-rurikon-700'>{trackName}</strong>
          {artistName ? (
            <>
              {' '}
              by <span className='text-rurikon-400'>{artistName}</span>
            </>
          ) : null}
        </a>
      ) : (
        <a
          href={LAST_FM_PROFILE_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='break-words decoration-from-font underline underline-offset-2 decoration-rurikon-300 hover:decoration-rurikon-600 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-offset-1 focus-visible:outline-dotted'
        >
          Last.fm activity unavailable
        </a>
      )}
    </div>
  )
}
