'use client'

import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  formatGalleryDate,
  parseGalleryFilenameDate,
} from '@/app/_lib/gallery-date'
import type { GalleryGridImage } from '@/app/gallery/gallery-types'

type GalleryLightboxProps = {
  images: GalleryGridImage[]
  activeIndex: number
  onClose: () => void
  onSelectIndex: (nextIndex: number) => void
}

const SWIPE_THRESHOLD_PX = 54
const LIGHTBOX_SLIDE_MS = 260

function resolveDateText(image: GalleryGridImage): string {
  const parsedFromFilename = parseGalleryFilenameDate(image.src)
  return image.dateText ?? formatGalleryDate(parsedFromFilename) ?? 'undated'
}

export default function GalleryLightbox({
  images,
  activeIndex,
  onClose,
  onSelectIndex,
}: GalleryLightboxProps) {
  const activeImage = images[activeIndex] ?? null
  const previousImage = activeIndex > 0 ? images[activeIndex - 1] : null
  const nextImage =
    activeIndex >= 0 && activeIndex < images.length - 1
      ? images[activeIndex + 1]
      : null

  const [slideOffsetPx, setSlideOffsetPx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const viewerFrameRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const preloadedImagesRef = useRef<Set<string>>(new Set())
  const viewerWidthRef = useRef(0)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearNavTimer = useCallback(() => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current)
      navTimerRef.current = null
    }
  }, [])

  const updateViewerWidth = useCallback(() => {
    viewerWidthRef.current = viewerFrameRef.current?.clientWidth || window.innerWidth
  }, [])

  const preloadImage = useCallback((src: string | undefined) => {
    if (!src || typeof window === 'undefined') return
    if (preloadedImagesRef.current.has(src)) return

    const image = new window.Image()
    image.decoding = 'async'
    image.src = src
    if (typeof image.decode === 'function') {
      void image.decode().catch(() => {})
    }
    preloadedImagesRef.current.add(src)
  }, [])

  const closeViewer = useCallback(() => {
    clearNavTimer()
    setSlideOffsetPx(0)
    setIsDragging(false)
    setIsSettling(false)
    onClose()
  }, [clearNavTimer, onClose])

  const resetSlidePosition = useCallback(() => {
    clearNavTimer()
    setIsDragging(false)
    setIsSettling(true)
    setSlideOffsetPx(0)

    navTimerRef.current = setTimeout(() => {
      setIsSettling(false)
      navTimerRef.current = null
    }, LIGHTBOX_SLIDE_MS)
  }, [clearNavTimer])

  const goToIndex = useCallback((nextIndex: number) => {
    if (!activeImage) return

    const next = Math.max(0, Math.min(nextIndex, images.length - 1))
    if (next === activeIndex) {
      resetSlidePosition()
      return
    }

    updateViewerWidth()
    preloadImage(images[next]?.src)
    preloadImage(images[next + 1]?.src)
    preloadImage(images[next - 1]?.src)

    const direction = next > activeIndex ? 1 : -1
    const width = viewerWidthRef.current || window.innerWidth

    clearNavTimer()
    setIsDragging(false)
    setIsSettling(true)
    setSlideOffsetPx(direction > 0 ? -width : width)

    navTimerRef.current = setTimeout(() => {
      onSelectIndex(next)
      setSlideOffsetPx(0)
      setIsSettling(false)
      navTimerRef.current = null
    }, LIGHTBOX_SLIDE_MS)
  }, [
    activeImage,
    activeIndex,
    clearNavTimer,
    images,
    onSelectIndex,
    preloadImage,
    resetSlidePosition,
    updateViewerWidth,
  ])

  useEffect(() => {
    if (!activeImage || typeof window === 'undefined') return

    updateViewerWidth()

    const handleResize = () => {
      updateViewerWidth()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [activeImage, updateViewerWidth])

  useEffect(() => {
    if (!activeImage) return

    preloadImage(activeImage.src)
    preloadImage(nextImage?.src)
    preloadImage(previousImage?.src)
    preloadImage(images[activeIndex + 2]?.src)
  }, [activeImage, activeIndex, images, nextImage, preloadImage, previousImage])

  useEffect(() => {
    if (!activeImage || typeof window === 'undefined') return

    const html = document.documentElement
    const body = document.body
    const scrollY = window.scrollY
    const scrollbarWidth = window.innerWidth - html.clientWidth

    const previousHtmlOverflow = html.style.overflow
    const previousHtmlOverscrollBehavior = html.style.overscrollBehavior
    const previousBodyOverflow = body.style.overflow
    const previousBodyPosition = body.style.position
    const previousBodyTop = body.style.top
    const previousBodyLeft = body.style.left
    const previousBodyRight = body.style.right
    const previousBodyWidth = body.style.width
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior
    const previousBodyPaddingRight = body.style.paddingRight

    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overscrollBehavior = 'none'

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    updateViewerWidth()

    return () => {
      clearNavTimer()
      html.style.overflow = previousHtmlOverflow
      html.style.overscrollBehavior = previousHtmlOverscrollBehavior
      body.style.overflow = previousBodyOverflow
      body.style.position = previousBodyPosition
      body.style.top = previousBodyTop
      body.style.left = previousBodyLeft
      body.style.right = previousBodyRight
      body.style.width = previousBodyWidth
      body.style.overscrollBehavior = previousBodyOverscrollBehavior
      body.style.paddingRight = previousBodyPaddingRight
      window.scrollTo(0, scrollY)
    }
  }, [activeImage, clearNavTimer, updateViewerWidth])

  useEffect(() => {
    if (!activeImage) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeViewer()
        return
      }

      if (event.key === 'ArrowRight') {
        goToIndex(activeIndex + 1)
      }

      if (event.key === 'ArrowLeft') {
        goToIndex(activeIndex - 1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImage, activeIndex, closeViewer, goToIndex])

  useEffect(() => {
    return () => {
      clearNavTimer()
    }
  }, [clearNavTimer])

  if (!activeImage || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className='fixed inset-0 z-50'>
      <button
        type='button'
        aria-label='Close image preview'
        className='gallery-overlay-enter absolute inset-0 bg-black/92'
        onClick={closeViewer}
      />

      <div
        role='dialog'
        aria-modal='true'
        aria-label={activeImage.title}
        className='gallery-lightbox-enter relative h-full w-full'
        onTouchStart={(event) => {
          if (isSettling) return
          updateViewerWidth()
          const touch = event.touches[0]
          if (!touch) return
          setIsDragging(true)
          touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        }}
        onTouchMove={(event) => {
          const touch = event.touches[0]
          const start = touchStartRef.current
          if (!touch || !start || !isDragging || isSettling) return

          const deltaX = touch.clientX - start.x
          const deltaY = touch.clientY - start.y

          if (Math.abs(deltaX) < Math.abs(deltaY)) return

          event.preventDefault()

          const width = viewerWidthRef.current || window.innerWidth
          const clamped = Math.max(-width * 0.92, Math.min(width * 0.92, deltaX))

          if (
            (activeIndex === 0 && clamped > 0) ||
            (activeIndex === images.length - 1 && clamped < 0)
          ) {
            setSlideOffsetPx(clamped * 0.32)
            return
          }

          setSlideOffsetPx(clamped)
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0]
          const start = touchStartRef.current
          touchStartRef.current = null
          if (!touch || !start) {
            setIsDragging(false)
            return
          }

          const deltaX = touch.clientX - start.x
          const deltaY = touch.clientY - start.y
          const width = viewerWidthRef.current || window.innerWidth
          const threshold = Math.max(SWIPE_THRESHOLD_PX, width * 0.14)

          if (
            Math.abs(deltaX) >= threshold &&
            Math.abs(deltaX) > Math.abs(deltaY) &&
            deltaX < 0 &&
            activeIndex < images.length - 1
          ) {
            goToIndex(activeIndex + 1)
            return
          }

          if (
            Math.abs(deltaX) >= threshold &&
            Math.abs(deltaX) > Math.abs(deltaY) &&
            deltaX > 0 &&
            activeIndex > 0
          ) {
            goToIndex(activeIndex - 1)
            return
          }

          resetSlidePosition()
        }}
        onTouchCancel={() => {
          touchStartRef.current = null
          resetSlidePosition()
        }}
      >
        <div className='pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4'>
          <div className='rounded-full bg-black/36 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm'>
            {activeIndex + 1} / {images.length}
          </div>
          <button
            type='button'
            onClick={closeViewer}
            className='pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/36 text-white/85 backdrop-blur-sm transition-colors duration-200 hover:bg-black/56'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        {activeIndex > 0 ? (
          <button
            type='button'
            onClick={() => goToIndex(activeIndex - 1)}
            className='pointer-events-auto absolute left-0 top-0 bottom-0 z-10 hidden w-[18vw] min-w-16 items-center justify-start pl-4 text-white/72 transition-opacity duration-200 hover:text-white sm:flex'
            aria-label='Previous image'
          >
            <span className='inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/28 backdrop-blur-sm'>
              <ArrowLeftIcon className='h-5 w-5' />
            </span>
          </button>
        ) : null}

        {activeIndex < images.length - 1 ? (
          <button
            type='button'
            onClick={() => goToIndex(activeIndex + 1)}
            className='pointer-events-auto absolute right-0 top-0 bottom-0 z-10 hidden w-[18vw] min-w-16 items-center justify-end pr-4 text-white/72 transition-opacity duration-200 hover:text-white sm:flex'
            aria-label='Next image'
          >
            <span className='inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/28 backdrop-blur-sm'>
              <ArrowRightIcon className='h-5 w-5' />
            </span>
          </button>
        ) : null}

        <div
          ref={viewerFrameRef}
          className='absolute left-0 right-0 top-14 bottom-14 overflow-hidden px-2 sm:px-8'
        >
          <div
            className='flex h-full w-full'
            style={{
              transform: `translate3d(calc(-100% + ${slideOffsetPx}px), 0, 0)`,
              transition:
                isDragging || !isSettling
                  ? 'none'
                  : `transform ${LIGHTBOX_SLIDE_MS}ms cubic-bezier(0.22, 0.8, 0.2, 1)`,
              willChange: 'transform',
            }}
          >
            {[previousImage, activeImage, nextImage].map((image, index) => (
              <div
                key={image?.src ?? `empty-${index}`}
                className='flex h-full w-full shrink-0 items-center justify-center'
              >
                {image ? (
                  <div
                    className='flex h-full w-full items-center justify-center'
                    style={{
                      opacity: isDragging && index !== 1 ? 0.96 : 1,
                      transform: 'translate3d(0, 0, 0)',
                      filter: 'none',
                      transition: isDragging ? 'none' : 'opacity 180ms ease-out',
                      willChange: 'opacity',
                    }}
                  >
                    <Image
                      src={image.src}
                      alt={image.title}
                      width={image.width}
                      height={image.height}
                      sizes='100vw'
                      quality={index === 1 ? 92 : 84}
                      priority={index === 1}
                      placeholder={image.blurDataURL ? 'blur' : 'empty'}
                      blurDataURL={image.blurDataURL}
                      className='h-auto max-h-full w-auto max-w-full object-contain'
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className='pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 px-3 py-3 sm:px-5 sm:py-4'>
          <div className='rounded-full bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/62 backdrop-blur-sm'>
            {resolveDateText(activeImage)}
          </div>
          <div className='pointer-events-auto flex items-center gap-2 sm:hidden'>
            <button
              type='button'
              onClick={() => goToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm transition-colors duration-200 disabled:opacity-30'
              aria-label='Previous image'
            >
              <ArrowLeftIcon className='h-5 w-5' />
            </button>
            <button
              type='button'
              onClick={() => goToIndex(activeIndex + 1)}
              disabled={activeIndex === images.length - 1}
              className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm transition-colors duration-200 disabled:opacity-30'
              aria-label='Next image'
            >
              <ArrowRightIcon className='h-5 w-5' />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
