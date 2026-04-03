# 7amdi

- Next.js v16
- MDX Rust & Shiki inside React Server Components
- Tailwind CSS v4
- `<ViewTransition/>` from React Experimental

## SIFTLI Route

- App route: `/siftli`
- API route: `/api/siftli/send`
- Required env vars:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_CHAT_ID`
  - `DISCORD_WEBHOOK_URL`

## Last.fm Status

- API route: `/api/lastfm/latest`
- Required env vars:
  - `LASTFM_API_KEY`
- Optional env vars:
  - `LASTFM_USERNAME` (defaults to `khrya`)

Use `.env.example` as the template for local setup.

## Vercel Analytics (Optional)

- Set `NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=1` to render the analytics script.
- Keep it `0` (or unset) to disable analytics script injection.
