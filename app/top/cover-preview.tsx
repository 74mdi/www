'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FALLBACK_COVER = '/images/cover-placeholder.svg'

type CoverPreviewProps = {
  src: string | null
  title: string
  className: string
  imageClassName: string
  loading?: 'eager' | 'lazy'
  children: ReactNode
}

export default function CoverPreview({
  src,
  title,
  className,
  imageClassName,
  loading = 'lazy',
  children,
}: CoverPreviewProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const imageSrc = failedSrc === src ? FALLBACK_COVER : (src || FALLBACK_COVER)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ left: 8, top: 8 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const size = window.matchMedia('(min-width: 640px)').matches ? 192 : 144
      const left = Math.min(Math.max(rect.left, 8), window.innerWidth - size - 8)
      let top = rect.bottom + 8
      if (top + size > window.innerHeight - 8) top = Math.max(8, rect.top - size - 8)
      setPosition({ left, top })
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || previewRef.current?.contains(target)) return
      setIsOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    updatePosition()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className={`${className} text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2`}
        aria-label={`Preview ${title}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=''
          loading={loading}
          decoding='async'
          draggable={false}
          onError={() => setFailedSrc(src)}
          className={imageClassName}
        />
        {children}
      </button>
      {typeof document !== 'undefined' && createPortal(
        <div className='pointer-events-none fixed inset-0 z-50' aria-hidden={!isOpen}>
          <div
            ref={previewRef}
            className={`absolute origin-top-left transition-all duration-200 ease-out ${isOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'}`}
            style={{ left: position.left, top: position.top }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={`${title} cover`}
              width={192}
              height={192}
              loading='lazy'
              decoding='async'
              className='h-36 w-36 border border-rurikon-border bg-[var(--surface-raised)] object-cover shadow-[var(--overlay-shadow)] sm:h-48 sm:w-48'
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
