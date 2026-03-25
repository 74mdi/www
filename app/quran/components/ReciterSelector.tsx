'use client'

import cn from 'clsx'

import type { Reciter } from '@/app/quran/types/quran'

export default function ReciterSelector({
  currentReciterId,
  onSelect,
  reciters,
}: {
  currentReciterId: string
  onSelect: (reciterId: string) => void
  reciters: Reciter[]
}) {
  return (
    <div
      aria-label='Reciter selector'
      className='-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      role='tablist'
    >
      {reciters.map((reciter) => {
        const isActive = reciter.id === currentReciterId

        return (
          <button
            key={reciter.id}
            aria-label={`Select ${reciter.name}`}
            aria-selected={isActive}
            className={cn(
              'group shrink-0 rounded-full border px-4 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted',
              isActive
                ? 'border-[var(--color-rurikon-border-strong)] bg-[var(--accent-solid)] text-[var(--accent-solid-text)]'
                : 'border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/70 text-rurikon-500 hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800',
            )}
            onClick={() => onSelect(reciter.id)}
            role='tab'
            type='button'
          >
            <span className='block text-[13px] font-medium leading-5 tracking-normal'>
              {reciter.name}
            </span>
            <span
              className={cn(
                'block text-[11px] leading-4 tracking-normal',
                isActive ? 'text-[var(--accent-solid-text)]/75' : 'text-rurikon-300',
              )}
              dir='rtl'
              lang='ar'
            >
              {reciter.nameAr}
            </span>
          </button>
        )
      })}
    </div>
  )
}
