'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { getDefaultReciter, getReciterById, RECITERS } from '@/app/quran/lib/reciters'
import { readStorageValue, writeStorageValue } from '@/app/quran/lib/storage'
import type { PlayerState, Reciter, Surah } from '@/app/quran/types/quran'

const RECITER_STORAGE_KEY = 'quran:selected-reciter:v2'
const AUTOPLAY_STORAGE_KEY = 'quran:autoplay-next:v1'

const DEFAULT_RECITER = getDefaultReciter()

type LoadSurahOptions = {
  autoplay?: boolean
  startAt?: number
  reciter?: Reciter
}

type AudioPlayerContextValue = PlayerState & {
  currentSurahIndex: number
  hasNext: boolean
  hasPrevious: boolean
  isVisible: boolean
  isResolvingSource: boolean
  audioError: string | null
  reciters: Reciter[]
  playSurah: (surah: Surah) => Promise<void>
  play: () => Promise<void>
  pause: () => void
  close: () => void
  playNext: () => Promise<void>
  playPrevious: () => Promise<void>
  seekToFraction: (fraction: number) => void
  seekBy: (seconds: number) => void
  setPlaybackQueue: (surahs: Surah[]) => void
  setCurrentReciterById: (reciterId: string) => void
  setLooping: (value: boolean) => void
  setAutoplayNext: (value: boolean) => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null)

