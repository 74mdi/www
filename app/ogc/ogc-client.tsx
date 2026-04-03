'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import { SITE_DESCRIPTION, SITE_DOMAIN, SITE_NAME } from '@/app/_lib/site'

type OgVariant = 'default' | 'thoughts'
type OgTheme = 'light' | 'dark'

const INPUT_CLASS =
  'w-full rounded-md border border-[var(--color-rurikon-border)] bg-[var(--background)] px-3 py-2 text-rurikon-600 placeholder:text-rurikon-300 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'

const BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-md border border-[var(--color-rurikon-border)] px-3 py-1.5 text-rurikon-600 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-md focus-visible:outline-offset-2 focus-visible:outline-dotted'

function classForSegment(active: boolean): string {
  return active
    ? `${BUTTON_CLASS} border-[var(--color-rurikon-border-strong)] text-rurikon-800 bg-[var(--frame-background)]`
    : BUTTON_CLASS
}

function withOrigin(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, '')
  return `${normalizedOrigin}${path}`
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function normalizeColorForPicker(input: string): string {
  const value = input.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value}`
  return '#171717'
}

export default function OgCreatorClient() {
  const [origin] = useState(() =>
    typeof window === 'undefined'
      ? `https://${SITE_DOMAIN}`
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

  const titleForMeta = title.trim() || 'Your page title'
  const descriptionForMeta =
    description.trim() || 'Describe your page or article for social previews.'

  const nextJsSnippet = useMemo(
    () =>
      `openGraph: {\n  images: ['${absoluteImageUrl}'],\n},\ntwitter: {\n  card: 'summary_large_image',\n  images: ['${absoluteImageUrl}'],\n}`,
    [absoluteImageUrl],
  )

  const htmlMetaTagsSnippet = useMemo(
    () =>
      `<meta property="og:title" content="${escapeAttribute(titleForMeta)}" />\n<meta property="og:description" content="${escapeAttribute(descriptionForMeta)}" />\n<meta property="og:image" content="${escapeAttribute(absoluteImageUrl)}" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${escapeAttribute(titleForMeta)}" />\n<meta name="twitter:description" content="${escapeAttribute(descriptionForMeta)}" />\n<meta name="twitter:image" content="${escapeAttribute(absoluteImageUrl)}" />`,
    [absoluteImageUrl, descriptionForMeta, titleForMeta],
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

  const applyWebsitePreset = () => {
    setVariant('default')
    setTheme('light')
    setTitle(SITE_NAME)
    setDescription(SITE_DESCRIPTION)
    setSite(SITE_DOMAIN)
    setTag('personal notes')
    setAccent('#171717')
    setNotice('Website preset loaded.')
  }

  const applyLaunchPreset = () => {
    setVariant('default')
    setTheme('dark')
    setTitle('We just launched')
    setDescription('New product is now live. See what changed and what is coming next.')
    setSite('product.yourdomain.com')
    setTag('release update')
    setAccent('#e5e5e5')
    setNotice('Launch preset loaded.')
  }

  const applyThoughtsPreset = () => {
    setVariant('thoughts')
    setTheme('dark')
    setTitle('Thoughts')
    setDescription(SITE_DESCRIPTION)
    setSite(`${SITE_DOMAIN}/thoughts`)
    setTag('essays and notes')
    setSection('thoughts')
    setAccent('#d4d4d4')
    setNotice('Thoughts preset loaded.')
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
    <div className='grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]'>
      <section className='rounded-xl border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5 space-y-5 xl:sticky xl:top-6 self-start'>
        <div className='space-y-1'>
          <h2 className='m-0 text-rurikon-700 font-medium'>Customize</h2>
          <p className='text-rurikon-400 text-sm'>
            Fill fields and copy the output directly.
          </p>
        </div>

        <div className='space-y-2'>
          <p className='text-rurikon-500'>Quick presets</p>
          <div className='grid grid-cols-1 gap-2'>
            <button type='button' className={BUTTON_CLASS} onClick={applyWebsitePreset}>
              Website
            </button>
            <button type='button' className={BUTTON_CLASS} onClick={applyLaunchPreset}>
              Product Launch
            </button>
            <button type='button' className={BUTTON_CLASS} onClick={applyThoughtsPreset}>
              Thoughts Article
            </button>
          </div>
        </div>

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

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
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

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
          <label className='block space-y-1'>
            <span className='text-rurikon-500'>Accent</span>
            <div className='flex gap-2'>
              <input
                className={INPUT_CLASS}
                value={accent}
                placeholder='#171717'
                maxLength={16}
                onChange={(event) => {
                  setAccent(event.target.value)
                }}
              />
              <input
                aria-label='Pick accent color'
                type='color'
                value={normalizeColorForPicker(accent)}
                className='h-10 w-12 rounded-md border border-[var(--color-rurikon-border)] bg-[var(--background)]'
                onChange={(event) => {
                  setAccent(event.target.value)
                }}
              />
            </div>
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
          ) : null}
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
          <button type='button' className={BUTTON_CLASS} onClick={resetToDefaults}>
            Reset
          </button>
        </div>

        {notice ? <p className='text-rurikon-500 text-sm'>{notice}</p> : null}
      </section>

      <section className='space-y-4'>
        <div className='rounded-xl border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5 space-y-3'>
          <div className='space-y-1'>
            <h2 className='m-0 text-rurikon-700 font-medium'>Preview</h2>
            <p className='text-rurikon-400 text-sm'>
              This is the final OG image generated from your settings.
            </p>
          </div>

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

          <div className='rounded-md border border-[var(--color-rurikon-border)] bg-[var(--frame-background)] p-3 space-y-2'>
            <p className='text-rurikon-400 text-xs uppercase tracking-[0.22em]'>Image URL</p>
            <p className='break-all text-rurikon-600 text-sm'>{absoluteImageUrl}</p>
          </div>
        </div>

        <div className='rounded-xl border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 p-4 sm:p-5 space-y-4'>
          <div className='space-y-1'>
            <h2 className='m-0 text-rurikon-700 font-medium'>Code Output</h2>
            <p className='text-rurikon-400 text-sm'>
              Next.js and HTML tags are stacked below so you can copy either one.
            </p>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-rurikon-500 text-sm'>Next.js Metadata</p>
              <button
                type='button'
                className={BUTTON_CLASS}
                onClick={() => {
                  void copyToClipboard(nextJsSnippet, 'Next.js snippet copied.')
                }}
              >
                Copy
              </button>
            </div>
            <pre className='overflow-x-auto rounded-md border border-[var(--color-rurikon-border)] bg-[var(--frame-background)] p-3 text-xs leading-5 text-rurikon-500'>
              {nextJsSnippet}
            </pre>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-rurikon-500 text-sm'>HTML Meta Tags</p>
              <button
                type='button'
                className={BUTTON_CLASS}
                onClick={() => {
                  void copyToClipboard(htmlMetaTagsSnippet, 'HTML tags copied.')
                }}
              >
                Copy
              </button>
            </div>
            <pre className='overflow-x-auto rounded-md border border-[var(--color-rurikon-border)] bg-[var(--frame-background)] p-3 text-xs leading-5 text-rurikon-500'>
              {htmlMetaTagsSnippet}
            </pre>
          </div>
        </div>
      </section>
    </div>
  )
}
