'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { useHydrated } from '@/components/use-hydrated'

type PageTransitionShellProps = {
  children: React.ReactNode
  className?: string
}

export default function PageTransitionShell({
  children,
  className,
}: PageTransitionShellProps) {
  const pathname = usePathname()
  const hasHydrated = useHydrated()
  const [isEntering, setIsEntering] = useState(false)

  useEffect(() => {
    // Reset and trigger animation on route change
    setIsEntering(false)
    const timer = setTimeout(() => setIsEntering(true), 0)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <article
      key={pathname}
      className={className}
      data-route-transition={hasHydrated && isEntering ? 'enter' : undefined}
    >
      {children}
    </article>
  )
}
