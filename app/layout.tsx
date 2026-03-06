import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'

// @ts-expect-error types are not available yet?
import { ViewTransition } from 'react'

import cn from 'clsx'
import localFont from 'next/font/local'

import Navbar from '@/components/navbar'
import './globals.css'

const sans = localFont({
  src: './_fonts/InterVariable.woff2',
  preload: false,
  variable: '--sans',
})

const serif = localFont({
  src: './_fonts/LoraItalicVariable.woff2',
  preload: false,
  variable: '--serif',
})

const mono = localFont({
  src: './_fonts/IosevkaFixedCurly-ExtendedMedium.woff2',
  preload: false,
  variable: '--mono',
})

function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return `https://${production}`

  const preview = process.env.VERCEL_URL?.trim()
  if (preview) return `https://${preview}`

  return 'https://qaiiik.vercel.app'
}

const siteUrl = getSiteUrl().replace(/\/+$/, '')
const siteDescription = 'salam ana 7amdi'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s - qaiik',
    default: 'qaiik',
  },
  description: siteDescription,
  applicationName: 'qaiik',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'qaiik',
    title: 'qaiik',
    description: siteDescription,
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'qaiik',
    description: siteDescription,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

const themeInitScript = `
(() => {
  try {
    const root = document.documentElement;
    const storedMode = window.localStorage.getItem('qaiik-theme-mode');
    if (storedMode === 'light' || storedMode === 'dark') {
      root.setAttribute('data-theme-mode', storedMode);
      return;
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.setAttribute('data-theme-mode', 'dark');
    }
  } catch {}
})();
`

const chunkRecoveryScript = `
(() => {
  const reloadKey = 'qaiik-chunk-reload-once';

  const shouldReload = (source) => {
    if (!source) return false;
    return (
      source.includes('/_next/static/chunks/') ||
      source.includes('ChunkLoadError') ||
      source.includes('Loading chunk')
    );
  };

  const safeReload = () => {
    try {
      if (sessionStorage.getItem(reloadKey) === '1') return;
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    } catch {}
  };

  window.addEventListener(
    'error',
    (event) => {
      try {
        const target = event.target;
        const scriptSource =
          target && target.tagName === 'SCRIPT' ? target.src || '' : '';
        const message = event.message || '';

        if (shouldReload(scriptSource) || shouldReload(message)) {
          safeReload();
        }
      } catch {}
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event.reason?.message || event.reason || '');
    if (shouldReload(message)) {
      safeReload();
    }
  });
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className='overflow-x-hidden touch-manipulation'
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: chunkRecoveryScript }} />
      </head>
      <body
        className={cn(
          sans.variable,
          serif.variable,
          mono.variable,
          'w-full p-6 sm:p-10 md:p-14',
          'text-sm leading-6 sm:text-[15px] sm:leading-7 md:text-base md:leading-7',
          'text-rurikon-500',
          'antialiased',
        )}
      >
        <div className='fixed sm:hidden h-6 sm:h-10 md:h-14 w-full top-0 left-0 z-30 pointer-events-none content-fade-out' />
        <div className='flex flex-col mobile:flex-row'>
          <Navbar />
          <main className='relative flex-1 max-w-2xl [contain:inline-size]'>
            <div className='absolute w-full h-px opacity-50 bg-rurikon-border right-0 mobile:right-auto mobile:left-0 mobile:w-px mobile:h-full mobile:opacity-100 mix-blend-multiply' />
            <ViewTransition name='crossfade'>
              <article className='pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14'>
                {children}
              </article>
            </ViewTransition>
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
