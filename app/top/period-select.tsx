'use client'

import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/navigation'

import type { ListeningPeriod } from '@/app/_lib/lastfm-history'

const PERIODS: Array<{ value: ListeningPeriod; label: string }> = [
  { value: 'overall', label: 'All time' },
  { value: '7day', label: 'Last 7 days' },
  { value: '1month', label: 'Last month' },
  { value: '3month', label: 'Last 3 months' },
  { value: '6month', label: 'Last 6 months' },
  { value: '12month', label: 'Last 12 months' },
]

export default function PeriodSelect({ value }: { value: ListeningPeriod }) {
  const router = useRouter()

  return (
    <label className='relative inline-flex items-center text-xs text-rurikon-300'>
      <span className='sr-only'>Listening time range</span>
      <select
        value={value}
        onChange={(event) => {
          router.replace(`/top?period=${event.currentTarget.value}`, { scroll: false })
        }}
        className='cursor-pointer appearance-none bg-transparent py-1 pr-5 text-right text-xs text-rurikon-300 outline-none hover:text-rurikon-500 focus-visible:text-rurikon-600'
      >
        {PERIODS.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon aria-hidden='true' className='pointer-events-none absolute right-0 h-3.5 w-3.5' />
    </label>
  )
}
