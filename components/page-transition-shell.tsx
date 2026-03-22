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
  const [transitionKey, setTransitionKey] = useState(0)

  useEffect(() => {
    setTransitionKey((value) => value + 1)
  }, [pathname])

  return (
    <article
      key={transitionKey}
      className={className}
      data-route-transition={hasHydrated ? 'enter' : undefined}
    >
      {children}
    </article>
  )
}
