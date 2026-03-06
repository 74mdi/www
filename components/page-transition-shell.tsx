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
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setAnimationKey((value) => value + 1)
  }, [pathname])

  return (
    <article
      key={animationKey}
      className={className}
      data-route-transition={animationKey > 0 ? 'enter' : undefined}
    >
      {children}
    </article>
  )
}
