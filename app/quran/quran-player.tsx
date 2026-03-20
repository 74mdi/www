'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Reciter = {
  id: string
  label: string
  baseUrl: string
}

type Verse = {
  id: number
  ar: string
  en: string
}

type QuranChapter = {
  id: number
  name: string
  nameAr: string
  verses: Verse[]
}

type QuranData = {
  generatedAt: string
  source: string
  chapters: QuranChapter[]
}

const STORAGE_KEY = 'quran-player-preferences-v1'
const QURAN_DATA_URL = '/quran/quran-data.json'
const CHAPTER_COUNT = 114

const FALLBACK_CHAPTERS: QuranChapter[] = Array.from({ length: CHAPTER_COUNT }, (_unused, index) => ({
  id: index + 1,
  name: `Surah ${index + 1}`,
  nameAr: '',
  verses: [],
}))

const RECITERS: Reciter[] = [
  {
    id: 'mishari_al_afasy',
    label: 'Mishari Alafasy',
    baseUrl: 'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal',
  },
  {
    id: 'abdurrahmaan_as_sudais',
    label: 'Abdurrahmaan As-Sudais',
    baseUrl: 'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal',
  },
  {
    id: 'hani_ar_rifai',
    label: 'Hani Ar-Rifai',
    baseUrl: 'https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal',
  },
  {
    id: 'abu_bakr_shatri',
    label: 'Abu Bakr Ash-Shaatree',
    baseUrl: 'https://download.quranicaudio.com/qdc/abu_bakr_shatri/murattal',
  },
  {
    id: 'khalil_al_husary',
    label: 'Khalil Al-Husary',
    baseUrl: 'https://download.quranicaudio.com/qdc/khalil_al_husary/murattal',
  },
  {
    id: 'abdul_baset_mujawwad',
    label: 'Abdul Baset Mujawwad',
    baseUrl: 'https://download.quranicaudio.com/qdc/abdul_baset/mujawwad',
  },
]

const INPUT_CLASS =
  'w-full rounded-md border border-[var(--color-rurikon-border)] bg-[var(--background)] px-3 py-2 text-rurikon-600 placeholder:text-rurikon-300 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'

const BUTTON_CLASS =
  'inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--color-rurikon-border)] px-3 py-1.5 text-sm text-rurikon-700 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-900 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-md focus-visible:outline-offset-2 focus-visible:outline-dotted disabled:opacity-60 disabled:hover:border-[var(--color-rurikon-border)] disabled:hover:text-rurikon-700'

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }
  const rounded = Math.floor(seconds)
  const minutes = Math.floor(rounded / 60)
  const remainingSeconds = rounded % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function parseStoredPreferences(value: string | null): {
  reciterId: string
  chapterId: number
} | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as {
      reciterId?: unknown
      chapterId?: unknown
    }
    const reciterId =
      typeof parsed.reciterId === 'string' ? parsed.reciterId : RECITERS[0]?.id ?? ''
    const chapterId = typeof parsed.chapterId === 'number' ? parsed.chapterId : 1
    const reciterExists = RECITERS.some((item) => item.id === reciterId)
    const chapterExists = Number.isInteger(chapterId) && chapterId >= 1 && chapterId <= 114
    if (!reciterExists || !chapterExists) return null
    return { reciterId, chapterId }
  } catch {
    return null
  }
}

function isQuranDataPayload(value: unknown): value is QuranData {
  if (!value || typeof value !== 'object') return false
  if (!('chapters' in value) || !Array.isArray(value.chapters)) return false
  return value.chapters.length > 0
}

