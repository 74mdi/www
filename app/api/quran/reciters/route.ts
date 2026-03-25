import { NextResponse } from 'next/server'

import { RECITER_DEFINITIONS } from '@/app/quran/lib/reciters'

export async function GET() {
  return NextResponse.json(RECITER_DEFINITIONS, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
