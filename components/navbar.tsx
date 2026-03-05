'use client'

import cn from 'clsx'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

import ThemeModeToggle from '@/components/theme-mode-toggle'

function Item(props: React.ComponentProps<typeof Link>) {
  const pathname = usePathname()
  const href = props.href

  if (typeof href !== 'string') {
    throw new Error('`href` must be a string')
  }

  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <li
      className={cn(
        isActive
          ? 'text-rurikon-800'
          : 'text-rurikon-300 hover:text-rurikon-600',
        'transition-colors hover:transform-none',
        '-mx-2'
      )}
    >
      <Link
        {...props}
        className='inline-block w-full px-2 whitespace-nowrap focus-visible:outline focus-visible:outline-rurikon-400
        focus-visible:rounded-xs 
        focus-visible:outline-dotted
        focus-visible:text-rurikon-600'
        draggable={false}
      />
    </li>
  )
}

export default function Navbar() {
  return (
    <nav className='mobile:mr-6 sm:mr-10 md:mr-14 w-full mobile:w-24 mobile:sticky top-6 sm:top-10 md:top-14 self-start'>
      <ul className='lowercase text-right mb-6 mobile:mb-0 flex gap-2 justify-end mobile:block'>
        <Item href='/'>About</Item>
        <Item href='/thoughts'>Thoughts</Item>
        <Item href='/projects'>Projects</Item>
        <Item href='/siftli'>SIFTLI</Item>
        {/* <Item href='/guestbook'>Guestbook</Item> */}
      </ul>

      <div className='mobile:fixed mobile:left-6 sm:left-10 md:left-14 mobile:bottom-6 sm:bottom-10 md:bottom-14 mobile:z-30 hidden mobile:flex flex-col items-end gap-2'>
        <ThemeModeToggle />
      </div>

      <div className='mobile:hidden fixed left-1/2 -translate-x-1/2 bottom-4 z-40 flex items-center justify-center pb-[env(safe-area-inset-bottom)]'>
        <ThemeModeToggle />
      </div>
    </nav>
  )
}
