'use client'

import cn from 'clsx'

const INPUT_CLASS =
  'w-full rounded-2xl border border-[var(--color-rurikon-border)] bg-[var(--surface-raised)]/80 px-4 py-3 pr-11 text-base text-rurikon-700 placeholder:text-rurikon-300 shadow-[var(--overlay-shadow)] outline-none transition-colors focus-visible:border-[var(--color-rurikon-border-strong)] focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted sm:text-[15px]'

export default function SearchBar({
  value,
  onChange,
  onClear,
}: {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}) {
  return (
    <div className='relative mx-auto w-full max-w-xl'>
      <input
        aria-label='Search surahs'
        autoComplete='off'
        className={INPUT_CLASS}
        inputMode='search'
        onChange={(event) => onChange(event.target.value)}
        placeholder='Search by Arabic, English, meaning, or surah number'
        type='search'
        value={value}
      />
      <button
        aria-hidden={value.length === 0}
        aria-label='Clear search'
        className={cn(
          'absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-rurikon-400 transition-colors hover:text-rurikon-700 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted',
          value.length === 0 && 'pointer-events-none opacity-0',
        )}
        onClick={onClear}
        type='button'
      >
        <span aria-hidden='true' className='text-lg leading-none'>
          ×
        </span>
      </button>
    </div>
  )
}
