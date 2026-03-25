'use client'

import { useEffect } from 'react'
import cn from 'clsx'

import { useAudioPlayer } from '@/app/quran/hooks/useAudioPlayer'
import { useVerses } from '@/app/quran/hooks/useVerses'
import type { Surah } from '@/app/quran/types/quran'

function VerseSkeleton() {
  return (
    <div className='space-y-3 rounded-[1.35rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/40 px-4 py-4 animate-pulse'>
      <div className='ml-auto h-10 w-10 rounded-full bg-[var(--color-rurikon-border)]/60' />
      <div className='h-10 w-full rounded bg-[var(--color-rurikon-border)]/35' />
      <div className='h-4 w-11/12 rounded bg-[var(--color-rurikon-border)]/30' />
      <div className='h-4 w-8/12 rounded bg-[var(--color-rurikon-border)]/20' />
    </div>
  )
}

export default function VerseView({
  arabicFontClassName,
  onClose,
  surah,
}: {
  arabicFontClassName: string
  onClose: () => void
  surah: Surah | null
}) {
  const { playSurah } = useAudioPlayer()
  const { verses, isLoading, error } = useVerses(surah?.id ?? null)

  useEffect(() => {
    if (!surah) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, surah])

  return (
    <div
      aria-hidden={!surah}
      className={cn(
        'pointer-events-none fixed inset-0 z-50',
        surah ? 'pointer-events-auto' : '',
      )}
    >
      <button
        aria-label='Close verse view'
        className={cn(
          'absolute inset-0 bg-[rgb(var(--background-rgb)/0.62)] backdrop-blur-[2px] transition-opacity',
          surah ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        type='button'
      />

      <aside
        aria-label={surah ? `Verses of ${surah.nameSimple}` : 'Verse view'}
        className={cn(
          'absolute bottom-3 left-3 right-3 top-[4.5rem] rounded-[1.8rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-overlay)]/95 shadow-[var(--overlay-shadow-strong)] backdrop-blur-md transition-transform duration-300 ease-out md:bottom-10 md:left-auto md:right-10 md:top-10 md:w-[min(36rem,calc(100vw-8rem))] md:rounded-[1.6rem] lg:bottom-14 lg:right-14 lg:top-14',
          surah ? 'translate-y-0 md:translate-x-0' : 'translate-y-[105%] md:translate-x-[110%] md:translate-y-0',
        )}
      >
        {surah ? (
          <div className='flex h-full flex-col'>
            <div className='flex items-start justify-between gap-4 border-b border-[var(--color-rurikon-border)] px-5 py-4'>
              <div>
                <div className='text-[11px] uppercase tracking-[0.14em] text-rurikon-300'>
                  Surah {String(surah.id).padStart(3, '0')}
                </div>
                <div className='mt-2 flex items-end gap-3'>
                  <span
                    className={cn(
                      arabicFontClassName,
                      'text-[1.75rem] leading-none text-rurikon-700',
                    )}
                    dir='rtl'
                    lang='ar'
                  >
                    {surah.nameArabic}
                  </span>
                  <span className='text-sm text-rurikon-400'>{surah.nameSimple}</span>
                </div>
                <p className='mt-2 text-[13px] leading-5 text-rurikon-400'>
                  {surah.translatedName} · {surah.versesCount} Ayahs · {surah.revelationPlace}
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  aria-label={`Play ${surah.nameSimple}`}
                  className='inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--accent-solid)] bg-[var(--accent-solid)] px-4 text-[12px] uppercase tracking-[0.12em] text-[var(--accent-solid-text)] transition-colors hover:bg-[var(--accent-solid-hover)] focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'
                  onClick={() => void playSurah(surah)}
                  type='button'
                >
                  ▶ Play
                </button>
                <button
                  aria-label='Close verse view'
                  className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-rurikon-border)] text-rurikon-500 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'
                  onClick={onClose}
                  type='button'
                >
                  ✕
                </button>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto px-4 py-4 sm:px-5'>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 6 }, (_, index) => (
                    <VerseSkeleton key={index} />
                  ))}
                </div>
              ) : error ? (
                <div className='rounded-[1.35rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 px-4 py-5 text-rurikon-400'>
                  {error}
                </div>
              ) : (
                <ol className='space-y-3'>
                  {verses.map((verse) => (
                    <li
                      key={verse.id}
                      className='rounded-[1.35rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/35 px-4 py-4'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <span className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-rurikon-border)] text-[12px] font-medium text-rurikon-500'>
                          {verse.verseNumber}
                        </span>
                        <button
                          aria-label={`Verse ${verse.verseNumber} audio coming soon`}
                          className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-rurikon-border)] text-rurikon-300'
                          disabled
                          type='button'
                        >
                          ▶
                        </button>
                      </div>

                      <p
                        className={cn(
                          arabicFontClassName,
                          'mt-4 text-right text-[1.85rem] leading-[2.35] tracking-normal text-rurikon-700 sm:text-[2rem]',
                        )}
                        dir='rtl'
                        lang='ar'
                      >
                        {verse.textArabic}
                      </p>

                      <p className='mt-4 text-[13px] leading-6 text-rurikon-400'>
                        {verse.translation}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
