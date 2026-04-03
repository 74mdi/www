'use client'

import { useEffect, useRef, useState } from 'react'

type EmailLinkProps = {
  email: string
  className?: string
  label?: string
}

const MOBILE_QUERY = '(max-width: 767px), (pointer: coarse), (hover: none)'

export default function EmailLink({
  email,
  className,
  label = 'email',
}: EmailLinkProps) {
  const [state, setState] = useState<'idle' | 'copied'>('idle')
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const scheduleReset = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }

    resetTimerRef.current = setTimeout(() => {
      setState('idle')
    }, 1800)
  }

  const handleClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia(MOBILE_QUERY).matches) return

    event.preventDefault()

    try {
      await navigator.clipboard.writeText(email)
      setState('copied')
      scheduleReset()
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <a
      href={`mailto:${email}`}
      onClick={(event) => {
        void handleClick(event)
      }}
      className={className}
      title='Desktop copies the email. Mobile opens your mail app.'
      aria-label={state === 'copied' ? `${email} copied` : `Email ${email}`}
    >
      {state === 'copied' ? 'copied' : label}
    </a>
  )
}
