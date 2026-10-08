'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const PREVIEW_MARGIN_PX = 8
const PREVIEW_GAP_PX = 8

type AlbumCoverProps = {
  src: string
  title: string
}

export default function AlbumCover({ src, title }: AlbumCoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return

      const size = window.matchMedia('(min-width: 640px)').matches ? 128 : 112
      const left = Math.min(
        Math.max(rect.left, PREVIEW_MARGIN_PX),
        window.innerWidth - size - PREVIEW_MARGIN_PX,
      )
      let top = rect.bottom + PREVIEW_GAP_PX
      if (top + size > window.innerHeight - PREVIEW_MARGIN_PX) {
        top = Math.max(PREVIEW_MARGIN_PX, rect.top - size - PREVIEW_GAP_PX)
      }
      setPosition({ left, top })
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || previewRef.current?.contains(target)) return
      setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    updatePosition()
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className='block shrink-0 rounded-[3px] focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-1 focus-visible:outline-dotted'
        aria-label={`Preview album cover for ${title}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {/* Last.fm image URLs use multiple CDN hosts, as on the home page. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=''
          width={48}
          height={48}
          loading='lazy'
          decoding='async'
          draggable={false}
          className='h-12 w-12 rounded-[3px] border border-rurikon-border object-cover transition-transform duration-200 ease-out hover:scale-105'
        />
      </button>

      {typeof document !== 'undefined'
        ? createPortal(
            <div className='pointer-events-none fixed inset-0 z-30' aria-hidden={!isOpen}>
              <div
                ref={previewRef}
                className={`absolute origin-top-left transition-all duration-200 ease-out ${isOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'}`}
                style={{ left: position.left, top: position.top }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Album cover for ${title}`}
                  width={128}
                  height={128}
                  loading='lazy'
                  decoding='async'
                  draggable={false}
                  className='h-28 w-28 rounded-md border border-rurikon-border bg-[var(--surface-raised)] object-cover shadow-[var(--overlay-shadow)] sm:h-32 sm:w-32'
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
