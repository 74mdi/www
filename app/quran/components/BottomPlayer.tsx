'use client'

import cn from 'clsx'
import { useEffect, useRef } from 'react'

import PlayerProgressBar from '@/app/quran/components/PlayerProgressBar'
import { useAudioPlayer } from '@/app/quran/hooks/useAudioPlayer'

export default function BottomPlayer({
  arabicFontClassName,
}: {
  arabicFontClassName: string
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const {
    audioError,
    autoplayNext,
    close,
    currentReciter,
    currentSurah,
    currentTime,
    duration,
    hasNext,
    hasPrevious,
    isLooping,
    isPlaying,
    isResolvingSource,
    isVisible,
    pause,
    play,
    playNext,
    playPrevious,
    progress,
    seekToFraction,
    setAutoplayNext,
    setLooping,
  } = useAudioPlayer()

  useEffect(() => {
    if (isVisible) {
      sectionRef.current?.focus({ preventScroll: true })
    }
  }, [isVisible])

  return (
    <div
      aria-hidden={!isVisible}
      className={cn(
        'pointer-events-none fixed bottom-6 left-6 right-6 z-40 transition-transform duration-300 ease-out mobile:left-36 sm:bottom-10 sm:left-44 sm:right-10 md:bottom-14 md:left-52 md:right-14',
        isVisible ? 'translate-y-0' : 'translate-y-[130%]',
      )}
    >
      <section
        aria-label='Active Quran player'
        ref={sectionRef}
        tabIndex={-1}
        className='pointer-events-auto rounded-[1.6rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-overlay)]/95 px-4 py-3 shadow-[var(--overlay-shadow-strong)] backdrop-blur-md sm:px-5'
      >
        <div className='flex flex-col gap-3'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <div className='flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-rurikon-300'>
                <span>{currentReciter.name}</span>
                {isResolvingSource ? <span>Loading</span> : null}
              </div>
              <div className='mt-1 flex items-end gap-3'>
                <span
                  className={cn(
                    arabicFontClassName,
                    'truncate text-[1.18rem] leading-none text-rurikon-700 sm:text-[1.28rem]',
                  )}
                  dir='rtl'
                  lang='ar'
                >
                  {currentSurah?.nameArabic}
                </span>
                <span className='truncate text-sm text-rurikon-400'>
                  {currentSurah?.nameSimple}
                </span>
              </div>
              {audioError ? (
                <p className='mt-1 text-[12px] text-rurikon-400'>{audioError}</p>
              ) : null}
            </div>

            <div className='flex shrink-0 items-center gap-1'>
              <button
                aria-label='Previous surah'
                className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-rurikon-border)] text-rurikon-700 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-900 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted disabled:opacity-40'
                disabled={!hasPrevious}
                onClick={() => void playPrevious()}
                type='button'
              >
                ⏮
              </button>
              <button
                aria-label={isPlaying ? 'Pause playback' : 'Play current surah'}
                className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--accent-solid)] bg-[var(--accent-solid)] text-[var(--accent-solid-text)] transition-colors hover:bg-[var(--accent-solid-hover)] focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'
                onClick={() => void (isPlaying ? pause() : play())}
                type='button'
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                aria-label='Next surah'
                className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-rurikon-border)] text-rurikon-700 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-900 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted disabled:opacity-40'
                disabled={!hasNext}
                onClick={() => void playNext()}
                type='button'
              >
                ⏭
              </button>
              <button
                aria-label='Toggle looping'
                aria-pressed={isLooping}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center rounded-full border px-3 text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted',
                  isLooping
                    ? 'border-[var(--accent-solid)] bg-[var(--accent-solid)] text-[var(--accent-solid-text)]'
                    : 'border-[var(--color-rurikon-border)] text-rurikon-500 hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800',
                )}
                onClick={() => setLooping(!isLooping)}
                type='button'
              >
                Loop
              </button>
              <button
                aria-label='Toggle autoplay next'
                aria-pressed={autoplayNext}
                className={cn(
                  'hidden min-h-11 items-center justify-center rounded-full border px-3 text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted sm:inline-flex',
                  autoplayNext
                    ? 'border-[var(--accent-solid)] bg-[var(--accent-solid)] text-[var(--accent-solid-text)]'
                    : 'border-[var(--color-rurikon-border)] text-rurikon-500 hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800',
                )}
                onClick={() => setAutoplayNext(!autoplayNext)}
                type='button'
              >
                Auto
              </button>
              <button
                aria-label='Close player'
                className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-rurikon-border)] text-rurikon-500 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'
                onClick={close}
                type='button'
              >
                ✕
              </button>
            </div>
          </div>

          <div className='sm:hidden'>
            <button
              aria-label='Toggle autoplay next'
              aria-pressed={autoplayNext}
              className={cn(
                'inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted',
                autoplayNext
                  ? 'border-[var(--accent-solid)] bg-[var(--accent-solid)] text-[var(--accent-solid-text)]'
                  : 'border-[var(--color-rurikon-border)] text-rurikon-500 hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800',
              )}
              onClick={() => setAutoplayNext(!autoplayNext)}
              type='button'
            >
              Auto next
            </button>
          </div>

          <PlayerProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={seekToFraction}
            progress={progress}
          />
        </div>
      </section>
    </div>
  )
}