async function resolveAudioSource(reciter: Reciter, surahNumber: number) {
  if (!reciter.fallback) {
    return reciter.primary(surahNumber)
  }

  try {
    const response = await fetch(
      `/api/quran/audio-source?reciter=${encodeURIComponent(reciter.id)}&surah=${surahNumber}`,
      {
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      return reciter.primary(surahNumber)
    }

    const payload = (await response.json()) as { url?: string }
    return typeof payload.url === 'string' ? payload.url : reciter.primary(surahNumber)
  } catch {
    return reciter.primary(surahNumber)
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tagName = target.tagName
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    tagName === 'BUTTON'
  )
}

export function PlayerProvider({
  surahs,
  children,
}: React.PropsWithChildren<{ surahs: Surah[] }>) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentSurahRef = useRef<Surah | null>(null)
  const currentReciterRef = useRef<Reciter>(DEFAULT_RECITER)
  const playbackQueueRef = useRef<Surah[]>(surahs)
  const allSurahsRef = useRef<Surah[]>(surahs)
  const pendingSeekRef = useRef<number | null>(null)
  const pendingAutoplayRef = useRef(false)
  const requestIdRef = useRef(0)
  const activeSourceUrlRef = useRef<string | null>(null)
  const reciterReloadGuardRef = useRef(false)

  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null)
  const [currentReciter, setCurrentReciter] = useState<Reciter>(DEFAULT_RECITER)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isResolvingSource, setIsResolvingSource] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isLooping, setIsLooping] = useState(false)
  const [autoplayNext, setAutoplayNextState] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const storedReciterId = readStorageValue<string | null>(RECITER_STORAGE_KEY, null)
    const storedAutoplay = readStorageValue<boolean>(AUTOPLAY_STORAGE_KEY, true)

    if (storedReciterId) {
      setCurrentReciter(getReciterById(storedReciterId))
    }

    setAutoplayNextState(storedAutoplay)
    reciterReloadGuardRef.current = true
  }, [])

  useEffect(() => {
    currentReciterRef.current = currentReciter
    writeStorageValue(RECITER_STORAGE_KEY, currentReciter.id)
  }, [currentReciter])

  useEffect(() => {
    writeStorageValue(AUTOPLAY_STORAGE_KEY, autoplayNext)
  }, [autoplayNext])

  useEffect(() => {
    allSurahsRef.current = surahs
    if (playbackQueueRef.current.length === 0) {
      playbackQueueRef.current = surahs
    }
  }, [surahs])

  useEffect(() => {
    currentSurahRef.current = currentSurah
  }, [currentSurah])

  const getActiveQueue = useCallback(() => {
    const queue = playbackQueueRef.current
    const active = currentSurahRef.current

    if (active && queue.some((item) => item.id === active.id)) {
      return queue
    }

    return allSurahsRef.current
  }, [])

  const getAdjacentSurah = useCallback(
    (direction: -1 | 1) => {
      const active = currentSurahRef.current
      if (!active) {
        return null
      }

      const queue = getActiveQueue()
      const index = queue.findIndex((item) => item.id === active.id)
      if (index === -1) {
        return null
      }

      return queue[index + direction] ?? null
    },
    [getActiveQueue],
  )

  const close = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }

    requestIdRef.current += 1
    activeSourceUrlRef.current = null
    pendingSeekRef.current = null
    pendingAutoplayRef.current = false
    setCurrentSurah(null)
    setIsPlaying(false)
    setIsVisible(false)
    setIsResolvingSource(false)
    setAudioError(null)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const loadSurah = useCallback(
    async (surah: Surah, options: LoadSurahOptions = {}) => {
      const reciter = options.reciter ?? currentReciterRef.current
      const autoplay = options.autoplay ?? true
      const startAt = options.startAt ?? 0
      const requestId = requestIdRef.current + 1

      requestIdRef.current = requestId
      setCurrentSurah(surah)
      setIsVisible(true)
      setIsResolvingSource(true)
      setAudioError(null)
      pendingSeekRef.current = startAt > 0 ? startAt : null
      pendingAutoplayRef.current = autoplay

      const sourceUrl = await resolveAudioSource(reciter, surah.id)
      if (requestIdRef.current !== requestId) {
        return
      }

      const audio = audioRef.current
      if (!audio) {
        return
      }

      activeSourceUrlRef.current = sourceUrl
      audio.pause()
      audio.src = sourceUrl
      audio.load()

      if (!autoplay) {
        setIsPlaying(false)
      }
    },
    [],
  )

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (!audio.src && currentSurahRef.current) {
      await loadSurah(currentSurahRef.current, { autoplay: true })
      return
    }

    setAudioError(null)

    try {
      await audio.play()
      setIsVisible(true)
    } catch {
      setAudioError('Playback was blocked before the audio could start.')
    }
  }, [loadSurah])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const playSurah = useCallback(
    async (surah: Surah) => {
      const active = currentSurahRef.current
      const audio = audioRef.current

      if (active && active.id === surah.id && audio?.src) {
        if (audio.paused) {
          await play()
        } else {
          pause()
        }
        return
      }

      await loadSurah(surah, { autoplay: true })
    },
    [loadSurah, pause, play],
  )

  const playNext = useCallback(async () => {
    const nextSurah = getAdjacentSurah(1)
    if (!nextSurah) {
      close()
      return
    }

    await loadSurah(nextSurah, { autoplay: true })
  }, [close, getAdjacentSurah, loadSurah])

  const playPrevious = useCallback(async () => {
    const previousSurah = getAdjacentSurah(-1)
    if (!previousSurah) {
      return
    }

    await loadSurah(previousSurah, { autoplay: true })
  }, [getAdjacentSurah, loadSurah])

  const seekToFraction = useCallback((fraction: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return
    }

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.duration * fraction))
  }, [])

  const seekBy = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.currentTime = Math.max(0, audio.currentTime + seconds)
  }, [])

  const setPlaybackQueue = useCallback((queue: Surah[]) => {
    playbackQueueRef.current = queue
  }, [])

  const setCurrentReciterById = useCallback((reciterId: string) => {
    setCurrentReciter(getReciterById(reciterId))
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.loop = isLooping
  }, [isLooping])

  useEffect(() => {
    if (!reciterReloadGuardRef.current) {
      return
    }

    const active = currentSurahRef.current
    if (!active) {
      return
    }

    const resumeAt = audioRef.current?.currentTime ?? 0
    const wasPlaying = !(audioRef.current?.paused ?? true)
    void loadSurah(active, {
      autoplay: wasPlaying,
      startAt: resumeAt,
      reciter: currentReciter,
    })
  }, [currentReciter, loadSurah])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    }

    const handleLoadedMetadata = () => {
      if (pendingSeekRef.current != null && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(audio.duration, pendingSeekRef.current)
        pendingSeekRef.current = null
      }

      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)

      if (pendingAutoplayRef.current) {
        pendingAutoplayRef.current = false
        void audio.play().catch(() => {
          setAudioError('Playback was blocked before the audio could start.')
          setIsResolvingSource(false)
        })
      } else {
        setIsResolvingSource(false)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setIsVisible(true)
      setIsResolvingSource(false)
      setAudioError(null)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleWaiting = () => {
      if (currentSurahRef.current) {
        setIsResolvingSource(true)
      }
    }

    const handlePlaying = () => {
      setIsResolvingSource(false)
    }

    const handleEnded = () => {
      if (audio.loop) {
        return
      }

      if (autoplayNext && getAdjacentSurah(1)) {
        void playNext()
        return
      }

      close()
    }

    const handleError = () => {
      const activeSurah = currentSurahRef.current
      const activeReciter = currentReciterRef.current
      const fallbackUrl = activeSurah ? activeReciter.fallback?.(activeSurah.id) : undefined

      if (fallbackUrl && activeSourceUrlRef.current !== fallbackUrl) {
        activeSourceUrlRef.current = fallbackUrl
        pendingAutoplayRef.current = true
        setAudioError(null)
        audio.src = fallbackUrl
        audio.load()
        return
      }

      setIsResolvingSource(false)
      setIsPlaying(false)
      setAudioError('Unable to load this recitation right now.')
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [autoplayNext, close, getAdjacentSurah, playNext])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        if (audioRef.current?.paused) {
          void play()
        } else {
          pause()
        }
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        seekBy(10)
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        seekBy(-10)
        return
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        void playNext()
        return
      }

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        void playPrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pause, play, playNext, playPrevious, seekBy])

  const activeQueue = getActiveQueue()
  const currentSurahIndex = currentSurah
    ? activeQueue.findIndex((item) => item.id === currentSurah.id)
    : -1

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      currentSurah,
      currentReciter,
      isPlaying,
      isLooping,
      autoplayNext,
      progress: duration > 0 ? currentTime / duration : 0,
      duration,
      currentTime,
      currentSurahIndex,
      hasNext: currentSurahIndex >= 0 && currentSurahIndex < activeQueue.length - 1,
      hasPrevious: currentSurahIndex > 0,
      isVisible,
      isResolvingSource,
      audioError,
      reciters: RECITERS,
      playSurah,
      play,
      pause,
      close,
      playNext,
      playPrevious,
      seekToFraction,
      seekBy,
      setPlaybackQueue,
      setCurrentReciterById,
      setLooping: setIsLooping,
      setAutoplayNext: setAutoplayNextState,
    }),
    [
      activeQueue.length,
      audioError,
      autoplayNext,
      close,
      currentReciter,
      currentSurah,
      currentSurahIndex,
      currentTime,
      duration,
      isLooping,
      isPlaying,
      isResolvingSource,
      isVisible,
      pause,
      play,
      playNext,
      playPrevious,
      playSurah,
      seekBy,
      seekToFraction,
      setCurrentReciterById,
      setPlaybackQueue,
    ],
  )

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload='none' />
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)

  if (!context) {
    throw new Error('useAudioPlayer must be used within a PlayerProvider.')
  }

  return context
}
