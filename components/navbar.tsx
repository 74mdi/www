'use client'

import cn from 'clsx'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

import { COMMAND_PALETTE_OPEN_EVENT } from '@/components/command-palette-events'
import ThemePresets from '@/components/theme-presets'

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
        className='inline-block w-full px-2 focus-visible:outline focus-visible:outline-rurikon-400
        focus-visible:rounded-xs 
        focus-visible:outline-dotted
        focus-visible:text-rurikon-600'
        draggable={false}
      />
    </li>
  )
}

export default function Navbar() {
  const openCommandPalette = () => {
    window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT))
  }

  return (
    <nav className='mobile:mr-6 sm:mr-10 md:mr-14 w-full mobile:w-16'>
      <ul className='lowercase text-right mobile:sticky top-6 sm:top-10 md:top-14 mb-6 mobile:mb-0 flex gap-2 justify-end mobile:block'>
        <Item href='/'>About</Item>
        <Item href='/thoughts'>Thoughts</Item>
        {/* <Item href='/visuals'>Visuals</Item> */}
        <Item href='/projects'>Projects</Item>
        <Item href='/performance'>Performance</Item>
        <Item href='/siftli'>SIFTLI</Item>
        {/* <Item href='/guestbook'>Guestbook</Item> */}
        <li className='-mx-2'>
          <button
            type='button'
            onClick={openCommandPalette}
            className='inline-flex w-full items-center justify-end gap-1 px-2 text-rurikon-300 hover:text-rurikon-600 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-xs focus-visible:outline-dotted focus-visible:text-rurikon-600 transition-colors'
          >
            <span>Search</span>
            <span className='text-[10px] text-rurikon-200'>Ctrl/Cmd+K</span>
          </button>
        </li>
        <li className='-mx-2'>
          <ThemePresets />
        </li>
      </ul>
    </nav>
  )
}
