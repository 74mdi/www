'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getGalleryDateSortTime } from '@/app/_lib/gallery-date'
import type { GalleryGridImage } from '@/app/gallery/gallery-types'

type GalleryGridProps = {
  images: GalleryGridImage[]
}

type GallerySortOrder = 'oldest' | 'newest'

const GalleryLightbox = dynamic(
  () => import('@/app/gallery/gallery-lightbox'),
  { ssr: false },
)

const PAGE_SIZE = 12
const INITIAL_BATCH = 14
const EAGER_IMAGE_COUNT = 9
const GRID_IMAGE_SIZES =
  '(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, 50vw'

function getImageSortTime(image: GalleryGridImage): number | null {
  if (typeof image.sortTime === 'number' && Number.isFinite(image.sortTime)) {
    return image.sortTime
  }

  return getGalleryDateSortTime(undefined, image.src)
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [sortOrder, setSortOrder] = useState<GallerySortOrder>('oldest')
  const [columnCount, setColumnCount] = useState(2)
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_BATCH, images.length),
  )
  const [activeSrc, setActiveSrc] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const preloadedImagesRef = useRef<Set<string>>(new Set())

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

  const imageColumns = useMemo(() => {
    const columns = Array.from({ length: columnCount }, () => [] as Array<{
      image: GalleryGridImage
      index: number
    }>)

    visibleImages.forEach((image, index) => {
      columns[index % columnCount]?.push({ image, index })
    })

    return columns
  }, [columnCount, visibleImages])

  const activeImageIndex = useMemo(() => {
    if (!activeSrc) return -1
    return sortedImages.findIndex((image) => image.src === activeSrc)
  }, [activeSrc, sortedImages])

  const loadMore = () => {
    startTransition(() => {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, sortedImages.length))
    })
  }

  const preloadImage = (src: string | undefined) => {
    if (!src || typeof window === 'undefined') return
    if (preloadedImagesRef.current.has(src)) return

    const image = new window.Image()
    image.decoding = 'async'
    image.src = src
    if (typeof image.decode === 'function') {
      void image.decode().catch(() => {})
    }
    preloadedImagesRef.current.add(src)
  }

  const handleSortChange = (nextSortOrder: GallerySortOrder) => {
    if (nextSortOrder === sortOrder) return
    setSortOrder(nextSortOrder)
  }

  const handleActiveIndexChange = (nextIndex: number) => {
    const nextImage = sortedImages[nextIndex]
    if (!nextImage) return

    startTransition(() => {
      setVisibleCount((count) =>
        Math.min(Math.max(count, nextIndex + 1), sortedImages.length),
      )
    })
    setActiveSrc(nextImage.src)
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
        startTransition(() => {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, sortedImages.length))
        })
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
    startTransition(() => {
      setVisibleCount((count) =>
        Math.min(Math.max(count, activeImageIndex + 1), sortedImages.length),
      )
    })
  }, [activeImageIndex, sortedImages.length])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const syncResponsiveLayout = () => {
      const isDesktop = desktopQuery.matches
      setColumnCount(isDesktop ? 3 : 2)
      setVisibleCount((count) => {
        if (isDesktop) return images.length
        return Math.min(Math.max(count, INITIAL_BATCH), images.length)
      })
    }

    syncResponsiveLayout()

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', syncResponsiveLayout)
      return () => {
        desktopQuery.removeEventListener('change', syncResponsiveLayout)
      }
    }

    desktopQuery.addListener(syncResponsiveLayout)
    return () => {
      desktopQuery.removeListener(syncResponsiveLayout)
    }
  }, [images.length])

  useEffect(() => {
    visibleImages
      .slice(0, EAGER_IMAGE_COUNT)
      .forEach((image) => preloadImage(image.src))
  }, [visibleImages])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const prefetchLightbox = () => {
      void import('@/app/gallery/gallery-lightbox')
    }

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchLightbox, {
        timeout: 1200,
      })
      return () => {
        window.cancelIdleCallback(idleId)
      }
    }

    const timeoutId = setTimeout(prefetchLightbox, 900)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

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
            onClick={() => handleSortChange('oldest')}
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
            onClick={() => handleSortChange('newest')}
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

      <div
        className='grid grid-cols-2 gap-x-[0.85rem] gap-y-3 sm:gap-x-4 sm:gap-y-4'
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
      >
        {imageColumns.map((column, columnIndex) => (
          <div key={columnIndex} className='flex flex-col gap-3 sm:gap-4'>
            {column.map(({ image, index }) => (
              <button
                key={image.src}
                type='button'
                onClick={() => setActiveSrc(image.src)}
                className='gallery-card-enter group block w-full text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4'
                style={{
                  animationDelay: `${Math.min(index * 26, 240)}ms`,
                  contentVisibility:
                    index < EAGER_IMAGE_COUNT ? 'visible' : 'auto',
                }}
                aria-haspopup='dialog'
                aria-expanded={activeSrc === image.src}
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

      {activeImageIndex >= 0 ? (
        <GalleryLightbox
          images={sortedImages}
          activeIndex={activeImageIndex}
          onClose={() => setActiveSrc(null)}
          onSelectIndex={handleActiveIndexChange}
        />
      ) : null}
    </>
  )
}
