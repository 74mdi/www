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
          : 'text-rurikon-500 hover:text-rurikon-700',
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
    <nav
      data-nosnippet
      className='mobile:mr-6 sm:mr-10 md:mr-14 w-full mobile:w-24 mobile:sticky top-6 sm:top-10 md:top-14 self-start'
    >
      <div className='mobile:hidden mb-6 flex items-center justify-between gap-3'>
        <ThemeModeToggle />
        <ul className='lowercase text-right flex items-center gap-2 justify-end'>
          <Item href='/'>Home</Item>
          <Item href='/thoughts'>Thoughts</Item>
          <Item href='/siftli'>SIFTLI</Item>
          {/* <Item href='/guestbook'>Guestbook</Item> */}
        </ul>
      </div>

      <ul className='lowercase text-right hidden mobile:block'>
        <Item href='/'>Home</Item>
        <Item href='/thoughts'>Thoughts</Item>
        <Item href='/siftli'>SIFTLI</Item>
        {/* <Item href='/guestbook'>Guestbook</Item> */}
      </ul>

      <div className='hidden mobile:flex mobile:fixed mobile:left-6 sm:left-10 md:left-14 mobile:w-24 mobile:bottom-6 sm:bottom-10 md:bottom-14 mobile:z-30 flex-col items-end gap-2'>
        <ThemeModeToggle />
      </div>
    </nav>
  )
}
