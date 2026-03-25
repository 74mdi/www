'use client'

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const remainingSeconds = total % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function PlayerProgressBar({
  currentTime,
  duration,
  onSeek,
  progress,
}: {
  currentTime: number
  duration: number
  onSeek: (fraction: number) => void
  progress: number
}) {
  const clampedProgress = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0

  return (
    <div className='space-y-2'>
      <div className='relative h-5'>
        <div className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--color-rurikon-border)]' />
        <div
          className='absolute left-0 top-1/2 h-px -translate-y-1/2 bg-[var(--accent-solid)]'
          style={{ width: `${clampedProgress * 100}%` }}
        />
        <div
          className='absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--accent-solid)]'
          style={{ left: `calc(${clampedProgress * 100}% - 0.3125rem)` }}
        />
        <input
          aria-label='Seek in current surah'
          className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
          max={1000}
          min={0}
          onChange={(event) => onSeek(Number(event.target.value) / 1000)}
          type='range'
          value={Math.round(clampedProgress * 1000)}
        />
      </div>
      <div className='flex items-center justify-between text-[11px] tabular-nums tracking-normal text-rurikon-300'>
        <span>{formatAudioTime(currentTime)}</span>
        <span>{formatAudioTime(duration)}</span>
      </div>
    </div>
  )
}
