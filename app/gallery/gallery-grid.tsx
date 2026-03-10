'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

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

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(PAGE_SIZE, images.length),
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const visibleImages = images.slice(0, visibleCount)
  const activeImage = activeIndex !== null ? visibleImages[activeIndex] : null

  useEffect(() => {
    if (!activeImage) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeImage])

  return (
    <>
      <ul className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {visibleImages.map((image, index) => (
          <li key={image.src}>
            <button
              type='button'
              onClick={() => setActiveIndex(index)}
              className='group block w-full text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4'
              aria-haspopup='dialog'
              aria-expanded={activeIndex === index}
            >
              <div className='relative overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:rotate-[-0.4deg] group-hover:shadow-[0_22px_44px_rgba(0,0,0,0.2)]'>
                <Image
                  src={image.src}
                  alt={image.title}
                  width={image.width}
                  height={image.height}
                  sizes='(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
                  quality={60}
                  priority={index < 3}
                  placeholder={image.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={image.blurDataURL}
                  className='h-auto w-full rounded-2xl transition-transform duration-700 ease-[cubic-bezier(0.16,0.84,0.22,1)] group-hover:scale-[1.03]'
                />
              </div>
            </button>
          </li>
        ))}
      </ul>

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

      {activeImage ? (
        <div
          className='fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10'
          role='dialog'
          aria-modal='true'
        >
          <div
            className='absolute inset-0 bg-[rgb(var(--background-rgb)/0.55)] [will-change:backdrop-filter] sm:[backdrop-filter:blur(12px)]'
            aria-hidden='true'
            onClick={() => setActiveIndex(null)}
          />
          <div className='relative z-10 flex w-full flex-col items-center'>
            <Image
              src={activeImage.src}
              alt={activeImage.title}
              width={activeImage.width}
              height={activeImage.height}
              sizes='(min-width: 640px) 90vw, 96vw'
              quality={90}
              placeholder={activeImage.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={activeImage.blurDataURL}
              className='max-h-[82vh] w-auto max-w-full rounded-3xl object-contain shadow-[0_18px_40px_rgba(0,0,0,0.28)]'
              onClick={() => setActiveIndex(null)}
            />
            {activeImage.dateText ? (
              <div className='mt-4 text-xs text-rurikon-400'>
                {activeImage.dateText}
              </div>
            ) : null}
          </div>
          <button
            type='button'
            aria-label='Close image'
            onClick={() => setActiveIndex(null)}
            className='absolute right-5 top-5 z-20 rounded-full border border-rurikon-border bg-[var(--surface-overlay)] px-3 py-1 text-xs text-rurikon-600 transition-colors hover:text-rurikon-800'
          >
            close
          </button>
        </div>
      ) : null}
    </>
  )
}
