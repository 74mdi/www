'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import cn from 'clsx'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { usePathname, useRouter } from 'next/navigation'

import type { CommandPaletteItem } from '@/lib/command-palette-items'
import { COMMAND_PALETTE_OPEN_EVENT } from '@/components/command-palette-events'

const MAX_RESULTS = 14

type RankedItem = {
  item: CommandPaletteItem
  score: number
  index: number
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tagName = target.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
}

function scoreItem(item: CommandPaletteItem, tokens: string[]): number {
  const title = item.title.toLowerCase()
  const href = item.href.toLowerCase()
  const keywords = item.keywords.join(' ').toLowerCase()

  let score = 0
  for (const token of tokens) {
    const inTitle = title.includes(token)
    const inHref = href.includes(token)
    const inKeywords = keywords.includes(token)

    if (!inTitle && !inHref && !inKeywords) {
      return -1
    }

    if (title.startsWith(token)) score += 20
    if (inTitle) score += 12
    if (inHref) score += 8
    if (inKeywords) score += 5
  }

  return score
}

export default function CommandPalette({
  items,
}: {
  items: CommandPaletteItem[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [openPathname, setOpenPathname] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const isPaletteVisible = isOpen && openPathname === pathname

  const openPalette = useCallback(() => {
    setOpenPathname(pathname)
    setIsOpen(true)
  }, [pathname])

  const closePalette = useCallback(() => {
    setIsOpen(false)
    setOpenPathname(null)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return items.slice(0, MAX_RESULTS)

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
    const ranked: RankedItem[] = []
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index]
      const score = scoreItem(item, tokens)
      if (score < 0) continue
      ranked.push({ item, score, index })
    }

    ranked.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return a.index - b.index
    })

    return ranked.slice(0, MAX_RESULTS).map((entry) => entry.item)
  }, [items, query])

  const activeIndex =
    filteredItems.length === 0
      ? -1
      : Math.max(0, Math.min(selectedIndex, filteredItems.length - 1))

  useEffect(() => {
    const onOpen = () => openPalette()

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (isEditableTarget(event.target)) return
        event.preventDefault()
        openPalette()
        return
      }

      if (event.key === 'Escape' && isPaletteVisible) {
        event.preventDefault()
        closePalette()
      }
    }

    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closePalette, isPaletteVisible, openPalette])

  useEffect(() => {
    if (!isPaletteVisible) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isPaletteVisible])

  useEffect(() => {
    if (!isPaletteVisible) return
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [isPaletteVisible])

  const navigateToItem = useCallback(
    (item: CommandPaletteItem) => {
      closePalette()
      router.push(item.href)
    },
    [closePalette, router],
  )

  if (!isPaletteVisible) return null

  const selectedItem = activeIndex >= 0 ? filteredItems[activeIndex] : undefined

  return (
    <div className='fixed inset-0 z-[80] p-2 sm:p-6'>
      <button
        type='button'
        aria-label='Close command palette'
        onClick={closePalette}
        className='absolute inset-0 bg-rurikon-900/24 backdrop-blur-[1.5px]'
      />

      <div
        role='dialog'
        aria-modal='true'
        aria-label='Search pages and projects'
        className='relative mx-auto mt-[8vh] w-[min(48rem,calc(100vw-1rem))] rounded-2xl border border-rurikon-border bg-white/97 backdrop-blur shadow-[0_20px_44px_rgba(30,33,37,0.22)]'
      >
        <div className='flex items-center gap-2 border-b border-rurikon-border px-3 py-2.5'>
          <MagnifyingGlassIcon className='h-5 w-5 shrink-0 text-rurikon-300' />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setSelectedIndex((current) => {
                  if (filteredItems.length === 0) return 0
                  return (current + 1) % filteredItems.length
                })
                return
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setSelectedIndex((current) => {
                  if (filteredItems.length === 0) return 0
                  return (current - 1 + filteredItems.length) % filteredItems.length
                })
                return
              }

              if (event.key === 'Enter') {
                event.preventDefault()
                if (!selectedItem) return
                navigateToItem(selectedItem)
                return
              }

              if (event.key === 'Escape') {
                event.preventDefault()
                closePalette()
              }
            }}
            placeholder='Search pages, projects, and thoughts...'
            className='w-full border-0 bg-transparent text-rurikon-600 placeholder:text-rurikon-300 focus-visible:outline-none'
          />
          <span className='shrink-0 text-[11px] text-rurikon-300'>Esc</span>
        </div>

        <ul className='m-0 max-h-[52vh] list-none space-y-1 overflow-y-auto p-2'>
          {filteredItems.length === 0 ? (
            <li className='rounded-xl px-3 py-3 text-sm text-rurikon-300'>
              No results for &quot;{query.trim()}&quot;.
            </li>
          ) : (
            filteredItems.map((item, index) => {
              const isActive = index === activeIndex
              return (
                <li key={item.id}>
                  <button
                    type='button'
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => navigateToItem(item)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'border-rurikon-700 bg-rurikon-700 text-white'
                        : 'border-rurikon-border bg-white text-rurikon-500 hover:border-rurikon-400 hover:bg-rurikon-50',
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-medium'>{item.title}</span>
                      <span
                        className={cn(
                          'text-[10px] uppercase tracking-[0.08em]',
                          isActive ? 'text-rurikon-100' : 'text-rurikon-300',
                        )}
                      >
                        {item.section}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'mt-0.5 text-xs',
                        isActive ? 'text-rurikon-100/90' : 'text-rurikon-300',
                      )}
                    >
                      {item.href}
                    </p>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <p className='border-t border-rurikon-border px-3 py-2 text-[11px] text-rurikon-300'>
          Ctrl/Cmd+K to open, arrows to navigate, Enter to jump.
        </p>
      </div>
    </div>
  )
}
