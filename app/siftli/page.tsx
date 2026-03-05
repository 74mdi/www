import type { Metadata } from 'next'

import SiftliClient from './siftli-client'

export const metadata: Metadata = {
  title: 'SIFTLI',
  description: 'Send one message to Telegram and Discord with optional file uploads.',
}

export default function Page() {
  return <SiftliClient />
}
