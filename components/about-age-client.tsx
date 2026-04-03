'use client'

import { useEffect, useState } from 'react'

const BIRTH_DATE_ISO = '2008-08-08T00:00:00.000Z'
const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000

function getAge(nowMs: number): number {
  return (nowMs - new Date(BIRTH_DATE_ISO).getTime()) / YEAR_MS
}

export function AboutAgeClient() {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    let intervalId: number | null = null

    const startTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setNowMs(Date.now())
      }, 1_000)
    }, 4_000)

    return () => {
      window.clearTimeout(startTimer)
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  const age = getAge(nowMs)
  const exactAge = age.toFixed(12)

  return (
    <section className='mt-12' style={{ contentVisibility: 'auto' }}>
      <div className='flex flex-wrap items-center gap-3'>
        <h2 className='m-0 font-semibold text-[1.3rem] leading-[1.2] sm:text-[1.52rem] text-rurikon-600'>
          About Me
        </h2>
      </div>

      <p className='mt-5'>
        ana حمدي, endi <strong>{exactAge}</strong> عام.
      </p>
      <p className='mt-3'>wsafi.</p>
    </section>
  )
}
