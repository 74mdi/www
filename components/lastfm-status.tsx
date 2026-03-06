'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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

type LastFmResponse = {
  track?: LastFmTrackPayload
  error?: string
  stale?: boolean
}

type TrackSnapshot = {
  isNowPlaying: boolean
  title: string
  album: string
  artist: string
  coverUrl: string | null
}

const LAST_FM_ENDPOINT = '/api/lastfm/latest'
const VISIBLE_POLL_MS = 3000
const HIDDEN_POLL_MS = 30000
const REQUEST_TIMEOUT_MS = 4500
const MAX_FAILURE_BACKOFF_MS = 120000
const PREVIEW_GAP_PX = 8
const PREVIEW_MARGIN_PX = 8
const LASTFM_EMPTY_COVER_HASH = '2a96cbd8b46e442fc41c2b86b821562f'

function cleanText(value: string | undefined): string {
  return value?.trim() ?? ''
}

function isHttpUrl(value: string | undefined): value is string {
  if (!value) return false
  return value.startsWith('https://') || value.startsWith('http://')
}

function isPlaceholderCoverUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.pathname.includes(LASTFM_EMPTY_COVER_HASH)
  } catch {
    return value.includes(LASTFM_EMPTY_COVER_HASH)
  }
}

function pickCoverUrl(images: LastFmImage[] | undefined): string | null {
  if (!images || images.length === 0) return null

  const preferredSizes = ['extralarge', 'large', 'medium', 'small']
  for (const size of preferredSizes) {
    const image = images.find((item) => item.size === size)
    const url = image?.['#text']
    if (isHttpUrl(url) && !isPlaceholderCoverUrl(url)) return url
  }

  const fallback = images.find((item) => {
    const url = item['#text']
    return isHttpUrl(url) && !isPlaceholderCoverUrl(url)
  })
  return fallback?.['#text'] ?? null
}

function normalizeTrack(payload: LastFmResponse): TrackSnapshot | null {
  const rawTrack = payload.track
  if (!rawTrack) return null

  const title = cleanText(rawTrack.name)
  if (!title) return null

  return {
    isNowPlaying: rawTrack['@attr']?.nowplaying === 'true',
    title,
    album: cleanText(rawTrack.album?.['#text']),
    artist: cleanText(rawTrack.artist?.['#text']),
    coverUrl: pickCoverUrl(rawTrack.image),
  }
}

function createSignature(track: TrackSnapshot): string {
  return `${track.isNowPlaying ? '1' : '0'}|${track.title}|${track.album}|${track.artist}|${track.coverUrl ?? ''}`
}

async function fetchTrack(signal: AbortSignal): Promise<{
  track: TrackSnapshot | null
  error: string | null
}> {
  try {
    const requestUrl = `${LAST_FM_ENDPOINT}?_=${Date.now()}`
    const response = await fetch(requestUrl, {
      method: 'GET',
      cache: 'no-store',
      signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      let serverError = ''
      try {
        const payload = (await response.json()) as LastFmResponse
        serverError = payload.error?.trim() ?? ''
      } catch {
        serverError = ''
      }
      return {
        track: null,
        error:
          serverError || `Last.fm request failed (${response.status}).`,
      }
    }

    const payload = (await response.json()) as LastFmResponse
    const track = normalizeTrack(payload)

    if (!track) {
      return {
        track: null,
        error: payload.error || 'No playable track found from Last.fm.',
      }
    }

    return { track, error: null }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { track: null, error: 'Last.fm request timed out.' }
    }

    return { track: null, error: 'Unable to reach Last.fm right now.' }
  }
}

