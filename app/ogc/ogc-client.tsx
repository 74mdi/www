'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'

type OgVariant = 'default' | 'thoughts'
type OgTheme = 'light' | 'dark'

const INPUT_CLASS =
  'w-full rounded-md border border-[var(--color-rurikon-border)] bg-[var(--background)] px-3 py-2 text-rurikon-600 placeholder:text-rurikon-300 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'

const BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-md border border-[var(--color-rurikon-border)] px-3 py-1.5 text-rurikon-600 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-md focus-visible:outline-offset-2 focus-visible:outline-dotted'

function classForSegment(active: boolean): string {
  return active
    ? `${BUTTON_CLASS} border-[var(--color-rurikon-border-strong)] text-rurikon-800`
    : BUTTON_CLASS
}

function withOrigin(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, '')
  return `${normalizedOrigin}${path}`
}

export default function OgCreatorClient() {
  const [origin] = useState(() =>
    typeof window === 'undefined'
      ? 'https://qaiik.vercel.app'
      : window.location.origin,
  )
  const [variant, setVariant] = useState<OgVariant>('default')
  const [theme, setTheme] = useState<OgTheme>('light')
  const [title, setTitle] = useState('Your page title')
  const [description, setDescription] = useState(
    'Describe your page or article so it looks clean in social previews.',
  )
  const [site, setSite] = useState('yourdomain.com')
  const [tag, setTag] = useState('personal notes')
  const [section, setSection] = useState('thoughts')
  const [accent, setAccent] = useState('#171717')
  const [notice, setNotice] = useState<string | null>(null)

  const relativeImageUrl = useMemo(
    () =>
      buildOgImageUrl({
        variant,
        title,
        description,
        site,
        tag,
        section: variant === 'thoughts' ? section : undefined,
        theme,
        accent,
      }),
    [accent, description, section, site, tag, theme, title, variant],
  )

  const absoluteImageUrl = useMemo(
    () => withOrigin(origin, relativeImageUrl),
    [origin, relativeImageUrl],
  )

  const metadataSnippet = useMemo(
    () =>
      `openGraph: {\n  images: ['${absoluteImageUrl}'],\n},\ntwitter: {\n  card: 'summary_large_image',\n  images: ['${absoluteImageUrl}'],\n}`,
    [absoluteImageUrl],
  )

  const resetToDefaults = () => {
    setVariant('default')
    setTheme('light')
    setTitle('Your page title')
    setDescription('Describe your page or article so it looks clean in social previews.')
    setSite('yourdomain.com')
    setTag('personal notes')
    setSection('thoughts')
    setAccent('#171717')
    setNotice('Reset to defaults.')
  }

  const copyToClipboard = async (value: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setNotice(successText)
    } catch {
      setNotice('Copy failed. Try manually selecting the text.')
    }
  }

  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]'>
      <section className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5 space-y-4'>
        <div className='space-y-2'>
          <p className='text-rurikon-500'>Variant</p>
          <div className='grid grid-cols-2 gap-2'>
            <button
              type='button'
              className={classForSegment(variant === 'default')}
              onClick={() => {
                setVariant('default')
                setTag((current) => (current.trim() ? current : 'personal notes'))
              }}
            >
              Default
            </button>
            <button
              type='button'
              className={classForSegment(variant === 'thoughts')}
              onClick={() => {
                setVariant('thoughts')
                setTheme('dark')
                setTag((current) => (current.trim() ? current : 'essays and notes'))
              }}
            >
              Thoughts
            </button>
          </div>
        </div>

        <div className='space-y-2'>
          <p className='text-rurikon-500'>Theme</p>
          <div className='grid grid-cols-2 gap-2'>
            <button
              type='button'
              className={classForSegment(theme === 'light')}
              onClick={() => {
                setTheme('light')
              }}
            >
              Light
            </button>
            <button
              type='button'
              className={classForSegment(theme === 'dark')}
              onClick={() => {
                setTheme('dark')
              }}
            >
              Dark
            </button>
          </div>
        </div>

        <label className='block space-y-1'>
          <span className='text-rurikon-500'>Title</span>
          <input
            className={INPUT_CLASS}
            value={title}
            maxLength={120}
            onChange={(event) => {
              setTitle(event.target.value)
            }}
          />
        </label>

        <label className='block space-y-1'>
          <span className='text-rurikon-500'>Description</span>
          <textarea
            className={INPUT_CLASS}
            rows={3}
            value={description}
            maxLength={220}
            onChange={(event) => {
              setDescription(event.target.value)
            }}
          />
        </label>

        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='block space-y-1'>
            <span className='text-rurikon-500'>Site</span>
            <input
              className={INPUT_CLASS}
              value={site}
              maxLength={80}
              onChange={(event) => {
                setSite(event.target.value)
              }}
            />
          </label>

          <label className='block space-y-1'>
            <span className='text-rurikon-500'>Tagline</span>
            <input
              className={INPUT_CLASS}
              value={tag}
              maxLength={80}
              onChange={(event) => {
                setTag(event.target.value)
              }}
            />
          </label>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='block space-y-1'>
            <span className='text-rurikon-500'>Accent</span>
            <input
              className={INPUT_CLASS}
              value={accent}
              placeholder='#171717'
              maxLength={16}
              onChange={(event) => {
                setAccent(event.target.value)
              }}
            />
          </label>

          {variant === 'thoughts' ? (
            <label className='block space-y-1'>
              <span className='text-rurikon-500'>Section</span>
              <input
                className={INPUT_CLASS}
                value={section}
                maxLength={50}
                onChange={(event) => {
                  setSection(event.target.value)
                }}
              />
            </label>
          ) : (
            <div className='hidden sm:block' />
          )}
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            className={BUTTON_CLASS}
            onClick={() => {
              void copyToClipboard(absoluteImageUrl, 'Image URL copied.')
            }}
          >
            Copy Image URL
          </button>
          <button
            type='button'
            className={BUTTON_CLASS}
            onClick={() => {
              void copyToClipboard(metadataSnippet, 'Metadata snippet copied.')
            }}
          >
            Copy Metadata Snippet
          </button>
          <button type='button' className={BUTTON_CLASS} onClick={resetToDefaults}>
            Reset
          </button>
        </div>

        {notice ? <p className='text-rurikon-500 text-sm'>{notice}</p> : null}
      </section>

      <section className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5 space-y-3'>
        <div className='overflow-hidden rounded-md border border-[var(--color-rurikon-border)] bg-[var(--frame-background)]'>
          <Image
            src={relativeImageUrl}
            alt='Open Graph preview'
            width={1200}
            height={630}
            unoptimized
            className='h-auto w-full'
          />
        </div>

        <div className='space-y-1'>
          <p className='text-rurikon-400 text-sm'>Image URL</p>
          <p className='break-all text-rurikon-600 text-sm'>{absoluteImageUrl}</p>
        </div>

        <div className='space-y-1'>
          <p className='text-rurikon-400 text-sm'>Next.js Metadata Snippet</p>
          <pre className='overflow-x-auto rounded-md border border-[var(--color-rurikon-border)] bg-[var(--frame-background)] p-3 text-xs leading-5 text-rurikon-500'>
            {metadataSnippet}
          </pre>
        </div>
      </section>
    </div>
  )
}
