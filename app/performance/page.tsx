import type { Metadata } from 'next'

import {
  LIGHTHOUSE_SCORES,
  PERFORMANCE_UPDATED_AT,
  RESPONSE_SNAPSHOTS,
  UPTIME_SUMMARY,
} from '@/lib/performance-data'

export const metadata: Metadata = {
  title: 'qaiik',
  description: 'qaiik',
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-700'
  if (score >= 75) return 'text-amber-700'
  return 'text-red-700'
}

function buildSparklinePath(values: number[], width: number, height: number): string {
  if (values.length === 0) return ''
  if (values.length === 1) return `M 0 ${height / 2} L ${width} ${height / 2}`

  const min = Math.min(...values)
  const max = Math.max(...values)
  const xStep = width / (values.length - 1)
  const range = max - min || 1

  const points = values.map((value, index) => {
    const x = index * xStep
    const normalized = (value - min) / range
    const y = height - normalized * height
    return `${x.toFixed(2)} ${y.toFixed(2)}`
  })

  return `M ${points.join(' L ')}`
}

export default function Page() {
  const p50Values = RESPONSE_SNAPSHOTS.map((snapshot) => snapshot.p50Ms)
  const p95Values = RESPONSE_SNAPSHOTS.map((snapshot) => snapshot.p95Ms)
  const p50Path = buildSparklinePath(p50Values, 360, 80)
  const p95Path = buildSparklinePath(p95Values, 360, 80)
  const uptimeDisplay = `${UPTIME_SUMMARY.uptimePercent.toFixed(2)}%`
  const updatedAt = new Date(PERFORMANCE_UPDATED_AT).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <section className='space-y-5'>
      <h1 className='font-semibold text-rurikon-600 text-balance'>Performance</h1>
      <p className='text-rurikon-400 text-sm'>
        Lightweight health snapshots for lighthouse quality, uptime, and response
        speed.
      </p>

      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='border border-rurikon-border rounded-xs p-3 bg-white'>
          <p className='text-rurikon-300 text-xs uppercase tracking-[0.08em]'>
            Uptime ({UPTIME_SUMMARY.windowLabel})
          </p>
          <p className='mt-1 text-2xl font-semibold text-rurikon-700'>{uptimeDisplay}</p>
          <p className='mt-1 text-xs text-rurikon-300'>
            {UPTIME_SUMMARY.incidents} incidents · {UPTIME_SUMMARY.checks.toLocaleString()}{' '}
            checks
          </p>
        </div>

        <div className='border border-rurikon-border rounded-xs p-3 bg-white'>
          <p className='text-rurikon-300 text-xs uppercase tracking-[0.08em]'>
            Snapshot Updated
          </p>
          <p className='mt-1 text-2xl font-semibold text-rurikon-700'>{updatedAt}</p>
          <p className='mt-1 text-xs text-rurikon-300'>
            Source: Lighthouse + uptime checks + response probes.
          </p>
        </div>
      </div>

      <div className='border border-rurikon-border rounded-xs p-3 bg-white'>
        <p className='text-rurikon-300 text-xs uppercase tracking-[0.08em]'>
          Lighthouse Scores
        </p>
        <ul className='mt-3 grid gap-2 sm:grid-cols-2'>
          {LIGHTHOUSE_SCORES.map((entry) => (
            <li
              key={entry.category}
              className='border border-rurikon-border rounded-xs px-2.5 py-2 bg-rurikon-50/50'
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm text-rurikon-500'>{entry.category}</span>
                <span className={`text-sm font-semibold ${scoreColor(entry.score)}`}>
                  {entry.score}
                </span>
              </div>
              <div className='mt-1 h-1.5 w-full rounded-full bg-rurikon-100 overflow-hidden'>
                <div
                  className='h-full bg-rurikon-500'
                  style={{ width: `${Math.max(0, Math.min(entry.score, 100))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className='border border-rurikon-border rounded-xs p-3 bg-white space-y-3'>
        <p className='text-rurikon-300 text-xs uppercase tracking-[0.08em]'>
          Response Time Snapshots
        </p>

        <div className='rounded-xs border border-rurikon-border bg-rurikon-50/50 px-2 py-2'>
          <svg viewBox='0 0 360 80' className='w-full h-24' aria-hidden>
            <path d={p95Path} fill='none' stroke='#8c95a1' strokeWidth='2' />
            <path d={p50Path} fill='none' stroke='#3b4149' strokeWidth='2.25' />
          </svg>
          <div className='mt-1 flex items-center gap-4 text-[11px] text-rurikon-300'>
            <span className='inline-flex items-center gap-1'>
              <span className='inline-block h-2 w-2 rounded-full bg-rurikon-600' />
              p50
            </span>
            <span className='inline-flex items-center gap-1'>
              <span className='inline-block h-2 w-2 rounded-full bg-rurikon-300' />
              p95
            </span>
          </div>
        </div>

        <ul className='m-0 list-none p-0 divide-y divide-rurikon-border'>
          {RESPONSE_SNAPSHOTS.map((snapshot) => (
            <li
              key={snapshot.dateLabel}
              className='py-2 text-xs text-rurikon-400 grid grid-cols-3 gap-2'
            >
              <span className='text-rurikon-500'>{snapshot.dateLabel}</span>
              <span>p50: {snapshot.p50Ms}ms</span>
              <span>p95: {snapshot.p95Ms}ms</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

