'use client'

import cn from 'clsx'

import type { Surah } from '@/app/quran/types/quran'

function formatSurahNumber(value: number) {
  return String(value).padStart(3, '0')
}

export default function SurahCard({
  surah,
  arabicFontClassName,
  isActive,
  isPlaying,
  onOpen,
  onPlay,
  style,
}: {
  surah: Surah
  arabicFontClassName: string
  isActive: boolean
  isPlaying: boolean
  onOpen: () => void
  onPlay: () => void
  style?: React.CSSProperties
}) {
  return (
    <li role='listitem' style={style}>
      <div
        className={cn(
          'group flex h-[152px] items-stretch gap-3 rounded-[1.4rem] border border-transparent bg-transparent px-2 py-2 transition-colors sm:h-[138px]',
          isActive && 'border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/45',
          !isActive && 'hover:border-[var(--color-rurikon-border)] hover:bg-[var(--surface-soft)]/45',
        )}
      >
        <button
          aria-label={`Open Surah ${surah.nameSimple}`}
          className='flex min-w-0 flex-1 flex-col justify-between rounded-[1.1rem] px-3 py-3 text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'
          onClick={onOpen}
          type='button'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-rurikon-300'>
              <span>{formatSurahNumber(surah.id)}</span>
              <span
                className='rounded-full border border-[var(--color-rurikon-border)] px-2 py-0.5 text-[10px] tracking-[0.12em] text-rurikon-400'
              >
                {surah.revelationPlace}
              </span>
            </div>
            <div
              className={cn(
                arabicFontClassName,
                'text-right text-[1.52rem] leading-none text-rurikon-700 sm:text-[1.7rem]',
              )}
              dir='rtl'
              lang='ar'
            >
              {surah.nameArabic}
            </div>
          </div>

          <div className='space-y-1'>
            <div className='flex items-end gap-3'>
              <span className='min-w-0 truncate text-[1.02rem] font-medium leading-6 tracking-normal text-rurikon-700'>
                {surah.nameSimple}
              </span>
              <span className='dot-leaders flex-1 text-[10px] text-rurikon-100 transition-colors group-hover:text-rurikon-400' />
              <span className='shrink-0 text-[12px] text-rurikon-300'>
                {surah.versesCount} Ayahs
              </span>
            </div>
            <p className='line-clamp-2 text-[13px] leading-5 text-rurikon-400'>
              {surah.translatedName}
            </p>
          </div>
        </button>

        <button
          aria-label={`${isActive && isPlaying ? 'Pause' : 'Play'} ${surah.nameSimple}`}
          className={cn(
            'inline-flex min-h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border text-sm transition-colors focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted',
            isActive && isPlaying
              ? 'border-[var(--accent-solid)] bg-[var(--accent-solid)] text-[var(--accent-solid-text)]'
              : 'border-[var(--color-rurikon-border)] bg-[var(--surface-raised)] text-rurikon-700 hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-900',
          )}
          onClick={onPlay}
          type='button'
        >
          <span aria-hidden='true'>{isActive && isPlaying ? '❚❚' : '▶'}</span>
        </button>
      </div>
    </li>
  )
}
