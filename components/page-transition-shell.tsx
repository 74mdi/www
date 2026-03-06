'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type PageTransitionShellProps = {
  children: React.ReactNode
  className?: string
}

export default function PageTransitionShell({
  children,
  className,
}: PageTransitionShellProps) {
  const pathname = usePathname()
  const isFirstRender = useRef(true)
  const timerRef = useRef<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    setIsTransitioning(false)
    const rafId = window.requestAnimationFrame(() => {
      setIsTransitioning(true)
      timerRef.current = window.setTimeout(() => {
        setIsTransitioning(false)
        timerRef.current = null
      }, 700)
    })

    return () => {
      window.cancelAnimationFrame(rafId)
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [pathname])

  return (
    <article
      className={className}
      data-route-transition={isTransitioning ? 'enter' : undefined}
    >
      {children}
    </article>
  )
}
