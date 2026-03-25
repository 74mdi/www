'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import SurahCard from '@/app/quran/components/SurahCard'
import type { Surah } from '@/app/quran/types/quran'

const OVERSCAN = 5

function useVirtualItemHeight() {
  const [itemHeight, setItemHeight] = useState(152)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 640px)')
    const update = () => setItemHeight(media.matches ? 138 : 152)

    update()
    media.addEventListener('change', update)

    return () => {
      media.removeEventListener('change', update)
    }
  }, [])

  return itemHeight
}

export default function SurahList({
  arabicFontClassName,
  currentSurahId,
  error,
  isLoading,
  isPlaying,
  onOpenSurah,
  onPlaySurah,
  surahs,
}: {
  arabicFontClassName: string
  currentSurahId: number | null
  error: string | null
  isLoading: boolean
  isPlaying: boolean
  onOpenSurah: (surah: Surah) => void
  onPlaySurah: (surah: Surah) => void
  surahs: Surah[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemHeight = useVirtualItemHeight()
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(720)

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const observer = new ResizeObserver(() => {
      setContainerHeight(node.clientHeight)
    })

    observer.observe(node)
    setContainerHeight(node.clientHeight)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (node) {
      node.scrollTop = 0
    }
  }, [surahs])

  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN)
    const visibleEnd = Math.min(
      surahs.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + OVERSCAN,
    )

    return {
      startIndex: visibleStart,
      endIndex: visibleEnd,
      totalHeight: surahs.length * itemHeight,
    }
  }, [containerHeight, itemHeight, scrollTop, surahs.length])

  if (error) {
    return (
      <div className='rounded-[1.6rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 px-5 py-6 text-rurikon-400'>
        {error}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className='h-[152px] animate-pulse rounded-[1.4rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 sm:h-[138px]'
          />
        ))}
      </div>
    )
  }

  if (surahs.length === 0) {
    return (
      <div className='rounded-[1.6rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 px-5 py-10 text-center text-rurikon-400'>
        No results
      </div>
    )
  }

  const visibleSurahs = surahs.slice(startIndex, endIndex)

  return (
    <div
      ref={containerRef}
      aria-label='Surah list'
      className='max-h-[min(72vh,54rem)] min-h-[28rem] overflow-y-auto pr-1'
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <ul
        className='relative'
        role='list'
        style={{ height: totalHeight }}
      >
        {visibleSurahs.map((surah, index) => {
          const top = (startIndex + index) * itemHeight
          const isActive = currentSurahId === surah.id

          return (
            <SurahCard
              key={surah.id}
              arabicFontClassName={arabicFontClassName}
              isActive={isActive}
              isPlaying={isActive && isPlaying}
              onOpen={() => onOpenSurah(surah)}
              onPlay={() => void onPlaySurah(surah)}
              style={{ position: 'absolute', left: 0, right: 0, top }}
              surah={surah}
            />
          )
        })}
      </ul>
    </div>
  )
}
