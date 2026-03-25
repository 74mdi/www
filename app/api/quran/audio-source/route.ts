import { NextResponse } from 'next/server'

import { getReciterById } from '@/app/quran/lib/reciters'

async function canReach(url: string) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    })

    if (response.ok || response.status === 405) {
      return true
    }

    return response.status === 401 || response.status === 403
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reciterId = searchParams.get('reciter') ?? ''
  const surahNumber = Number(searchParams.get('surah'))

  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: 'Invalid surah number.' }, { status: 400 })
  }

  const reciter = getReciterById(reciterId)
  const primaryUrl = reciter.primary(surahNumber)

  if (!reciter.fallback) {
    return NextResponse.json({ url: primaryUrl })
  }

  const primaryReachable = await canReach(primaryUrl)
  if (primaryReachable) {
    return NextResponse.json({ url: primaryUrl })
  }

  const fallbackUrl = reciter.fallback(surahNumber)
  const fallbackReachable = await canReach(fallbackUrl)
  if (fallbackReachable) {
    return NextResponse.json({ url: fallbackUrl })
  }

  // `server8/husary` can intermittently 404 for some regions; keep a second
  // known-good mirror for resilience while preserving the requested fallback first.
  if (reciter.id === 'husary') {
    const emergencyUrl = `https://server13.mp3quran.net/husr/${String(surahNumber).padStart(3, '0')}.mp3`
    const emergencyReachable = await canReach(emergencyUrl)
    if (emergencyReachable) {
      return NextResponse.json({ url: emergencyUrl })
    }
  }

  return NextResponse.json({ url: primaryUrl })
}
