import type { Metadata } from 'next'

import SiftliClient from './siftli-client'

export const metadata: Metadata = {
  title: 'qaiik',
  description: 'qaiik',
}

export default function Page() {
  return <SiftliClient />
}
