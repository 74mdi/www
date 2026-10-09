type LastFmImage = { '#text'?: string; size?: string }
type LastFmArtistName = { name?: string } | string

type LastFmChartItem = {
  name?: string
  artist?: LastFmArtistName
  image?: LastFmImage[]
  playcount?: string
  url?: string
}

type LastFmChartResponse = {
  error?: number
  toptracks?: { track?: LastFmChartItem[] | LastFmChartItem }
  topartists?: { artist?: LastFmChartItem[] | LastFmChartItem }
  topalbums?: { album?: LastFmChartItem[] | LastFmChartItem }
}

type LastFmRecentTrack = {
  name?: string
  artist?: LastFmArtistName
  album?: { '#text'?: string }
  image?: LastFmImage[]
  date?: { uts?: string }
  '@attr'?: { nowplaying?: string }
}

type LastFmRecentResponse = {
  error?: number
  recenttracks?: { track?: LastFmRecentTrack[] | LastFmRecentTrack }
}

type ChartItem = {
  name: string
  artist: string
  cover: string | null
  playCount: number
  url: string | null
}

export type ListeningHistoryTrack = {
  title: string
  artist: string
  album: string
  cover: string | null
  timestamp: number | null
  nowPlaying: boolean
}

export type ListeningCharts = {
  tracks: ChartItem[]
  artists: ChartItem[]
  albums: ChartItem[]
  moreArtistsUrl: string
}

export type ListeningPeriod = 'overall' | '7day' | '1month' | '3month' | '6month' | '12month'

const LASTFM_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/'
const PLACEHOLDER_COVER_HASH = '2a96cbd8b46e442fc41c2b86b821562f'

function asList<T>(value: T[] | T | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function imageUrl(images: LastFmImage[] | undefined): string | null {
  if (!images?.length) return null

  const candidates = [
    ...['extralarge', 'large', 'medium', 'small'].map(
      (size) => images.find((image) => image.size === size)?.['#text'],
    ),
    ...images.map((image) => image['#text']),
  ]

  const candidate = candidates.find(
    (url) => /^https?:\/\//i.test(url ?? '') && !url?.includes(PLACEHOLDER_COVER_HASH),
  )
  return candidate?.replace(/^http:\/\//i, 'https://') ?? null
}

function artistName(value: LastFmArtistName | undefined): string {
  if (typeof value === 'string') return value.trim()
  return value?.name?.trim() ?? ''
}

function normalizeItems(items: LastFmChartItem[], type: 'track' | 'artist' | 'album'): ChartItem[] {
  return items.flatMap((item) => {
    const name = item.name?.trim()
    if (!name) return []

    const count = Number.parseInt(item.playcount ?? '', 10)
    return [{
      name,
      artist: type === 'artist' ? '' : artistName(item.artist),
      cover: imageUrl(item.image),
      playCount: Number.isFinite(count) ? count : 0,
      url: item.url?.startsWith('https://') ? item.url : null,
    }]
  })
}

async function fetchCharts(apiKey: string, method: string, limit: number, period: ListeningPeriod): Promise<LastFmChartResponse | null> {
  const params = new URLSearchParams({
    method,
    user: process.env.LASTFM_USERNAME?.trim() || 'khrya',
    api_key: apiKey,
    format: 'json',
    period,
    limit: String(limit),
  })

  try {
    const response = await fetch(`${LASTFM_ENDPOINT}?${params}`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null

    const payload = (await response.json()) as LastFmChartResponse
    return payload.error ? null : payload
  } catch {
    return null
  }
}

export async function getListeningCharts(period: ListeningPeriod = 'overall'): Promise<ListeningCharts> {
  const apiKey = process.env.LASTFM_API_KEY?.trim()
  const username = process.env.LASTFM_USERNAME?.trim() || 'khrya'
  const moreArtistsUrl = `https://www.last.fm/user/${encodeURIComponent(username)}/library/artists`
  if (!apiKey) return { tracks: [], artists: [], albums: [], moreArtistsUrl }

  const [trackData, artistData, albumData] = await Promise.all([
    fetchCharts(apiKey, 'user.gettoptracks', 10, period),
    fetchCharts(apiKey, 'user.gettopartists', 5, period),
    fetchCharts(apiKey, 'user.gettopalbums', 3, period),
  ])

  return {
    tracks: normalizeItems(asList(trackData?.toptracks?.track), 'track'),
    artists: normalizeItems(asList(artistData?.topartists?.artist), 'artist'),
    albums: normalizeItems(asList(albumData?.topalbums?.album), 'album'),
    moreArtistsUrl,
  }
}

export async function getListeningHistory(): Promise<ListeningHistoryTrack[]> {
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

    const payload = (await response.json()) as LastFmRecentResponse
    if (payload.error) return []

    return asList(payload.recenttracks?.track).flatMap((track) => {
      const title = track.name?.trim()
      if (!title) return []

      const nowPlaying = track['@attr']?.nowplaying === 'true'
      const seconds = Number(track.date?.uts)

      return [{
        title,
        artist: artistName(track.artist) || 'Unknown artist',
        album: track.album?.['#text']?.trim() || '',
        cover: imageUrl(track.image),
        timestamp: !nowPlaying && Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null,
        nowPlaying,
      }]
    })
  } catch {
    return []
  }
}
