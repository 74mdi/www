type LastFmText = { '#text'?: string }
type LastFmImage = { '#text'?: string; size?: string }
type LastFmRawTrack = {
  name?: string
  artist?: LastFmText | string
  album?: LastFmText
  image?: LastFmImage[]
  date?: { uts?: string }
  '@attr'?: { nowplaying?: string }
}

type LastFmResponse = {
  error?: number
  recenttracks?: { track?: LastFmRawTrack[] | LastFmRawTrack }
}

export type ListeningTrack = {
  title: string
  artist: string
  album: string
  cover: string | null
  timestamp: number | null
  nowPlaying: boolean
}

const LASTFM_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/'

export async function getListeningHistory(): Promise<ListeningTrack[]> {
  const apiKey = process.env.LASTFM_API_KEY?.trim()
  if (!apiKey) return []

  const params = new URLSearchParams({
    method: 'user.getrecenttracks',
    user: process.env.LASTFM_USERNAME?.trim() || 'khrya',
    api_key: apiKey,
    format: 'json',
    limit: '50',
  })

  try {
    const response = await fetch(`${LASTFM_ENDPOINT}?${params}`, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return []

    const payload = (await response.json()) as LastFmResponse
    if (payload.error) return []

    const rawTracks = payload.recenttracks?.track
    const tracks = Array.isArray(rawTracks) ? rawTracks : rawTracks ? [rawTracks] : []

    return tracks.flatMap((track) => {
      const title = track.name?.trim()
      if (!title) return []

      const artist = typeof track.artist === 'string'
        ? track.artist.trim()
        : track.artist?.['#text']?.trim() || ''
      const coverImage = ['extralarge', 'large', 'medium', 'small']
        .map((size) => track.image?.find((image) => image.size === size)?.['#text'])
        .find((url) => url?.startsWith('https://') && !url.includes('2a96cbd8b46e442fc41c2b86b821562f'))
        ?? track.image?.map((image) => image['#text']).find(
          (url) => url?.startsWith('https://') && !url.includes('2a96cbd8b46e442fc41c2b86b821562f'),
        )
      const cover = coverImage ?? null
      const nowPlaying = track['@attr']?.nowplaying === 'true'
      const seconds = Number(track.date?.uts)

      return [{
        title,
        artist: artist || 'Unknown artist',
        album: track.album?.['#text']?.trim() || '',
        cover,
        timestamp: !nowPlaying && Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null,
        nowPlaying,
      }]
    })
  } catch {
    return []
  }
}
