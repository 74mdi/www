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

  return (
    <article
      key={pathname}
      className={className}
      data-route-transition={hasHydrated ? 'enter' : undefined}
    >
      {children}
    </article>
  )
}
