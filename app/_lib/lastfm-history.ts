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
  message?: string
  toptracks?: { track?: LastFmChartItem[] | LastFmChartItem }
  topartists?: { artist?: LastFmChartItem[] | LastFmChartItem }
  topalbums?: { album?: LastFmChartItem[] | LastFmChartItem }
}

type LastFmInfoResponse = {
  error?: number
  artist?: LastFmChartItem
  album?: LastFmChartItem
  track?: { album?: LastFmChartItem }
}

type LastFmArtistAlbumsResponse = {
  error?: number
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

  const candidate = candidates.find((url) => {
    if (!/^https?:\/\//i.test(url ?? '')) return false
    const normalized = url?.toLowerCase() ?? ''
    return !normalized.includes(PLACEHOLDER_COVER_HASH)
  })
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

async function fetchImageInfo(
  apiKey: string,
  method: 'artist.getinfo' | 'album.getinfo',
  item: ChartItem,
): Promise<string | null> {
  const params = new URLSearchParams({
    method,
    api_key: apiKey,
    format: 'json',
  })
  if (method === 'artist.getinfo') {
    params.set('artist', item.name)
  } else {
    params.set('artist', item.artist)
    params.set('album', item.name)
  }

  try {
    const response = await fetch(`${LASTFM_ENDPOINT}?${params}`, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const payload = (await response.json()) as LastFmInfoResponse
    if (payload.error) return null
    const images = method === 'artist.getinfo' ? payload.artist?.image : payload.album?.image
    return imageUrl(images)
  } catch {
    return null
  }
}

async function fetchAlbumCoverForTrack(apiKey: string, track: ChartItem): Promise<string | null> {
  const params = new URLSearchParams({
    method: 'track.getinfo',
    artist: track.artist,
    track: track.name,
    api_key: apiKey,
    format: 'json',
    autocorrect: '1',
  })

  try {
    const response = await fetch(`${LASTFM_ENDPOINT}?${params}`, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const payload = (await response.json()) as LastFmInfoResponse
    if (payload.error) return null
    return imageUrl(payload.track?.album?.image)
  } catch {
    return null
  }
}

async function fetchArtistAlbumCover(apiKey: string, artistName: string): Promise<string | null> {
  const params = new URLSearchParams({
    method: 'artist.gettopalbums',
    artist: artistName,
    api_key: apiKey,
    format: 'json',
    limit: '1',
    autocorrect: '1',
  })

  try {
    const response = await fetch(`${LASTFM_ENDPOINT}?${params}`, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const payload = (await response.json()) as LastFmArtistAlbumsResponse
    if (payload.error) return null
    const album = asList(payload.topalbums?.album)[0]
    if (!album) return null
    const cover = imageUrl(album.image)
    if (cover) return cover
    const name = album.name?.trim()
    if (!name) return null
    return fetchImageInfo(apiKey, 'album.getinfo', {
      name,
      artist: artistName,
      cover: null,
      playCount: 0,
      url: null,
    })
  } catch {
    return null
  }
}

async function fillMissingCovers(
  apiKey: string,
  items: ChartItem[],
  method: 'artist.getinfo' | 'album.getinfo',
): Promise<ChartItem[]> {
  const missing = items.filter((item) => !item.cover)
  if (!missing.length) return items

  const resolved = await Promise.all(missing.map(async (item) => ({
    key: `${item.name.toLocaleLowerCase()}\u0000${item.artist.toLocaleLowerCase()}`,
    cover: await fetchImageInfo(apiKey, method, item),
  })))
  const covers = new Map(resolved.map((item) => [item.key, item.cover]))

  return items.map((item) => ({
    ...item,
    cover: item.cover ?? covers.get(`${item.name.toLocaleLowerCase()}\u0000${item.artist.toLocaleLowerCase()}`) ?? null,
  }))
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

  const rawTracks = normalizeItems(asList(trackData?.toptracks?.track), 'track')
  const rawArtists = normalizeItems(asList(artistData?.topartists?.artist), 'artist')
  const rawAlbums = normalizeItems(asList(albumData?.topalbums?.album), 'album')
  const [tracksWithAlbumCovers, albums] = await Promise.all([
    Promise.all(rawTracks.map(async (track) => ({
      ...track,
      cover: track.cover ?? await fetchAlbumCoverForTrack(apiKey, track),
    }))),
    fillMissingCovers(apiKey, rawAlbums, 'album.getinfo'),
  ])

  const albumsByArtist = new Map<string, string>()
  for (const album of albums) {
    if (album.cover && album.artist) {
      const key = album.artist.trim().toLocaleLowerCase()
      if (!albumsByArtist.has(key)) albumsByArtist.set(key, album.cover)
    }
  }
  const artists = await Promise.all(rawArtists.map(async (artist) => {
    const matchingAlbum = albumsByArtist.get(artist.name.trim().toLocaleLowerCase())
    const cover = artist.cover ?? matchingAlbum ?? await fetchArtistAlbumCover(apiKey, artist.name)
    return { ...artist, cover }
  }))
  const artistCovers = new Map(artists.map((artist) => [artist.name.trim().toLocaleLowerCase(), artist.cover]))

  return {
    tracks: tracksWithAlbumCovers.map((track) => ({
      ...track,
      cover: track.cover ?? artistCovers.get(track.artist.trim().toLocaleLowerCase()) ?? null,
    })),
    artists,
    albums: albums.map((album) => ({
      ...album,
      cover: album.cover ?? albumsByArtist.get(album.artist.trim().toLocaleLowerCase()) ?? null,
    })),
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
