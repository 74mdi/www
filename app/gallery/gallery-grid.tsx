'use client'

import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type GalleryGridImage = {
  src: string
  width: number
  height: number
  blurDataURL?: string
  title: string
  dateText?: string
}

type GalleryGridProps = {
  images: GalleryGridImage[]
}

const PAGE_SIZE = 12
const INITIAL_BATCH = 14
const GRID_IMAGE_SIZES =
  '(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, 50vw'
const SWIPE_THRESHOLD_PX = 54

function extractDateFromSrc(src: string): string | null {
  const filename = src.split('/').pop() ?? ''
  const match = filename.match(/^(\d{2})(\d{2})(\d{4})/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null
  }
  if (day < 1 || day > 31 || month < 1 || month > 12) return null

  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function resolveDateText(image: GalleryGridImage): string {
  return image.dateText ?? extractDateFromSrc(image.src) ?? 'undated'
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_BATCH, images.length),
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const preloadedImagesRef = useRef<Set<string>>(new Set())
  const deferredVisibleCount = useDeferredValue(visibleCount)
  const visibleImages = useMemo(
    () => images.slice(0, deferredVisibleCount),
    [deferredVisibleCount, images],
  )
  const activeImage = activeIndex !== null ? images[activeIndex] : null
  const activeImageIndex = activeIndex ?? 0
  const isClient = typeof window !== 'undefined'

  const ensureImageIsLoaded = (index: number) => {
    startTransition(() => {
      setVisibleCount((count) => Math.min(Math.max(count, index + 1), images.length))
    })
  }

  const loadMore = () => {
    startTransition(() => {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, images.length))
    })
  }

  const goToIndex = (nextIndex: number) => {
    const next = Math.max(0, Math.min(nextIndex, images.length - 1))
    ensureImageIsLoaded(next)
    setActiveIndex(next)
  }

  const preloadImage = (src: string | undefined) => {
    if (!src || typeof window === 'undefined') return
    if (preloadedImagesRef.current.has(src)) return

    const image = new window.Image()
    image.decoding = 'async'
    image.src = src
    preloadedImagesRef.current.add(src)
  }

  useEffect(() => {
    if (visibleCount >= images.length) return
    const node = loadMoreRef.current
    if (!node) return

    let cooldown: ReturnType<typeof setTimeout> | null = null
    let isLocked = false

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isLocked) return
        isLocked = true
        loadMore()
        cooldown = setTimeout(() => {
          isLocked = false
        }, 240)
      },
      {
        rootMargin: '900px 0px',
      },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      if (cooldown) window.clearTimeout(cooldown)
    }
  }, [images.length, visibleCount])

  useEffect(() => {
    if (activeIndex === null) return
    ensureImageIsLoaded(activeIndex)
  }, [activeIndex])

  useEffect(() => {
    if (activeIndex === null) return

    preloadImage(images[activeIndex]?.src)
    preloadImage(images[activeIndex + 1]?.src)
    preloadImage(images[activeIndex - 1]?.src)
    preloadImage(images[activeIndex + 2]?.src)
  }, [activeIndex, images])

  useEffect(() => {
    if (activeIndex === null) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
        return
      }

      if (event.key === 'ArrowRight') {
        goToIndex(activeImageIndex + 1)
      }

      if (event.key === 'ArrowLeft') {
        goToIndex(activeImageIndex - 1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImageIndex, activeIndex, images.length])

  return (
    <>
      <div className='columns-2 gap-3 sm:columns-2 lg:columns-3 [column-gap:0.85rem] sm:[column-gap:1rem]'>
        {visibleImages.map((image, index) => (
          <button
            key={image.src}
            type='button'
            onClick={() => setActiveIndex(index)}
            className='gallery-card-enter group mb-3 block w-full break-inside-avoid text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4 sm:mb-4'
            style={{
              animationDelay: `${Math.min(index * 26, 240)}ms`,
            }}
            aria-haspopup='dialog'
            aria-expanded={activeIndex === index}
          >
            <span className='block overflow-hidden rounded-[1.18rem] bg-[var(--surface-soft)] shadow-[0_8px_22px_rgba(0,0,0,0.06)] transition-transform duration-500 ease-out group-hover:-translate-y-0.5'>
              <Image
                src={image.src}
                alt={image.title}
                width={image.width}
                height={image.height}
                sizes={GRID_IMAGE_SIZES}
                quality={66}
                priority={index < 4}
                placeholder={image.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={image.blurDataURL}
                decoding='async'
                className='h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.015]'
              />
            </span>
          </button>
        ))}
      </div>

      <div ref={loadMoreRef} className='flex flex-col items-center gap-3 pt-2 sm:pt-3'>
        {visibleCount < images.length ? (
          <button
            type='button'
            onClick={loadMore}
            className='rounded-full border border-[var(--color-rurikon-border)] bg-[var(--surface-overlay)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-rurikon-600 transition-colors duration-200 hover:text-rurikon-800'
          >
            load {Math.min(PAGE_SIZE, images.length - visibleCount)} more
          </button>
        ) : (
          <p className='text-[11px] uppercase tracking-[0.2em] text-rurikon-400'>
            all moments loaded
          </p>
        )}
      </div>

      {isClient && activeImage
        ? createPortal(
            <div className='fixed inset-0 z-50' aria-hidden={activeImage ? undefined : true}>
              <button
                type='button'
                aria-label='Close image preview'
                className='gallery-overlay-enter absolute inset-0 bg-black/92'
                onClick={() => setActiveIndex(null)}
              />

              <div
                role='dialog'
                aria-modal='true'
                aria-label={activeImage.title}
                className='gallery-lightbox-enter relative h-full w-full'
                onTouchStart={(event) => {
                  const touch = event.touches[0]
                  if (!touch) return
                  touchStartRef.current = { x: touch.clientX, y: touch.clientY }
                }}
                onTouchEnd={(event) => {
                  const touch = event.changedTouches[0]
                  const start = touchStartRef.current
                  touchStartRef.current = null
                  if (!touch || !start) return

                  const deltaX = touch.clientX - start.x
                  const deltaY = touch.clientY - start.y
                  if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return
                  if (Math.abs(deltaX) < Math.abs(deltaY)) return

                  if (deltaX < 0 && activeImageIndex < images.length - 1) {
                    goToIndex(activeImageIndex + 1)
                  }

                  if (deltaX > 0 && activeImageIndex > 0) {
                    goToIndex(activeImageIndex - 1)
                  }
                }}
              >
                <div className='pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4'>
                  <div className='rounded-full bg-black/36 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm'>
                    {activeImageIndex + 1} / {images.length}
                  </div>
                  <button
                    type='button'
                    onClick={() => setActiveIndex(null)}
                    className='pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/36 text-white/85 backdrop-blur-sm transition-colors duration-200 hover:bg-black/56'
                  >
                    <XMarkIcon className='h-5 w-5' />
                  </button>
                </div>

                {activeImageIndex > 0 ? (
                  <button
                    type='button'
                    onClick={() => goToIndex(activeImageIndex - 1)}
                    className='pointer-events-auto absolute left-0 top-0 bottom-0 z-10 hidden w-[18vw] min-w-16 items-center justify-start pl-4 text-white/72 transition-opacity duration-200 hover:text-white sm:flex'
                    aria-label='Previous image'
                  >
                    <span className='inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/28 backdrop-blur-sm'>
                      <ArrowLeftIcon className='h-5 w-5' />
                    </span>
                  </button>
                ) : null}

                {activeImageIndex < images.length - 1 ? (
                  <button
                    type='button'
                    onClick={() => goToIndex(activeImageIndex + 1)}
                    className='pointer-events-auto absolute right-0 top-0 bottom-0 z-10 hidden w-[18vw] min-w-16 items-center justify-end pr-4 text-white/72 transition-opacity duration-200 hover:text-white sm:flex'
                    aria-label='Next image'
                  >
                    <span className='inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/28 backdrop-blur-sm'>
                      <ArrowRightIcon className='h-5 w-5' />
                    </span>
                  </button>
                ) : null}

                <div className='absolute left-0 right-0 top-14 bottom-14 flex items-center justify-center px-2 sm:px-8'>
                  <div
                    key={activeImage.src}
                    className='gallery-lightbox-image-enter flex h-full w-full items-center justify-center'
                  >
                    <Image
                      src={activeImage.src}
                      alt={activeImage.title}
                      width={activeImage.width}
                      height={activeImage.height}
                      sizes='100vw'
                      quality={92}
                      priority
                      placeholder={activeImage.blurDataURL ? 'blur' : 'empty'}
                      blurDataURL={activeImage.blurDataURL}
                      className='h-auto max-h-full w-auto max-w-full object-contain'
                    />
                  </div>
                </div>

                <div className='pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 px-3 py-3 sm:px-5 sm:py-4'>
                  <div className='rounded-full bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/62 backdrop-blur-sm'>
                    {resolveDateText(activeImage)}
                  </div>
                  <div className='pointer-events-auto flex items-center gap-2 sm:hidden'>
                    <button
                      type='button'
                      onClick={() => goToIndex(activeImageIndex - 1)}
                      disabled={activeImageIndex === 0}
                      className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm transition-colors duration-200 disabled:opacity-30'
                      aria-label='Previous image'
                    >
                      <ArrowLeftIcon className='h-5 w-5' />
                    </button>
                    <button
                      type='button'
                      onClick={() => goToIndex(activeImageIndex + 1)}
                      disabled={activeImageIndex === images.length - 1}
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
        : null}
    </>
  )
}
