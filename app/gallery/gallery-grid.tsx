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
              <div className='relative overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_16px_30px_rgba(0,0,0,0.14)]'>
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
                  className='h-auto w-full rounded-2xl transition-transform duration-700 ease-[cubic-bezier(0.16,0.84,0.22,1)] group-hover:scale-[1.015]'
                />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {activeImage ? (
        <div
          className='fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10'
          role='dialog'
          aria-modal='true'
        >
          <button
            type='button'
            aria-label='Close details'
            className='absolute inset-0 bg-[rgb(var(--background-rgb)/0.35)] backdrop-blur-md'
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
            />
            {activeImage.dateText ? (
              <div className='mt-4 text-xs text-rurikon-400'>
                {activeImage.dateText}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
