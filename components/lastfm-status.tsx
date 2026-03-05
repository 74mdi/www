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
  const trackUrl = track?.url ?? LAST_FM_PROFILE_URL
  const prefix = isNowPlaying ? 'Listening to ' : 'Last listened to '

  return (
    <div className='mt-5 flex items-center gap-2 text-zinc-300'>
      <span className='h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]' />
      <img
        src={AVATAR_URL}
        alt='7amdi avatar'
        className='h-6 w-6 shrink-0 rounded-full border border-zinc-700 object-cover'
        loading='lazy'
        draggable={false}
      />
      {trackName ? (
        <a
          href={trackUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='decoration-zinc-500 underline-offset-2 hover:underline'
        >
          {prefix}
          {trackName}
        </a>
      ) : (
        <a
          href={LAST_FM_PROFILE_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='decoration-zinc-500 underline-offset-2 hover:underline'
        >
          Last.fm activity unavailable
        </a>
      )}
    </div>
  )
}
