import { NextResponse } from 'next/server'

type LastFmText = {
  '#text'?: string
}

type LastFmImage = {
  '#text'?: string
  size?: string
}

type LastFmTrackPayload = {
  '@attr'?: {
    nowplaying?: string
  }
  album?: LastFmText
  artist?: LastFmText
  image?: LastFmImage[]
  name?: string
}

type LastFmRawTrack = {
  '@attr'?: {
    nowplaying?: string
  }
  album?: LastFmText
  artist?: LastFmText | string
  image?: LastFmImage[]
  name?: string
}

type LastFmRecentTracksResponse = {
  error?: number
  message?: string
  recenttracks?: {
    track?: LastFmRawTrack[] | LastFmRawTrack
  }
}

type LastFmLatestSongResponse = {
  track?: LastFmTrackPayload
  error?: string
  stale?: boolean
}

const DEFAULT_LASTFM_USERNAME = 'khrya'
const LASTFM_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/'
const LASTFM_METHOD = 'user.getrecenttracks'
const REQUEST_TIMEOUT_MS = 5_000
const FRESH_CACHE_MS = 8_000
const STALE_CACHE_MS = 15 * 60_000

type CacheEntry = {
  track: LastFmTrackPayload
  fetchedAtMs: number
}

let cacheEntry: CacheEntry | null = null
let inflightTrackRequest: Promise<LastFmTrackPayload> | null = null

function cleanText(value: string | undefined): string {
  return value?.trim() ?? ''
}

function normalizeTrack(rawTrack: LastFmRawTrack | undefined): LastFmTrackPayload | null {
  if (!rawTrack) return null

  const title = cleanText(rawTrack.name)
  if (!title) return null

  const artistText =
    typeof rawTrack.artist === 'string'
      ? cleanText(rawTrack.artist)
      : cleanText(rawTrack.artist?.['#text'])

  const albumText = cleanText(rawTrack.album?.['#text'])
  const images = Array.isArray(rawTrack.image) ? rawTrack.image : []

  return {
    '@attr': {
      nowplaying: rawTrack['@attr']?.nowplaying === 'true' ? 'true' : 'false',
    },
    album: { '#text': albumText },
    artist: { '#text': artistText },
    image: images,
    name: title,
  }
}

function createPublicCacheHeaders(cacheState: string): HeadersInit {
  return {
    'Cache-Control': 'public, max-age=0, s-maxage=8, stale-while-revalidate=52',
    'X-Lastfm-Cache': cacheState,
  }
}

function createNoStoreHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-store',
  }
}

async function fetchRecentTrackFromLastFm(
  apiKey: string,
  username: string,
): Promise<LastFmTrackPayload> {
  const query = new URLSearchParams({
    method: LASTFM_METHOD,
    user: username,
    api_key: apiKey,
    format: 'json',
    limit: '1',
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${LASTFM_ENDPOINT}?${query.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Last.fm API request failed (${response.status}).`)
    }

    const payload = (await response.json()) as LastFmRecentTracksResponse
    if (payload.error) {
      throw new Error(payload.message || 'Last.fm returned an error response.')
    }

    const trackField = payload.recenttracks?.track
    const firstTrack = Array.isArray(trackField) ? trackField[0] : trackField
    const normalized = normalizeTrack(firstTrack)

    if (!normalized) {
      throw new Error('Last.fm did not return a valid track.')
    }

    return normalized
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Last.fm request timed out.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET() {
  const now = Date.now()

  if (cacheEntry && now - cacheEntry.fetchedAtMs < FRESH_CACHE_MS) {
    return NextResponse.json<LastFmLatestSongResponse>(
      { track: cacheEntry.track },
      {
        status: 200,
        headers: createPublicCacheHeaders('fresh'),
      },
    )
  }

  const apiKey = process.env.LASTFM_API_KEY?.trim()
  const username = process.env.LASTFM_USERNAME?.trim() || DEFAULT_LASTFM_USERNAME

  if (!apiKey) {
    if (cacheEntry && now - cacheEntry.fetchedAtMs < STALE_CACHE_MS) {
      return NextResponse.json<LastFmLatestSongResponse>(
        {
          track: cacheEntry.track,
          stale: true,
          error: 'Using cached Last.fm data because LASTFM_API_KEY is missing.',
        },
        {
          status: 200,
          headers: createPublicCacheHeaders('stale-no-key'),
        },
      )
    }

    return NextResponse.json<LastFmLatestSongResponse>(
      {
        track: undefined,
        error: 'LASTFM_API_KEY is not configured.',
      },
      {
        status: 500,
        headers: createNoStoreHeaders(),
      },
    )
  }

  if (!inflightTrackRequest) {
    inflightTrackRequest = fetchRecentTrackFromLastFm(apiKey, username)
      .then((track) => {
        cacheEntry = {
          track,
          fetchedAtMs: Date.now(),
        }
        return track
      })
      .finally(() => {
        inflightTrackRequest = null
      })
  }

  try {
    const track = await inflightTrackRequest
    return NextResponse.json<LastFmLatestSongResponse>(
      { track },
      {
        status: 200,
        headers: createPublicCacheHeaders('live'),
      },
    )
  } catch (error) {
    if (cacheEntry && now - cacheEntry.fetchedAtMs < STALE_CACHE_MS) {
      return NextResponse.json<LastFmLatestSongResponse>(
        {
          track: cacheEntry.track,
          stale: true,
          error: 'Using cached Last.fm data because live request failed.',
        },
        {
          status: 200,
          headers: createPublicCacheHeaders('stale-fallback'),
        },
      )
    }

    const message =
      error instanceof Error ? error.message : 'Unable to fetch Last.fm track.'

    return NextResponse.json<LastFmLatestSongResponse>(
      {
        track: undefined,
        error: message,
      },
      {
        status: 503,
        headers: createNoStoreHeaders(),
      },
    )
  }
}
