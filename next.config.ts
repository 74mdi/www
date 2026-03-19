import withMDX from '@next/mdx'
import { NextConfig } from 'next'

export default withMDX()({
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  turbopack: {},
  redirects: async () => [
    {
      source: '/posts/:slug',
      destination: '/thoughts/:slug',
      permanent: false,
    },
    {
      source: '/quraan',
      destination: '/quran',
      permanent: false,
    },
    {
      source: '/qur-an',
      destination: '/quran',
      permanent: false,
    },
    {
      source: '/quran-kareem',
      destination: '/quran',
      permanent: false,
    },
    {
      source: '/quran-karim',
      destination: '/quran',
      permanent: false,
    },
    {
      source: '/al-quran',
      destination: '/quran',
      permanent: false,
    },
    {
      source: '/holy-quran',
      destination: '/quran',
      permanent: false,
    },
    {
      source: '/koran',
      destination: '/quran',
      permanent: false,
    },
    {
      source: '/quran/index',
      destination: '/quran',
      permanent: false,
    },
  ],
  experimental: {
    mdxRs: {
      mdxType: 'gfm',
    },
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
  transpilePackages: ['shiki'],
  serverExternalPackages: ['@shikijs/twoslash'],
  images: {
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [16, 32, 64, 128, 256, 384, 512],
  },
} satisfies NextConfig)
