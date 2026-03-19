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

type SearchVerse = {
  chapterId: number
  chapterName: string
  chapterNameAr: string
  verseId: number
  ar: string
  en: string
  normalizedAr: string
  normalizedEn: string
}

const STORAGE_KEY = 'quran-player-preferences-v1'
const QURAN_DATA_URL = '/quran/quran-data.json'
const CHAPTER_COUNT = 114

const FALLBACK_CHAPTERS = Array.from({ length: CHAPTER_COUNT }, (_unused, index) => ({
  id: index + 1,
  name: `Surah ${index + 1}`,
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
    baseUrl:
      'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal',
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
  'inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--color-rurikon-border)] px-4 py-2 text-rurikon-700 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-900 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-md focus-visible:outline-offset-2 focus-visible:outline-dotted disabled:opacity-60 disabled:hover:border-[var(--color-rurikon-border)] disabled:hover:text-rurikon-700'

const ARABIC_DIACRITICS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g

type AyahReference = { chapterId: number; verseId: number }

function chapterLabel(chapter: { id: number; name: string }): string {
  return `${String(chapter.id).padStart(3, '0')} - ${chapter.name}`
}

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(ARABIC_DIACRITICS_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseAyahReference(query: string): AyahReference | null {
  const match = query.trim().match(/^(\d{1,3})\s*[:.-]\s*(\d{1,3})$/)
  if (!match) return null

  const chapterId = Number(match[1])
  const verseId = Number(match[2])

  if (
    !Number.isInteger(chapterId) ||
    !Number.isInteger(verseId) ||
    chapterId < 1 ||
    chapterId > CHAPTER_COUNT ||
    verseId < 1
  ) {
    return null
  }

  return { chapterId, verseId }
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
      typeof parsed.reciterId === 'string'
        ? parsed.reciterId
        : RECITERS[0]?.id ?? ''
    const chapterId = typeof parsed.chapterId === 'number' ? parsed.chapterId : 1

    const reciterExists = RECITERS.some((item) => item.id === reciterId)
    const chapterExists = Number.isInteger(chapterId) && chapterId >= 1 && chapterId <= 114

    if (!reciterExists || !chapterExists) {
      return null
    }

    return { reciterId, chapterId }
  } catch {
    return null
  }
}

function isQuranDataPayload(value: unknown): value is QuranData {
  if (!value || typeof value !== 'object') {
    return false
  }

  if (!('chapters' in value) || !Array.isArray(value.chapters)) {
    return false
  }

  return value.chapters.length > 0
}

export default function QuranPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasLoadedPreferencesRef = useRef(false)

  const [reciterId, setReciterId] = useState<string>(() => RECITERS[0]?.id ?? '')
  const [chapterId, setChapterId] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  const [quranData, setQuranData] = useState<QuranData | null>(null)
  const [readerError, setReaderError] = useState<string | null>(null)
  const [isReaderLoading, setIsReaderLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedAyah, setFocusedAyah] = useState<AyahReference | null>(null)

  const chapters = useMemo(
    () => quranData?.chapters.map((item) => ({ id: item.id, name: item.name })) ?? FALLBACK_CHAPTERS,
    [quranData],
  )

  const activeReciter = useMemo(
    () => RECITERS.find((item) => item.id === reciterId) ?? RECITERS[0],
    [reciterId],
  )

  const activeChapter = useMemo(
    () => chapters.find((item) => item.id === chapterId) ?? chapters[0] ?? FALLBACK_CHAPTERS[0],
    [chapterId, chapters],
  )

  const activeChapterData = useMemo(
    () => quranData?.chapters.find((item) => item.id === chapterId) ?? null,
    [chapterId, quranData],
  )

  const audioUrl = useMemo(() => {
    const safeReciter = activeReciter ?? RECITERS[0]
    const safeChapter = activeChapter ?? FALLBACK_CHAPTERS[0]
    return `${safeReciter.baseUrl}/${safeChapter.id}.mp3`
  }, [activeChapter, activeReciter])

  const searchableVerses = useMemo(() => {
    if (!quranData) return []

    return quranData.chapters.flatMap((chapter) =>
      chapter.verses.map((verse): SearchVerse => ({
        chapterId: chapter.id,
        chapterName: chapter.name,
        chapterNameAr: chapter.nameAr,
        verseId: verse.id,
        ar: verse.ar,
        en: verse.en,
        normalizedAr: normalizeForSearch(verse.ar),
        normalizedEn: normalizeForSearch(verse.en),
      })),
    )
  }, [quranData])

  const trimmedQuery = searchQuery.trim()
  const normalizedQuery = normalizeForSearch(trimmedQuery)
  const referencedAyah = parseAyahReference(trimmedQuery)

  const searchResults = useMemo(() => {
    if (!quranData) return []

    if (referencedAyah) {
      const chapter = quranData.chapters.find((item) => item.id === referencedAyah.chapterId)
      const verse = chapter?.verses.find((item) => item.id === referencedAyah.verseId)

      if (!chapter || !verse) {
        return []
      }

      return [
        {
          chapterId: chapter.id,
          chapterName: chapter.name,
          chapterNameAr: chapter.nameAr,
          verseId: verse.id,
          ar: verse.ar,
          en: verse.en,
          normalizedAr: normalizeForSearch(verse.ar),
          normalizedEn: normalizeForSearch(verse.en),
        },
      ]
    }

    if (normalizedQuery.length < 2) {
      return []
    }

    return searchableVerses
      .filter(
        (verse) =>
          verse.normalizedAr.includes(normalizedQuery) ||
          verse.normalizedEn.includes(normalizedQuery),
      )
      .slice(0, 50)
  }, [normalizedQuery, quranData, referencedAyah, searchableVerses])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let timeoutId: number | null = null
    const stored = parseStoredPreferences(window.localStorage.getItem(STORAGE_KEY))

    if (!stored) {
      hasLoadedPreferencesRef.current = true
      return
    }

    timeoutId = window.setTimeout(() => {
      setReciterId(stored.reciterId)
      setChapterId(stored.chapterId)
      hasLoadedPreferencesRef.current = true
    }, 0)

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedPreferencesRef.current) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ reciterId, chapterId }))
  }, [chapterId, reciterId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    const handleError = () => {
      setIsPlaying(false)
      setAudioError('Could not load this recitation. Try another reciter.')
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.pause()
    audio.load()
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

        if (!response.ok) {
          throw new Error(`Failed to fetch Quran data: ${response.status}`)
        }

        const payload: unknown = await response.json()

        if (!isQuranDataPayload(payload)) {
          throw new Error('Invalid Quran data payload')
        }

        if (!isMounted) {
          return
        }

        setQuranData(payload)
      } catch {
        if (!isMounted || controller.signal.aborted) {
          return
        }

        setReaderError('Could not load Quran text right now.')
      } finally {
        if (isMounted) {
          setIsReaderLoading(false)
        }
      }
    }

    void loadQuran()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!focusedAyah || focusedAyah.chapterId !== chapterId) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const element = document.getElementById(
        `ayah-${focusedAyah.chapterId}-${focusedAyah.verseId}`,
      )

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 60)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [chapterId, focusedAyah, quranData])

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

  const onSelectAyah = (ayah: AyahReference) => {
    setFocusedAyah(ayah)
    setChapterId(ayah.chapterId)
  }

  return (
    <div className='space-y-5'>
      <section className='rounded-xl border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5 space-y-4'>
        <div className='space-y-1'>
          <h2 className='m-0 text-rurikon-700 font-medium'>Listen</h2>
          <p className='text-rurikon-400 text-sm'>
            Static mode: direct audio files, no external API requests at runtime.
          </p>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='block space-y-1'>
            <span className='text-rurikon-500'>Reciter</span>
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

          <label className='block space-y-1'>
            <span className='text-rurikon-500'>Surah</span>
            <select
              className={INPUT_CLASS}
              value={activeChapter?.id ?? 1}
              onChange={(event) => {
                setAudioError(null)
                setFocusedAyah(null)
                setChapterId(Number(event.target.value))
              }}
            >
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapterLabel(chapter)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <button type='button' className={BUTTON_CLASS} onClick={() => void onPlayPause()}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <a className={BUTTON_CLASS} href={audioUrl} target='_blank' rel='noreferrer'>
            Open MP3
          </a>
        </div>

        <audio ref={audioRef} className='w-full' controls preload='none'>
          <source src={audioUrl} type='audio/mpeg' />
          Your browser does not support audio playback.
        </audio>

        <p className='text-sm text-rurikon-500'>
          {chapterLabel(activeChapter ?? FALLBACK_CHAPTERS[0])} by{' '}
          {activeReciter?.label ?? RECITERS[0]?.label}
        </p>

        {audioError ? <p className='text-sm text-rurikon-500'>{audioError}</p> : null}
      </section>

      <section className='rounded-xl border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5 space-y-4'>
        <div className='space-y-1'>
          <h2 className='m-0 text-rurikon-700 font-medium'>Read & Search</h2>
          <p className='text-rurikon-400 text-sm'>
            Search by ayah text or reference like <code>2:255</code>.
          </p>
        </div>

        <div className='grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]'>
          <label className='block space-y-1'>
            <span className='text-rurikon-500'>Current Surah</span>
            <select
              className={INPUT_CLASS}
              value={activeChapter?.id ?? 1}
              onChange={(event) => {
                setFocusedAyah(null)
                setChapterId(Number(event.target.value))
              }}
            >
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapterLabel(chapter)}
                </option>
              ))}
            </select>
          </label>

          <label className='block space-y-1'>
            <span className='text-rurikon-500'>Find Ayah</span>
            <input
              className={INPUT_CLASS}
              value={searchQuery}
              placeholder='Try mercy, الرحمن, or 2:255'
              onChange={(event) => {
                setSearchQuery(event.target.value)
              }}
            />
          </label>
        </div>

        {trimmedQuery.length > 0 ? (
          <div className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--background)]'>
            <div className='px-3 py-2 border-b border-[var(--color-rurikon-border)] text-sm text-rurikon-500'>
              {searchResults.length > 0
                ? `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`
                : referencedAyah || normalizedQuery.length >= 2
                  ? 'No ayah found for this search.'
                  : 'Type at least 2 characters or use reference format.'}
            </div>

            {searchResults.length > 0 ? (
              <ul className='max-h-72 overflow-y-auto divide-y divide-[var(--color-rurikon-border)]'>
                {searchResults.map((result) => (
                  <li key={`${result.chapterId}:${result.verseId}`}>
                    <button
                      type='button'
                      className='w-full text-left px-3 py-2 hover:bg-[var(--surface-soft)] focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-[-2px]'
                      onClick={() => {
                        onSelectAyah({ chapterId: result.chapterId, verseId: result.verseId })
                      }}
                    >
                      <p className='text-sm text-rurikon-500'>
                        {result.chapterId}:{result.verseId} - {result.chapterName}
                      </p>
                      <p
                        dir='rtl'
                        lang='ar'
                        className='text-right text-rurikon-700 text-base leading-8 mt-1'
                      >
                        {result.ar}
                      </p>
                      <p className='text-sm text-rurikon-500 leading-relaxed mt-1'>{result.en}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {isReaderLoading ? (
          <p className='text-rurikon-400'>Loading Quran text...</p>
        ) : readerError ? (
          <p className='text-rurikon-500'>{readerError}</p>
        ) : activeChapterData ? (
          <div className='space-y-3'>
            <div className='flex flex-wrap items-baseline justify-between gap-2'>
              <h3 className='m-0 text-rurikon-700 text-lg font-medium'>
                {activeChapterData.name}{' '}
                {activeChapterData.nameAr ? (
                  <span dir='rtl' lang='ar' className='text-rurikon-500 text-base'>
                    ({activeChapterData.nameAr})
                  </span>
                ) : null}
              </h3>
              <p className='text-sm text-rurikon-400'>
                {activeChapterData.verses.length} ayah{activeChapterData.verses.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className='space-y-2'>
              {activeChapterData.verses.map((verse) => {
                const isFocused =
                  focusedAyah?.chapterId === activeChapterData.id &&
                  focusedAyah.verseId === verse.id

                return (
                  <article
                    id={`ayah-${activeChapterData.id}-${verse.id}`}
                    key={verse.id}
                    className={
                      isFocused
                        ? 'rounded-lg border border-[var(--color-rurikon-border-strong)] bg-[var(--background)] p-3 sm:p-4'
                        : 'rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--background)] p-3 sm:p-4'
                    }
                  >
                    <p className='text-xs text-rurikon-400'>{activeChapterData.id}:{verse.id}</p>
                    <p
                      dir='rtl'
                      lang='ar'
                      className='mt-2 text-right text-[1.3rem] leading-[2.25rem] text-rurikon-700'
                    >
                      {verse.ar}
                    </p>
                    <p className='mt-2 text-sm text-rurikon-500 leading-relaxed'>{verse.en}</p>
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
          <p className='text-rurikon-500'>Could not show this surah right now.</p>
        )}

        {quranData?.source ? (
          <p className='text-xs text-rurikon-400'>
            Local data source snapshot: {quranData.source}
          </p>
        ) : null}
      </section>
    </div>
  )
}