export default function QuranPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasLoadedPreferencesRef = useRef(false)
  const expandedRef = useRef<HTMLDivElement>(null)

  const [reciterId, setReciterId] = useState<string>(() => RECITERS[0]?.id ?? '')
  const [expandedChapterId, setExpandedChapterId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [positionSeconds, setPositionSeconds] = useState(0)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [bufferedSeconds, setBufferedSeconds] = useState(0)
  const [isAudioLoading, setIsAudioLoading] = useState(false)

  const [quranData, setQuranData] = useState<QuranData | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)

  const chapters = useMemo(
    () => quranData?.chapters ?? FALLBACK_CHAPTERS,
    [quranData],
  )

  const activeReciter = useMemo(
    () => RECITERS.find((item) => item.id === reciterId) ?? RECITERS[0],
    [reciterId],
  )

  const activeChapterData = useMemo(
    () =>
      expandedChapterId !== null
        ? (quranData?.chapters.find((item) => item.id === expandedChapterId) ?? null)
        : null,
    [expandedChapterId, quranData],
  )

  const audioUrl = useMemo(() => {
    if (expandedChapterId === null) return ''
    const safeReciter = activeReciter ?? RECITERS[0]
    return `${safeReciter.baseUrl}/${expandedChapterId}.mp3`
  }, [expandedChapterId, activeReciter])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let timeoutId: number | null = null
    const stored = parseStoredPreferences(window.localStorage.getItem(STORAGE_KEY))
    if (!stored) {
      hasLoadedPreferencesRef.current = true
      return
    }
    timeoutId = window.setTimeout(() => {
      setReciterId(stored.reciterId)
      hasLoadedPreferencesRef.current = true
    }, 0)
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedPreferencesRef.current) return
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ reciterId, chapterId: expandedChapterId ?? 1 }),
    )
  }, [reciterId, expandedChapterId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateBuffered = () => {
      if (audio.buffered.length === 0) {
        setBufferedSeconds(0)
        return
      }
      const end = audio.buffered.end(audio.buffered.length - 1)
      setBufferedSeconds(Number.isFinite(end) ? end : 0)
    }

    const handlePlay = () => { setIsPlaying(true); setIsAudioLoading(false) }
    const handlePause = () => { setIsPlaying(false) }
    const handleEnded = () => { setIsPlaying(false) }
    const handleError = () => {
      setIsPlaying(false)
      setIsAudioLoading(false)
      setAudioError('Could not load this recitation. Try another reciter.')
    }
    const handleLoadedMetadata = () => {
      setDurationSeconds(Number.isFinite(audio.duration) ? audio.duration : 0)
      setPositionSeconds(Number.isFinite(audio.currentTime) ? audio.currentTime : 0)
      updateBuffered()
      setIsAudioLoading(false)
    }
    const handleDurationChange = () => {
      setDurationSeconds(Number.isFinite(audio.duration) ? audio.duration : 0)
    }
    const handleTimeUpdate = () => {
      setPositionSeconds(Number.isFinite(audio.currentTime) ? audio.currentTime : 0)
    }
    const handleProgress = () => { updateBuffered() }
    const handleSeeking = () => { setIsAudioLoading(true) }
    const handleWaiting = () => { setIsAudioLoading(true) }
    const handleCanPlay = () => {
      setIsAudioLoading(false)
      setDurationSeconds(Number.isFinite(audio.duration) ? audio.duration : 0)
      updateBuffered()
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('progress', handleProgress)
    audio.addEventListener('seeking', handleSeeking)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('progress', handleProgress)
      audio.removeEventListener('seeking', handleSeeking)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    audio.pause()
    audio.currentTime = 0
    audio.load()
    setIsPlaying(false)
    setPositionSeconds(0)
    setDurationSeconds(0)
    setBufferedSeconds(0)
    setAudioError(null)
  }, [audioUrl])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const loadQuran = async () => {
      try {
        const response = await fetch(QURAN_DATA_URL, {
          cache: 'force-cache',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Failed to fetch Quran data: ${response.status}`)
        const payload: unknown = await response.json()
        if (!isQuranDataPayload(payload)) throw new Error('Invalid Quran data payload')
        if (!isMounted) return
        setQuranData(payload)
      } catch {
        if (!isMounted || controller.signal.aborted) return
      } finally {
        if (isMounted) setIsDataLoading(false)
      }
    }

    void loadQuran()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (expandedChapterId === null) return
    if (typeof window === 'undefined') return
    const timeoutId = window.setTimeout(() => {
      expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
    return () => { window.clearTimeout(timeoutId) }
  }, [expandedChapterId])

  const onPlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return
    setAudioError(null)
    if (audio.paused) {
      try {
        await audio.play()
      } catch {
        setAudioError('Playback was blocked by the browser. Tap play again.')
      }
      return
    }
    audio.pause()
  }

  const onSeek = (nextValue: number) => {
    const audio = audioRef.current
    if (!audio) return
    const clampedValue = Math.max(0, Math.min(nextValue, durationSeconds || 0))
    audio.currentTime = clampedValue
    setPositionSeconds(clampedValue)
  }

  const onStepTime = (stepSeconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const baseDuration = Number.isFinite(audio.duration) ? audio.duration : durationSeconds
    const maxTime = Math.max(baseDuration, 0)
    const nextTime = Math.max(0, Math.min(audio.currentTime + stepSeconds, maxTime))
    audio.currentTime = nextTime
    setPositionSeconds(nextTime)
  }

  const onToggleChapter = (chapterId: number) => {
    if (expandedChapterId === chapterId) {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setIsPlaying(false)
      setExpandedChapterId(null)
    } else {
      setExpandedChapterId(chapterId)
      setIsAudioLoading(true)
    }
  }

  const safeDuration = Number.isFinite(durationSeconds) ? durationSeconds : 0
  const safePosition = Math.max(0, Math.min(positionSeconds, safeDuration || positionSeconds))
  const progressPercent = safeDuration > 0 ? (safePosition / safeDuration) * 100 : 0
  const bufferedPercent = safeDuration > 0 ? (bufferedSeconds / safeDuration) * 100 : 0

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <label className='flex items-center gap-2 text-sm text-rurikon-500'>
          <span className='shrink-0'>Reciter</span>
          <select
            className={INPUT_CLASS}
            value={activeReciter?.id ?? ''}
            onChange={(event) => {
              setAudioError(null)
              setReciterId(event.target.value)
            }}
          >
            {RECITERS.map((reciter) => (
              <option key={reciter.id} value={reciter.id}>
                {reciter.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <audio ref={audioRef} className='sr-only' preload='none'>
        {audioUrl ? <source src={audioUrl} type='audio/mpeg' /> : null}
        Your browser does not support audio playback.
      </audio>

      {isDataLoading ? (
        <p className='text-rurikon-400'>Loading surahs…</p>
      ) : (
        <ul>
          {chapters.map((chapter) => {
            const isExpanded = expandedChapterId === chapter.id
            const verseCount = chapter.verses.length

            return (
              <li key={chapter.id}>
                <button
                  type='button'
                  className='group w-full flex gap-1 -mx-2 px-2 py-0.5 justify-between items-center focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-dotted'
                  onClick={() => { onToggleChapter(chapter.id) }}
                >
                  <span className='flex items-baseline gap-2 shrink-0'>
                    <span className='text-xs text-rurikon-200 tabular-nums font-normal group-hover:text-rurikon-400 transition-colors group-hover:transition-none'>
                      {String(chapter.id).padStart(3, '0')}
                    </span>
                    <span
                      className={
                        isExpanded
                          ? 'text-rurikon-700 font-medium'
                          : 'text-rurikon-500 font-medium group-hover:text-rurikon-700 transition-colors group-hover:transition-none'
                      }
                    >
                      {chapter.name}
                    </span>
                  </span>
                  <span className='text-sm dot-leaders flex-1 text-rurikon-100 font-normal group-hover:text-rurikon-500 transition-colors group-hover:transition-none leading-none' />
                  <span className='flex items-baseline gap-3 shrink-0'>
                    {chapter.nameAr ? (
                      <span
                        dir='rtl'
                        lang='ar'
                        className='text-rurikon-300 text-sm font-normal group-hover:text-rurikon-500 transition-colors group-hover:transition-none'
                      >
                        {chapter.nameAr}
                      </span>
                    ) : null}
                    <span className='text-rurikon-200 tabular-nums text-sm font-normal group-hover:text-rurikon-500 transition-colors group-hover:transition-none'>
                      {verseCount > 0 ? `${verseCount}v` : '—'}
                    </span>
                  </span>
                </button>

                {isExpanded ? (
                  <div ref={expandedRef} className='mt-3 mb-4 space-y-4'>
                    <div className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-3 sm:p-4 space-y-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <button
                          type='button'
                          className={BUTTON_CLASS}
                          onClick={() => { void onPlayPause() }}
                        >
                          {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button
                          type='button'
                          className={BUTTON_CLASS}
                          onClick={() => { onStepTime(-10) }}
                        >
                          −10s
                        </button>
                        <button
                          type='button'
                          className={BUTTON_CLASS}
                          onClick={() => { onStepTime(10) }}
                        >
                          +10s
                        </button>
                        <button
                          type='button'
                          className={BUTTON_CLASS}
                          disabled={chapter.id <= 1}
                          onClick={() => { onToggleChapter(chapter.id - 1) }}
                        >
                          Prev
                        </button>
                        <button
                          type='button'
                          className={BUTTON_CLASS}
                          disabled={chapter.id >= CHAPTER_COUNT}
                          onClick={() => { onToggleChapter(chapter.id + 1) }}
                        >
                          Next
                        </button>
                        <a
                          className={BUTTON_CLASS}
                          href={audioUrl}
                          target='_blank'
                          rel='noreferrer'
                        >
                          MP3
                        </a>
                      </div>

                      <div className='space-y-1.5'>
                        <div className='relative h-1.5 rounded-full bg-[var(--color-rurikon-border)] overflow-hidden'>
                          <div
                            className='absolute inset-y-0 left-0 bg-rurikon-300/60'
                            style={{ width: `${Math.max(0, Math.min(bufferedPercent, 100))}%` }}
                          />
                          <div
                            className='absolute inset-y-0 left-0 bg-rurikon-700'
                            style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
                          />
                        </div>
                        <input
                          type='range'
                          min={0}
                          max={Math.max(safeDuration, 1)}
                          step={0.1}
                          value={Math.max(0, Math.min(safePosition, Math.max(safeDuration, 1)))}
                          className='w-full accent-[var(--color-rurikon-700)]'
                          onChange={(event) => { onSeek(Number(event.target.value)) }}
                        />
                        <div className='flex items-center justify-between text-xs text-rurikon-400'>
                          <span>
                            {formatAudioTime(safePosition)} / {formatAudioTime(safeDuration)}
                          </span>
                          <span>
                            {isAudioLoading ? 'Buffering…' : isPlaying ? 'Playing' : 'Paused'}
                          </span>
                        </div>
                      </div>

                      {audioError ? (
                        <p className='text-sm text-rurikon-500'>{audioError}</p>
                      ) : null}
                    </div>

                    {activeChapterData && activeChapterData.verses.length > 0 ? (
                      <div className='space-y-2'>
                        {activeChapterData.verses.map((verse) => (
                          <article
                            key={verse.id}
                            id={`ayah-${activeChapterData.id}-${verse.id}`}
                            className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--background)] px-3 py-3 sm:px-4'
                          >
                            <p className='text-xs text-rurikon-300'>
                              {activeChapterData.id}:{verse.id}
                            </p>
                            <p
                              dir='rtl'
                              lang='ar'
                              className='mt-2 text-right text-[1.2rem] leading-[2.1rem] text-rurikon-700'
                            >
                              {verse.ar}
                            </p>
                            <p className='mt-1.5 text-sm text-rurikon-500 leading-relaxed'>
                              {verse.en}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {quranData?.source ? (
        <p className='text-xs text-rurikon-300'>Source: {quranData.source}</p>
      ) : null}
    </div>
  )
}
