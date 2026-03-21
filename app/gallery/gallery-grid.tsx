'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'

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

const PREVIEW_GAP_PX = 10
const PREVIEW_MARGIN_PX = 10

const useNumCols = () => {
  const [numCols, setNumCols] = useState(2)
  useLayoutEffect(() => {
    const update = () => setNumCols(window.innerWidth >= 1024 ? 3 : 2)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return numCols
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(PAGE_SIZE, images.length),
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const visibleImages = images.slice(0, visibleCount)
  const activeImage = activeIndex !== null ? visibleImages[activeIndex] : null
  const numCols = useNumCols()
  const activeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [previewPosition, setPreviewPosition] = useState({ left: 0, top: 0 })
  const isClient = typeof window !== 'undefined'

  const cols = useMemo(() => {
    const result: GalleryGridImage[][] = Array.from({ length: numCols }, () => [])
    visibleImages.forEach((img, i) => result[i % numCols].push(img))
    return result
  }, [visibleImages, numCols])

  useEffect(() => {
    if (!activeImage) return

    setIsZoomed(false)

    const updatePreviewPosition = () => {
      const button = activeButtonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const previewWidth = window.matchMedia('(min-width: 640px)').matches
        ? 520
        : Math.min(360, window.innerWidth - PREVIEW_MARGIN_PX * 2)

      const clampedLeft = Math.min(
        Math.max(rect.left + rect.width / 2 - previewWidth / 2, PREVIEW_MARGIN_PX),
        window.innerWidth - previewWidth - PREVIEW_MARGIN_PX,
      )

      const previewHeight = Math.min(
        Math.floor(window.innerHeight * 0.72),
        window.matchMedia('(min-width: 640px)').matches ? 520 : 420,
      )

      let top = rect.bottom + PREVIEW_GAP_PX
      if (top + previewHeight > window.innerHeight - PREVIEW_MARGIN_PX) {
        top = Math.max(
          PREVIEW_MARGIN_PX,
          rect.top - previewHeight - PREVIEW_GAP_PX,
        )
      }

      setPreviewPosition({ left: clampedLeft, top })
    }

    updatePreviewPosition()

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (activeButtonRef.current?.contains(target)) return
      if (previewRef.current?.contains(target)) return
      setActiveIndex(null)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null)
    }

    const handleViewportChange = () => {
      updatePreviewPosition()
    }

    const handleScrollClose = () => {
      setActiveIndex(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleScrollClose, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleScrollClose, true)
    }
  }, [activeImage])

  return (
    <>
      <div className='flex gap-2'>
        {cols.map((col, ci) => (
          <div key={ci} className='flex flex-1 flex-col gap-2'>
            {col.map((image, index) => {
              const globalIndex = ci + index * numCols
              return (
                <button
                  key={image.src}
                  type='button'
                  onClick={(event) => {
                    activeButtonRef.current = event.currentTarget
                    setActiveIndex(globalIndex)
                  }}
                  className='block w-full text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4'
                  aria-haspopup='dialog'
                  aria-expanded={activeIndex === globalIndex}
                >
                  <Image
                    src={image.src}
                    alt={image.title}
                    width={image.width}
                    height={image.height}
                    sizes='(min-width: 1024px) 33vw, 50vw'
                    quality={60}
                    priority={globalIndex < 4}
                    placeholder={image.blurDataURL ? 'blur' : 'empty'}
                    blurDataURL={image.blurDataURL}
                    className='h-auto w-full rounded-lg'
                  />
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {visibleCount < images.length ? (
        <div className='flex justify-center pt-4'>
          <button
            type='button'
            onClick={() =>
              setVisibleCount((count) =>
                Math.min(count + PAGE_SIZE, images.length),
              )
            }
            className='rounded-full border border-rurikon-border bg-[var(--surface-overlay)] px-4 py-2 text-xs text-rurikon-600 transition-colors hover:text-rurikon-700'
          >
            load more
          </button>
        </div>
      ) : null}

      {isClient && activeImage
        ? createPortal(
            <div
              className='fixed inset-0 z-50 pointer-events-none'
              aria-hidden={activeImage ? undefined : true}
            >
              <div
                ref={previewRef}
                role='dialog'
                aria-modal='false'
                className={`absolute origin-top-left transition-all duration-200 ease-out ${activeImage ? 'pointer-events-auto opacity-100 scale-100 translate-y-0' : 'pointer-events-none opacity-0 scale-95 -translate-y-1'}`}
                style={{
                  left: `${previewPosition.left}px`,
                  top: `${previewPosition.top}px`,
                  width: window.matchMedia('(min-width: 640px)').matches
                    ? '520px'
                    : `${Math.min(360, window.innerWidth - PREVIEW_MARGIN_PX * 2)}px`,
                }}
              >
                <div className='rounded-2xl border border-rurikon-border bg-[var(--surface-overlay)] shadow-[var(--overlay-shadow-strong)] overflow-hidden'>
                  <div className='p-2'>
                    <Image
                      src={activeImage.src}
                      alt={activeImage.title}
                      width={activeImage.width}
                      height={activeImage.height}
                      sizes='(min-width: 640px) 520px, 90vw'
                      quality={90}
                      placeholder={activeImage.blurDataURL ? 'blur' : 'empty'}
                      blurDataURL={activeImage.blurDataURL}
                      onDoubleClick={() => setIsZoomed((prev) => !prev)}
                      style={{ transform: isZoomed ? 'scale(1.6)' : 'scale(1)' }}
                      className={
                        isZoomed
                          ? 'h-auto w-full rounded-xl object-contain bg-[var(--surface-raised)] cursor-zoom-out transition-transform duration-200 ease-out'
                          : 'h-auto w-full rounded-xl object-contain bg-[var(--surface-raised)] cursor-zoom-in transition-transform duration-200 ease-out'
                      }
                    />
                  </div>
                  <div className='px-4 pb-4 pt-1 space-y-2'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='text-xs text-rurikon-600 [overflow-wrap:anywhere]'>
                        {activeImage.dateText ?? 'Unknown date'}
                      </div>
                      <button
                        type='button'
                        onClick={() => setIsZoomed((prev) => !prev)}
                        className='shrink-0 rounded-full border border-rurikon-border bg-[var(--surface-overlay)] px-3 py-1 text-[11px] text-rurikon-600 transition-colors hover:text-rurikon-800'
                      >
                        {isZoomed ? 'zoom out' : 'zoom'}
                      </button>
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
