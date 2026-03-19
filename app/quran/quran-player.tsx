'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Reciter = {
  id: number
  reciter_name: string
  style: string | null
}

type Chapter = {
  id: number
  name_simple: string
  name_arabic: string
  translated_name?: {
    name?: string
  }
}

type RecitersResponse = {
  recitations?: Reciter[]
}

type ChaptersResponse = {
  chapters?: Chapter[]
}

type ChapterRecitationResponse = {
  audio_file?: {
    audio_url?: string
  }
}

const INPUT_CLASS =
  'w-full rounded-md border border-[var(--color-rurikon-border)] bg-[var(--background)] px-3 py-2 text-rurikon-600 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'

const BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-md border border-[var(--color-rurikon-border)] bg-[var(--frame-background)] px-3 py-2 text-rurikon-600 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-md focus-visible:outline-offset-2 focus-visible:outline-dotted disabled:opacity-60'

function chapterLabel(chapter: Chapter): string {
  const translated = chapter.translated_name?.name?.trim()
  return `${chapter.id}. ${chapter.name_simple}${translated ? ` — ${translated}` : ''}`
}

function reciterLabel(reciter: Reciter): string {
  return reciter.style
    ? `${reciter.reciter_name} (${reciter.style})`
    : reciter.reciter_name
}

export default function QuranPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [reciters, setReciters] = useState<Reciter[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedReciterId, setSelectedReciterId] = useState<number | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1)
  const [audioUrl, setAudioUrl] = useState('')
  const [loadingLists, setLoadingLists] = useState(true)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      setLoadingLists(true)
      setErrorMessage(null)

      try {
        const [recitersResponse, chaptersResponse] = await Promise.all([
          fetch('https://api.quran.com/api/v4/resources/recitations?language=en', {
            cache: 'no-store',
          }),
          fetch('https://api.quran.com/api/v4/chapters?language=en', {
            cache: 'no-store',
          }),
        ])

        if (!recitersResponse.ok || !chaptersResponse.ok) {
          throw new Error('Unable to load Quran data right now.')
        }

        const recitersData = (await recitersResponse.json()) as RecitersResponse
        const chaptersData = (await chaptersResponse.json()) as ChaptersResponse

        if (cancelled) return

        const nextReciters = recitersData.recitations ?? []
        const nextChapters = chaptersData.chapters ?? []

        setReciters(nextReciters)
        setChapters(nextChapters)

        const preferred =
          nextReciters.find((item) => item.id === 7) ??
          nextReciters.find((item) => item.id === 3) ??
          nextReciters[0]

        setSelectedReciterId(preferred?.id ?? null)
        setSelectedChapterId(nextChapters.find((item) => item.id === 1)?.id ?? 1)
      } catch (error) {
        if (cancelled) return
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to load Quran data.',
        )
      } finally {
        if (!cancelled) {
          setLoadingLists(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedReciterId) return

    let cancelled = false

    const loadAudio = async () => {
      setLoadingAudio(true)
      setErrorMessage(null)

      try {
        const response = await fetch(
          `https://api.quran.com/api/v4/chapter_recitations/${selectedReciterId}/${selectedChapterId}`,
          { cache: 'no-store' },
        )

        if (!response.ok) {
          throw new Error('Unable to load this recitation audio.')
        }

        const data = (await response.json()) as ChapterRecitationResponse
        const nextAudioUrl = data.audio_file?.audio_url?.trim() ?? ''

        if (!nextAudioUrl) {
          throw new Error('Audio URL is not available for this selection.')
        }

        if (cancelled) return

        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }

        setAudioUrl(nextAudioUrl)
        setIsPlaying(false)
      } catch (error) {
        if (cancelled) return
        setAudioUrl('')
        setIsPlaying(false)
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to load recitation.',
        )
      } finally {
        if (!cancelled) {
          setLoadingAudio(false)
        }
      }
    }

    void loadAudio()

    return () => {
      cancelled = true
    }
  }, [selectedChapterId, selectedReciterId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnd = () => setIsPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnd)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnd)
    }
  }, [])

  const selectedReciterName = useMemo(() => {
    if (!selectedReciterId) return 'No reciter'
    const selected = reciters.find((item) => item.id === selectedReciterId)
    return selected ? reciterLabel(selected) : 'No reciter'
  }, [reciters, selectedReciterId])

  const selectedChapterName = useMemo(() => {
    const selected = chapters.find((item) => item.id === selectedChapterId)
    return selected ? chapterLabel(selected) : `Chapter ${selectedChapterId}`
  }, [chapters, selectedChapterId])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    try {
      if (audio.paused) {
        await audio.play()
      } else {
        audio.pause()
      }
    } catch {
      setErrorMessage('Playback was blocked. Press play again.')
    }
  }

  return (
    <section className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/50 p-4 sm:p-5 space-y-4'>
      <div className='space-y-1'>
        <p className='text-rurikon-500 text-sm'>Reciter</p>
        <select
          className={INPUT_CLASS}
          value={selectedReciterId ?? ''}
          disabled={loadingLists || reciters.length === 0}
          onChange={(event) => {
            setSelectedReciterId(Number(event.target.value))
          }}
        >
          {reciters.map((reciter) => (
            <option key={reciter.id} value={reciter.id}>
              {reciterLabel(reciter)}
            </option>
          ))}
        </select>
      </div>

      <div className='space-y-1'>
        <p className='text-rurikon-500 text-sm'>Chapter</p>
        <select
          className={INPUT_CLASS}
          value={selectedChapterId}
          disabled={loadingLists || chapters.length === 0}
          onChange={(event) => {
            setSelectedChapterId(Number(event.target.value))
          }}
        >
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapterLabel(chapter)}
            </option>
          ))}
        </select>
      </div>

      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <button
          type='button'
          className={BUTTON_CLASS}
          disabled={loadingLists || loadingAudio || !audioUrl}
          onClick={() => {
            void togglePlayback()
          }}
        >
          <span aria-hidden='true'>{isPlaying ? '||' : '▶'}</span>
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <p className='text-rurikon-400 text-sm'>
          {loadingLists
            ? 'Loading reciters...'
            : loadingAudio
              ? 'Loading audio...'
              : `${selectedReciterName} · ${selectedChapterName}`}
        </p>
      </div>

      {errorMessage ? (
        <p className='text-rurikon-500 text-sm underline decoration-rurikon-300'>
          {errorMessage}
        </p>
      ) : null}

      <audio ref={audioRef} src={audioUrl || undefined} preload='none' />
    </section>
  )
}
