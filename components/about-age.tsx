'use client'

import { useEffect, useState } from 'react'

const BIRTH_DATE_ISO = '2008-08-08T00:00:00.000Z'
const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000

function getAge(nowMs: number): number {
  return (nowMs - new Date(BIRTH_DATE_ISO).getTime()) / YEAR_MS
}

type AboutAgeProps = {
  initialNowMs: number
}

export function AboutAge({ initialNowMs }: AboutAgeProps) {
  const [nowMs, setNowMs] = useState(initialNowMs)

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 10_000)
    return () => window.clearInterval(timer)
  }, [])

  const age = getAge(nowMs)
  const exactAge = age.toFixed(12)

  return (
    <section className='mt-12'>
      <div className='flex flex-wrap items-center gap-3'>
        <h2 className='m-0 font-semibold text-[1.3rem] leading-[1.2] sm:text-[1.52rem] text-rurikon-600'>
          About Me
        </h2>
        <span className='inline-flex items-center py-1 text-sm tabular-nums text-rurikon-500'>
          {exactAge}
        </span>
      </div>

      <p className='mt-5'>
        I&apos;m 7amdi, a <strong>{exactAge}</strong> year old failure.
      </p>
      <p className='mt-3'>Currently I live in dakhla.</p>
    </section>
  )
}
