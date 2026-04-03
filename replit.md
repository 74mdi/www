# 7amdi

A Next.js 16 (canary) personal website migrated from Vercel to Replit.

## Stack

- **Framework**: Next.js 16.1.1-canary with Turbopack
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS 4
- **Content**: MDX with Shiki syntax highlighting
- **Language**: TypeScript

## Features

- Blog/thoughts section (MDX posts)
- Gallery with image manifest
- Last.fm integration (`/api/lastfm/latest`)
- Siftli integration (Telegram/Discord webhooks)
- OG image generation
- KaTeX math rendering

## Running the App

```bash
pnpm run dev   # Development server on port 5000
pnpm run build # Production build
pnpm run start # Production server on port 5000
```

The workflow "Start application" runs `pnpm run dev` automatically.

## Environment Variables

See `.env.example` for all required variables:

- `NEXT_PUBLIC_SITE_URL` - Your site's public URL
- `NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS` - Set to 0 to disable Vercel Analytics
- `LASTFM_API_KEY` - Last.fm API key
- `LASTFM_USERNAME` - Last.fm username
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (for Siftli)
- `TELEGRAM_CHAT_ID` - Telegram chat ID (for Siftli)
- `DISCORD_WEBHOOK_URL` - Discord webhook URL (for Siftli)
- `DISCORD_MAX_FILE_SIZE_MB` - Optional Discord upload size limit

## Replit Migration Notes

- Dev/start scripts updated to bind on `0.0.0.0:5000` (required by Replit)
- `output: 'standalone'` removed from `next.config.ts` (incompatible with Replit's file system)
- Uses pnpm as the package manager
