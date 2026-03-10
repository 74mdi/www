'use client'

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
  const disableTransition = pathname.startsWith('/gallery')

  return (
    <article
      key={pathname}
      className={className}
      data-route-transition={
        hasHydrated && !disableTransition ? 'enter' : undefined
      }
    >
      {children}
    </article>
  )
}
