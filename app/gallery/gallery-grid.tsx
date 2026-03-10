'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import cn from 'clsx'

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

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeImage = activeIndex !== null ? images[activeIndex] : null

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
        {images.map((image, index) => (
          <li key={image.src}>
            <button
              type='button'
              onClick={() => setActiveIndex(index)}
              className='group block w-full text-left focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted focus-visible:outline-offset-4'
              aria-haspopup='dialog'
              aria-expanded={activeIndex === index}
            >
              <div className='relative overflow-hidden rounded-2xl bg-[var(--surface-soft)] transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_16px_30px_rgba(0,0,0,0.14)]'>
                <Image
                  src={image.src}
                  alt={image.title}
                  width={image.width}
                  height={image.height}
                  sizes='(min-width: 640px) 50vw, 100vw'
                  quality={82}
                  priority={index < 2}
                  placeholder={image.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={image.blurDataURL}
                  className='h-auto w-full transition-transform duration-700 ease-[cubic-bezier(0.16,0.84,0.22,1)] group-hover:scale-[1.015]'
                />
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          'fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-300',
          activeImage
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        role='dialog'
        aria-modal='true'
        aria-hidden={!activeImage}
      >
        <button
          type='button'
          aria-label='Close details'
          className={cn(
            'absolute inset-0 bg-[rgb(var(--background-rgb)/0.35)] transition-[backdrop-filter,background-color] duration-300',
            activeImage ? 'backdrop-blur-md' : 'backdrop-blur-none',
          )}
          onClick={() => setActiveIndex(null)}
        />
        <div
          className={cn(
            'relative z-10 w-[min(92vw,46rem)] rounded-3xl border border-rurikon-border bg-[var(--surface-overlay)] p-4 shadow-[0_14px_35px_rgba(0,0,0,0.2)] transition-[opacity,transform,filter] duration-300 sm:p-5',
            activeImage
              ? 'opacity-100 translate-y-0 blur-0'
              : 'opacity-0 translate-y-2 blur-sm',
          )}
        >
          {activeImage ? (
            <div className='space-y-4'>
              <div className='overflow-hidden rounded-2xl bg-[var(--surface-soft)]'>
                <Image
                  src={activeImage.src}
                  alt={activeImage.title}
                  width={activeImage.width}
                  height={activeImage.height}
                  sizes='(min-width: 640px) 70vw, 92vw'
                  quality={90}
                  placeholder={activeImage.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={activeImage.blurDataURL}
                  className='h-auto w-full'
                />
              </div>
              {activeImage.dateText ? (
                <dl className='space-y-1 text-sm text-rurikon-600'>
                  <div className='flex items-baseline justify-between gap-4'>
                    <dt className='text-xs text-rurikon-400'>date</dt>
                    <dd className='text-right text-sm text-rurikon-600'>
                      {activeImage.dateText}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
