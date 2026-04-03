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
import {
  formatGalleryDate,
  getGalleryDateSortTime,
  parseGalleryFilenameDate,
} from '@/app/_lib/gallery-date'

type GalleryGridImage = {
  src: string
  width: number
  height: number
  blurDataURL?: string
  title: string
  dateText?: string
  sortTime?: number | null
}

type GalleryGridProps = {
  images: GalleryGridImage[]
}

type GallerySortOrder = 'oldest' | 'newest'

const PAGE_SIZE = 12
const INITIAL_BATCH = 14
const EAGER_IMAGE_COUNT = 9
const GRID_IMAGE_SIZES =
  '(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, 50vw'
const SWIPE_THRESHOLD_PX = 54
const LIGHTBOX_SLIDE_MS = 260

function getImageSortTime(image: GalleryGridImage): number | null {
  if (typeof image.sortTime === 'number' && Number.isFinite(image.sortTime)) {
    return image.sortTime
  }

  return getGalleryDateSortTime(undefined, image.src)
}

function resolveDateText(image: GalleryGridImage): string {
  const parsedFromFilename = parseGalleryFilenameDate(image.src)
  return image.dateText ?? formatGalleryDate(parsedFromFilename) ?? 'undated'
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [sortOrder, setSortOrder] = useState<GallerySortOrder>('oldest')
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_BATCH, images.length),
  )
  const [activeSrc, setActiveSrc] = useState<string | null>(null)
  const [slideOffsetPx, setSlideOffsetPx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const viewerFrameRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const preloadedImagesRef = useRef<Set<string>>(new Set())
  const viewerWidthRef = useRef(0)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      const aDate = getImageSortTime(a)
      const bDate = getImageSortTime(b)
      const fallbackScore =
        sortOrder === 'oldest'
          ? a.src.localeCompare(b.src)
          : b.src.localeCompare(a.src)

      if (aDate === null && bDate === null) return fallbackScore
      if (aDate === null) return 1
      if (bDate === null) return -1

      const dateScore =
        sortOrder === 'oldest' ? aDate - bDate : bDate - aDate

      if (dateScore !== 0) return dateScore
      return fallbackScore
    })
  }, [images, sortOrder])
  const deferredVisibleCount = useDeferredValue(visibleCount)
  const visibleImages = useMemo(
    () => sortedImages.slice(0, deferredVisibleCount),
    [deferredVisibleCount, sortedImages],
  )
  const activeImageIndex = useMemo(() => {
    if (!activeSrc) return -1
    return sortedImages.findIndex((image) => image.src === activeSrc)
  }, [activeSrc, sortedImages])
  const activeImage =
    activeImageIndex >= 0 ? sortedImages[activeImageIndex] : null
  const previousImage =
    activeImageIndex > 0 ? sortedImages[activeImageIndex - 1] : null
  const nextImage =
    activeImageIndex >= 0 && activeImageIndex < sortedImages.length - 1
      ? sortedImages[activeImageIndex + 1]
      : null
  const isViewerOpen = activeImageIndex >= 0
  const isClient = typeof window !== 'undefined'

  const ensureImageIsLoaded = (index: number) => {
    startTransition(() => {
      setVisibleCount((count) =>
        Math.min(Math.max(count, index + 1), sortedImages.length),
      )
    })
  }

  const loadMore = () => {
    startTransition(() => {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, sortedImages.length))
    })
  }

  const updateViewerWidth = () => {
    viewerWidthRef.current = viewerFrameRef.current?.clientWidth || window.innerWidth
  }

  const clearNavTimer = () => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current)
      navTimerRef.current = null
    }
  }

  const resetSlidePosition = () => {
    clearNavTimer()
    setIsDragging(false)
    setIsSettling(true)
    setSlideOffsetPx(0)

    navTimerRef.current = setTimeout(() => {
      setIsSettling(false)
      navTimerRef.current = null
    }, LIGHTBOX_SLIDE_MS)
  }

  const goToIndex = (nextIndex: number) => {
    if (activeImageIndex < 0) return

    const next = Math.max(0, Math.min(nextIndex, sortedImages.length - 1))
    if (next === activeImageIndex) {
      resetSlidePosition()
      return
    }

    updateViewerWidth()
    ensureImageIsLoaded(next)
    preloadImage(sortedImages[next]?.src)
    preloadImage(sortedImages[next + 1]?.src)
    preloadImage(sortedImages[next - 1]?.src)

    const direction = next > activeImageIndex ? 1 : -1
    const width = viewerWidthRef.current || window.innerWidth

    clearNavTimer()
    setIsDragging(false)
    setIsSettling(true)
    setSlideOffsetPx(direction > 0 ? -width : width)

    navTimerRef.current = setTimeout(() => {
      setActiveSrc(sortedImages[next]?.src ?? null)
      setSlideOffsetPx(0)
      setIsSettling(false)
      navTimerRef.current = null
    }, LIGHTBOX_SLIDE_MS)
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
    if (visibleCount >= sortedImages.length) return
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
  }, [sortedImages.length, visibleCount])

  useEffect(() => {
    if (activeImageIndex < 0) return
    ensureImageIsLoaded(activeImageIndex)
  }, [activeImageIndex])

  useEffect(() => {
    if (!isViewerOpen || typeof window === 'undefined') return

    updateViewerWidth()

    const handleResize = () => {
      updateViewerWidth()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isViewerOpen])

  useEffect(() => {
    visibleImages
      .slice(0, EAGER_IMAGE_COUNT)
      .forEach((image) => preloadImage(image.src))
  }, [visibleImages])

  useEffect(() => {
    if (activeImageIndex < 0) return

    preloadImage(sortedImages[activeImageIndex]?.src)
    preloadImage(sortedImages[activeImageIndex + 1]?.src)
    preloadImage(sortedImages[activeImageIndex - 1]?.src)
    preloadImage(sortedImages[activeImageIndex + 2]?.src)
  }, [activeImageIndex, sortedImages])

  useEffect(() => {
    clearNavTimer()
    setSlideOffsetPx(0)
    setIsDragging(false)
    setIsSettling(false)
  }, [sortOrder])

  useEffect(() => {
    if (!isViewerOpen || typeof window === 'undefined') return

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
  }, [isViewerOpen])

  useEffect(() => {
    if (activeImageIndex < 0) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearNavTimer()
        setActiveSrc(null)
        setSlideOffsetPx(0)
        setIsDragging(false)
        setIsSettling(false)
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
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImageIndex, sortedImages.length])

  return (
    <>
      <div className='mb-4 flex items-center justify-end sm:mb-5'>
        <div
          role='group'
          aria-label='Sort gallery images'
          className='flex flex-wrap items-center justify-end gap-2 text-[10px] uppercase tracking-[0.16em] sm:text-[11px]'
        >
          <span className='text-rurikon-300'>sort</span>
          <button
            type='button'
            onClick={() => setSortOrder('oldest')}
            aria-pressed={sortOrder === 'oldest'}
            className={`border-b px-0 py-1 transition-colors duration-200 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4 ${
              sortOrder === 'oldest'
                ? 'border-[var(--color-rurikon-border-strong)] text-rurikon-700'
                : 'border-transparent text-rurikon-400 hover:text-rurikon-600'
            }`}
          >
            oldest first
          </button>
          <span className='text-rurikon-300'>/</span>
          <button
            type='button'
            onClick={() => setSortOrder('newest')}
            aria-pressed={sortOrder === 'newest'}
            className={`border-b px-0 py-1 transition-colors duration-200 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4 ${
              sortOrder === 'newest'
                ? 'border-[var(--color-rurikon-border-strong)] text-rurikon-700'
                : 'border-transparent text-rurikon-400 hover:text-rurikon-600'
            }`}
          >
            newest first
          </button>
        </div>
      </div>

      <div className='columns-2 gap-3 sm:columns-2 lg:columns-3 [column-gap:0.85rem] sm:[column-gap:1rem]'>
        {visibleImages.map((image, index) => (
          <button
            key={image.src}
            type='button'
            onClick={() => setActiveSrc(image.src)}
            className='gallery-card-enter group mb-3 block w-full break-inside-avoid text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4 sm:mb-4'
            style={{
              animationDelay: `${Math.min(index * 26, 240)}ms`,
            }}
            aria-haspopup='dialog'
            aria-expanded={activeImage?.src === image.src}
          >
            <span className='block overflow-hidden rounded-[1.18rem] bg-[var(--surface-soft)] shadow-[0_8px_22px_rgba(0,0,0,0.06)] transition-transform duration-500 ease-out group-hover:-translate-y-0.5'>
              <Image
                src={image.src}
                alt={image.title}
                width={image.width}
                height={image.height}
                sizes={GRID_IMAGE_SIZES}
                quality={66}
                priority={index < EAGER_IMAGE_COUNT}
                loading={index < EAGER_IMAGE_COUNT ? 'eager' : 'lazy'}
                fetchPriority={index < EAGER_IMAGE_COUNT ? 'high' : 'auto'}
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
        {visibleCount < sortedImages.length ? (
          <button
            type='button'
            onClick={loadMore}
            className='rounded-full border border-[var(--color-rurikon-border)] bg-[var(--surface-overlay)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-rurikon-600 transition-colors duration-200 hover:text-rurikon-800'
          >
            load {Math.min(PAGE_SIZE, sortedImages.length - visibleCount)} more
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
                onClick={() => {
                  clearNavTimer()
                  setActiveSrc(null)
                  setSlideOffsetPx(0)
                  setIsDragging(false)
                  setIsSettling(false)
                }}
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
                  const clamped = Math.max(
                    -width * 0.92,
                    Math.min(width * 0.92, deltaX),
                  )

                  if (
                    (activeImageIndex === 0 && clamped > 0) ||
                    (activeImageIndex === sortedImages.length - 1 && clamped < 0)
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
                    activeImageIndex < sortedImages.length - 1
                  ) {
                    goToIndex(activeImageIndex + 1)
                    return
                  }

                  if (
                    Math.abs(deltaX) >= threshold &&
                    Math.abs(deltaX) > Math.abs(deltaY) &&
                    deltaX > 0 &&
                    activeImageIndex > 0
                  ) {
                    goToIndex(activeImageIndex - 1)
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
                    {activeImageIndex + 1} / {sortedImages.length}
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      clearNavTimer()
                      setActiveSrc(null)
                      setSlideOffsetPx(0)
                      setIsDragging(false)
                      setIsSettling(false)
                    }}
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

                {activeImageIndex < sortedImages.length - 1 ? (
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
                            className={`flex h-full w-full items-center justify-center ${
                              index === 1 ? 'gallery-lightbox-image-enter' : ''
                            }`}
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
                      disabled={activeImageIndex === sortedImages.length - 1}
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
