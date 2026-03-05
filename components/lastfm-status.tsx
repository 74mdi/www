type LastFmArtist = {
  '#text'?: string
}

type LastFmAttrs = {
  nowplaying?: string
}

type LastFmTrack = {
  '@attr'?: LastFmAttrs
  artist?: LastFmArtist
  name?: string
  url?: string
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

export async function LastFmStatus() {
  const track = await getLatestTrack()
  const isNowPlaying = track?.['@attr']?.nowplaying === 'true'
  const trackName = track?.name?.trim()
  const artistName = track?.artist?.['#text']?.trim()
  const trackUrl = track?.url ?? LAST_FM_PROFILE_URL
  const prefix = isNowPlaying ? 'Listening to ' : 'Last listened to '
  const dotClass = isNowPlaying ? 'bg-emerald-400' : 'bg-rurikon-300'

  return (
    <div className='mt-4 flex items-center gap-2 text-rurikon-500'>
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass} ${isNowPlaying ? 'shadow-[0_0_10px_rgba(74,222,128,0.8)]' : ''}`}
      />
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
