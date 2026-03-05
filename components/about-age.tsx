'use client'

import { useEffect, useState } from 'react'

const BIRTH_DATE_ISO = '2008-08-20T03:57:38.179Z'
const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000

function getAge(nowMs: number): number {
  return (nowMs - new Date(BIRTH_DATE_ISO).getTime()) / YEAR_MS
}

export function AboutAge() {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 20_000)
    return () => window.clearInterval(timer)
  }, [])

  const age = getAge(nowMs)
  const shortAge = age.toFixed(4)
  const exactAge = age.toFixed(12)

  return (
    <section className='mt-9 text-[1.95rem] leading-[1.55] text-zinc-300'>
      <div className='flex flex-wrap items-center gap-3'>
        <h2 className='m-0 text-[1em] font-normal text-zinc-400'>About Me</h2>
        <span
          className='group relative inline-flex h-10 items-center rounded-lg border border-zinc-300/20 bg-zinc-100 px-3 text-[0.62em] text-zinc-900'
          title={exactAge}
        >
          <span className='transition-opacity duration-150 group-hover:opacity-0'>
            {shortAge}
          </span>
          <span className='pointer-events-none absolute inset-0 flex items-center justify-center px-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
            {exactAge}
          </span>
        </span>
      </div>

      <p className='mt-2 text-[1em] text-zinc-300'>
        I&apos;m 7amdi, a <span className='text-zinc-100'>{shortAge}</span> year old
        failure.
      </p>
      <p className='mt-1 text-[1em] text-zinc-300'>Currently I live in dakhla.</p>
    </section>
  )
}
