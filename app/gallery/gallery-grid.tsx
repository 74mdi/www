'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  const visibleImages = images.slice(0, visibleCount)
  const activeImage = activeIndex !== null ? visibleImages[activeIndex] : null
  const numCols = useNumCols()
  const scrollYRef = useRef(0)

  const cols = useMemo(() => {
    const result: GalleryGridImage[][] = Array.from({ length: numCols }, () => [])
    visibleImages.forEach((img, i) => result[i % numCols].push(img))
    return result
  }, [visibleImages, numCols])

  useEffect(() => {
    if (!activeImage) {
      const top = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''

      const scrollY = top ? Math.abs(Number.parseInt(top, 10)) || scrollYRef.current : scrollYRef.current
      if (scrollY) window.scrollTo(0, scrollY)
      return
    }

    scrollYRef.current = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYRef.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      const top = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''

      const scrollY = top ? Math.abs(Number.parseInt(top, 10)) || scrollYRef.current : scrollYRef.current
      if (scrollY) window.scrollTo(0, scrollY)
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
                  onClick={() => setActiveIndex(globalIndex)}
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

      {activeImage ? (
        <div
          className='fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center'
          role='dialog'
          aria-modal='true'
        >
          <div
            className='absolute inset-0 bg-[rgb(var(--background-rgb)/0.8)] backdrop-blur-md'
            aria-hidden='true'
            onClick={() => setActiveIndex(null)}
          />
          <div className='relative z-10 flex h-full w-full items-center justify-center p-4'>
            <div className='flex flex-col items-center'>
              <Image
                src={activeImage.src}
                alt={activeImage.title}
                width={activeImage.width}
                height={activeImage.height}
                sizes='(min-width: 640px) 90vw, 96vw'
                quality={90}
                placeholder={activeImage.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={activeImage.blurDataURL}
                className='max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-[0_18px_40px_rgba(0,0,0,0.28)]'
                onClick={() => setActiveIndex(null)}
              />
              {activeImage.dateText ? (
                <div className='mt-3 text-xs text-rurikon-400'>
                  {activeImage.dateText}
                </div>
              ) : null}
            </div>
          </div>
          <button
            type='button'
            aria-label='Close image'
            onClick={() => setActiveIndex(null)}
            className='absolute right-4 top-4 z-20 rounded-full border border-rurikon-border bg-[var(--surface-overlay)] px-3 py-1 text-xs text-rurikon-600 transition-colors hover:text-rurikon-800'
          >
            close
          </button>
        </div>
      ) : null}
    </>
  )
}
