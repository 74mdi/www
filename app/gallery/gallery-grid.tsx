'use client'

import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

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

function extractDateFromSrc(src: string): string | null {
  const filename = src.split('/').pop() ?? ''
  const match = filename.match(/^(\d{2})(\d{2})(\d{4})/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  if (day < 1 || day > 31 || month < 1 || month > 12) return null

  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function resolveDateText(image: GalleryGridImage): string {
  return image.dateText ?? extractDateFromSrc(image.src) ?? 'undated'
}

function getOrientationLabel(image: GalleryGridImage): string {
  const ratio = image.width / image.height
  if (ratio >= 1.18) return 'landscape'
  if (ratio <= 0.82) return 'portrait'
  return 'square'
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_BATCH, images.length),
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const isClient = typeof window !== 'undefined'
  const deferredVisibleCount = useDeferredValue(visibleCount)
  const visibleImages = useMemo(
    () => images.slice(0, deferredVisibleCount),
    [deferredVisibleCount, images],
  )
  const activeImage = activeIndex !== null ? images[activeIndex] : null
  const activeImageIndex = activeIndex ?? 0

  const openImage = (index: number) => {
    setActiveIndex(index)
  }

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

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
        return
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => {
          if (current === null) return current
          const next = Math.min(current + 1, images.length - 1)
          ensureImageIsLoaded(next)
          return next
        })
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => {
          if (current === null) return current
          return Math.max(current - 1, 0)
        })
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [activeIndex, images.length])

  return (
    <>
      <div className='columns-2 gap-3 sm:columns-2 lg:columns-3 [column-gap:0.85rem] sm:[column-gap:1rem]'>
        {visibleImages.map((image, index) => (
          <button
            key={image.src}
            type='button'
            onClick={() => openImage(index)}
            className='gallery-card-enter group mb-3 block w-full break-inside-avoid text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4 sm:mb-4'
            style={{
              animationDelay: `${Math.min(index * 32, 320)}ms`,
            }}
            aria-haspopup='dialog'
            aria-expanded={activeIndex === index}
          >
            <span className='relative block overflow-hidden rounded-[1.4rem] border border-[var(--color-rurikon-border)] bg-[var(--surface-overlay)] shadow-[0_14px_34px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-active:translate-y-0'>
              <Image
                src={image.src}
                alt={image.title}
                width={image.width}
                height={image.height}
                sizes={GRID_IMAGE_SIZES}
                quality={68}
                priority={index < 4}
                placeholder={image.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={image.blurDataURL}
                decoding='async'
                className='h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />

              <span className='pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/18 to-transparent opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100' />

              <span className='absolute left-3 top-3 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm'>
                {getOrientationLabel(image)}
              </span>

              <span className='absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 text-white transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100'>
                <span className='min-w-0 truncate text-[12px] font-medium tracking-[0.01em]'>
                  {image.title}
                </span>
                <span className='shrink-0 text-[11px] uppercase tracking-[0.16em] text-white/88'>
                  {resolveDateText(image)}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      <div
        ref={loadMoreRef}
        className='flex flex-col items-center gap-3 pt-3 sm:pt-4'
      >
        {visibleCount < images.length ? (
          <button
            type='button'
            onClick={loadMore}
            className='rounded-full border border-[var(--color-rurikon-border)] bg-[var(--surface-overlay)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-rurikon-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-rurikon-800'
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
            <div
              className='fixed inset-0 z-50'
              aria-hidden={activeImage ? undefined : true}
            >
              <button
                type='button'
                aria-label='Close image preview'
                className='gallery-overlay-enter absolute inset-0 bg-black/82'
                onClick={() => setActiveIndex(null)}
              />
              <div className='absolute inset-0 overflow-y-auto overscroll-contain p-3 sm:p-5'>
                <div className='mx-auto flex min-h-full max-w-6xl items-center justify-center'>
                  <div
                    role='dialog'
                    aria-modal='true'
                    aria-label={activeImage.title}
                    className='gallery-lightbox-enter relative w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0a0a] text-white shadow-[0_36px_90px_rgba(0,0,0,0.48)]'
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-white'>
                          {activeImage.title}
                        </p>
                        <p className='mt-1 text-[11px] uppercase tracking-[0.18em] text-white/60'>
                          {activeIndex !== null ? `${activeIndex + 1} / ${images.length}` : ''}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() => setActiveIndex(null)}
                        className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/85 transition-colors duration-200 hover:bg-white/12'
                      >
                        <XMarkIcon className='h-5 w-5' />
                      </button>
                    </div>

                    <div className='relative flex justify-center px-2 py-2 sm:px-4 sm:py-4'>
                      {activeImageIndex > 0 ? (
                        <button
                          type='button'
                          onClick={() => setActiveIndex((current) => (current === null ? current : Math.max(current - 1, 0)))}
                          className='absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/35 text-white transition-colors duration-200 hover:bg-black/55'
                          aria-label='Previous image'
                        >
                          <ArrowLeftIcon className='h-5 w-5' />
                        </button>
                      ) : null}

                      {activeImageIndex < images.length - 1 ? (
                        <button
                          type='button'
                          onClick={() =>
                            setActiveIndex((current) => {
                              if (current === null) return current
                              const next = Math.min(current + 1, images.length - 1)
                              ensureImageIsLoaded(next)
                              return next
                            })
                          }
                          className='absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/35 text-white transition-colors duration-200 hover:bg-black/55'
                          aria-label='Next image'
                        >
                          <ArrowRightIcon className='h-5 w-5' />
                        </button>
                      ) : null}

                      <div className='flex w-full items-center justify-center rounded-[1.35rem] bg-[#050505] p-1.5 sm:p-2.5'>
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
                          className='h-auto max-h-[78vh] w-auto max-w-full rounded-[1rem] object-contain'
                        />
                      </div>
                    </div>

                    <div className='grid gap-3 border-t border-white/10 px-4 py-4 text-sm text-white/72 sm:grid-cols-[1fr_auto] sm:px-5'>
                      <div>
                        <p className='text-[11px] uppercase tracking-[0.18em] text-white/48'>
                          captured
                        </p>
                        <p className='mt-1 text-white/82'>{resolveDateText(activeImage)}</p>
                      </div>
                      <div>
                        <p className='text-[11px] uppercase tracking-[0.18em] text-white/48'>
                          frame
                        </p>
                        <p className='mt-1 text-white/82'>{getOrientationLabel(activeImage)}</p>
                      </div>
                    </div>
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
