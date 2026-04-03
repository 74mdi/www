import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import cn from 'clsx'
import localFont from 'next/font/local'
import Script from 'next/script'

import { buildOgImageUrl } from '@/app/_lib/og-image-url'
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
} from '@/app/_lib/site'
import Navbar from '@/components/navbar'
import PageTransitionShell from '@/components/page-transition-shell'
import './globals.css'

const sans = localFont({
  src: './_fonts/InterVariable.woff2',
  preload: true,
  variable: '--sans',
})

const serif = localFont({
  src: './_fonts/LoraItalicVariable.woff2',
  preload: false,
  variable: '--serif',
})

const mono = localFont({
  src: './_fonts/IosevkaFixedCurly-Medium.woff2',
  preload: false,
  variable: '--mono',
})

const enableVercelAnalytics =
  process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === '1'

const siteUrl = getSiteUrl().replace(/\/+$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: '7amdi', url: siteUrl }],
  creator: '7amdi',
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
      }),
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      buildOgImageUrl({
        variant: 'default',
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
      }),
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
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
    const storedMode = window.localStorage.getItem('7amdi-theme-mode');
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
  const reloadKey = '7amdi-chunk-reload-once';

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
            <div className='absolute w-full h-px opacity-60 bg-[var(--color-rurikon-border-strong)] right-0 mobile:right-auto mobile:left-0 mobile:w-px mobile:h-full mobile:opacity-100' />
            <PageTransitionShell className='pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14'>
              {children}
            </PageTransitionShell>
          </main>
        </div>
        {enableVercelAnalytics ? <Analytics /> : null}
        <Script id='chunk-recovery' strategy='afterInteractive'>
          {chunkRecoveryScript}
        </Script>
        <SpeedInsights />
      </body>
    </html>
  )
}