export function LastFmStatus() {
  const [track, setTrack] = useState<TrackSnapshot | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showCoverPreview, setShowCoverPreview] = useState(false)
  const [coverLoadFailed, setCoverLoadFailed] = useState(false)
  const [statusText, setStatusText] = useState('Loading Last.fm status...')
  const [previewPosition, setPreviewPosition] = useState({ left: 0, top: 0 })
  const signatureRef = useRef<string>('')
  const coverButtonRef = useRef<HTMLButtonElement | null>(null)
  const coverPreviewRef = useRef<HTMLDivElement | null>(null)
  const isClient = typeof window !== 'undefined'

  useEffect(() => {
    let isDisposed = false
    let failureCount = 0
    let timer: number | null = null
    let inFlightController: AbortController | null = null

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
      }
    }

    const getBaseDelay = () =>
      document.visibilityState === 'visible' ? VISIBLE_POLL_MS : HIDDEN_POLL_MS

    const scheduleNext = (delayMs: number) => {
      clearTimer()
      timer = window.setTimeout(runPoll, delayMs)
    }

    const runPoll = async () => {
      inFlightController?.abort()
      const controller = new AbortController()
      inFlightController = controller

      const timeoutTimer = window.setTimeout(() => {
        controller.abort()
      }, REQUEST_TIMEOUT_MS)

      const { track: nextTrack, error } = await fetchTrack(controller.signal)
      window.clearTimeout(timeoutTimer)

      if (isDisposed) return

      if (nextTrack) {
        failureCount = 0
        const nextSignature = createSignature(nextTrack)

        if (nextSignature !== signatureRef.current) {
          signatureRef.current = nextSignature
          setTrack(nextTrack)
          setShowDetails(false)
          setCoverLoadFailed(false)
          setShowCoverPreview(false)
        }

        setStatusText('')
      } else {
        failureCount += 1
        setStatusText(error ?? 'Last.fm activity unavailable.')
      }

      const baseDelay = getBaseDelay()
      const nextDelay = nextTrack
        ? baseDelay
        : Math.min(
            baseDelay * 2 ** Math.min(failureCount - 1, 4),
            MAX_FAILURE_BACKOFF_MS,
          )

      scheduleNext(nextDelay)
    }

    const refreshSoon = () => {
      if (document.visibilityState !== 'visible') return
      scheduleNext(0)
    }

    runPoll()
    document.addEventListener('visibilitychange', refreshSoon)
    window.addEventListener('focus', refreshSoon)

    return () => {
      isDisposed = true
      clearTimer()
      inFlightController?.abort()
      document.removeEventListener('visibilitychange', refreshSoon)
      window.removeEventListener('focus', refreshSoon)
    }
  }, [])

  useEffect(() => {
    if (!showCoverPreview) return

    const updatePreviewPosition = () => {
      const button = coverButtonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const previewSize = window.matchMedia('(min-width: 640px)').matches
        ? 128
        : 112

      const clampedLeft = Math.min(
        Math.max(rect.left, PREVIEW_MARGIN_PX),
        window.innerWidth - previewSize - PREVIEW_MARGIN_PX,
      )

      let top = rect.bottom + PREVIEW_GAP_PX
      if (top + previewSize > window.innerHeight - PREVIEW_MARGIN_PX) {
        top = Math.max(
          PREVIEW_MARGIN_PX,
          rect.top - previewSize - PREVIEW_GAP_PX,
        )
      }

      setPreviewPosition({ left: clampedLeft, top })
    }

    updatePreviewPosition()

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (coverButtonRef.current?.contains(target)) return
      if (coverPreviewRef.current?.contains(target)) return
      setShowCoverPreview(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCoverPreview(false)
      }
    }

    const handleViewportChange = () => {
      updatePreviewPosition()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [showCoverPreview])

  const showCover = Boolean(track?.coverUrl) && !coverLoadFailed
  const isNowPlaying = track?.isNowPlaying ?? false
  const statePrefix = isNowPlaying ? 'Listening to ' : 'Last listened to '

  return (
    <section className='mt-4'>
      <div className='flex items-center gap-2 text-rurikon-500'>
        {showCover ? (
          <div className='relative shrink-0'>
            <button
              ref={coverButtonRef}
              type='button'
              onClick={() => setShowCoverPreview((prev) => !prev)}
              className='block rounded-[3px] focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-[3px] focus-visible:outline-offset-1 focus-visible:outline-dotted'
              aria-label='Toggle album cover preview'
              aria-expanded={showCoverPreview}
              aria-controls='lastfm-cover-preview'
            >
              <img
                src={track!.coverUrl!}
                alt='Current album cover'
                className='h-6 w-6 rounded-[3px] border border-rurikon-border object-cover transition-transform duration-200 ease-out hover:scale-105'
                loading='eager'
                decoding='async'
                draggable={false}
                onError={() => {
                  setCoverLoadFailed(true)
                  setShowCoverPreview(false)
                }}
              />
            </button>
          </div>
        ) : null}

        {track ? (
          <button
            type='button'
            onClick={() => setShowDetails((prev) => !prev)}
            className='min-w-0 flex-1 text-left decoration-from-font underline underline-offset-2 decoration-rurikon-300 hover:decoration-rurikon-600 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-offset-1 focus-visible:outline-dotted'
            aria-expanded={showDetails}
            aria-controls='lastfm-track-details'
          >
            <span className='mr-1'>{statePrefix}</span>
            <strong className='font-semibold text-rurikon-700 [overflow-wrap:anywhere]'>
              {track.title}
            </strong>
          </button>
        ) : (
          <p className='m-0 text-rurikon-400'>{statusText}</p>
        )}
      </div>

      {track && showDetails ? (
        <div id='lastfm-track-details' className='mt-2 text-sm text-rurikon-400'>
          <p className='m-0 [overflow-wrap:anywhere]'>
            album: <span className='text-rurikon-600'>{track.album || 'unknown'}</span>
          </p>
          <p className='m-0 [overflow-wrap:anywhere]'>
            artist: <span className='text-rurikon-600'>{track.artist || 'unknown'}</span>
          </p>
        </div>
      ) : null}

      {isClient && showCover
        ? createPortal(
            <div
              className='fixed inset-0 z-30 pointer-events-none'
              aria-hidden={!showCoverPreview}
            >
              <div
                ref={coverPreviewRef}
                id='lastfm-cover-preview'
                className={`absolute origin-top-left transition-all duration-200 ease-out ${showCoverPreview ? 'pointer-events-auto opacity-100 scale-100 translate-y-0' : 'pointer-events-none opacity-0 scale-95 -translate-y-1'}`}
                style={{
                  left: `${previewPosition.left}px`,
                  top: `${previewPosition.top}px`,
                }}
              >
                <img
                  src={track!.coverUrl!}
                  alt='Album cover preview'
                  className='h-28 w-28 sm:h-32 sm:w-32 rounded-md border border-rurikon-border bg-[var(--surface-raised)] object-cover shadow-[var(--overlay-shadow)]'
                  loading='lazy'
                  decoding='async'
                  draggable={false}
                  onError={() => {
                    setCoverLoadFailed(true)
                    setShowCoverPreview(false)
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
