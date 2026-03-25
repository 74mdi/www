'use client'

import { useEffect, useState } from 'react'

import { fetchVersesBySurah } from '@/app/quran/lib/quranApi'
import { readStorageWithExpiry, writeStorageWithExpiry } from '@/app/quran/lib/storage'
import type { Verse } from '@/app/quran/types/quran'

const VERSES_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

type UseVersesState = {
  verses: Verse[]
  isLoading: boolean
  error: string | null
}

export function useVerses(surahNumber: number | null): UseVersesState {
  const [state, setState] = useState<UseVersesState>({
    verses: [],
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    if (!surahNumber) {
      setState({ verses: [], isLoading: false, error: null })
      return
    }

    const chapterNumber = surahNumber
    let isCancelled = false
    const cacheKey = `quran:verses:${chapterNumber}:v2`
    const cached = readStorageWithExpiry<Verse[]>(cacheKey)

    if (cached && cached.length > 0) {
      setState({ verses: cached, isLoading: false, error: null })
      return
    }

    setState((current) => ({
      verses: current.verses,
      isLoading: true,
      error: null,
    }))

    async function load() {
      try {
        const verses = await fetchVersesBySurah(chapterNumber)
        if (isCancelled) {
          return
        }

        writeStorageWithExpiry(cacheKey, verses, VERSES_CACHE_TTL_MS)
        setState({ verses, isLoading: false, error: null })
      } catch (error) {
        if (isCancelled) {
          return
        }

        setState({
          verses: [],
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load this surah right now.',
        })
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [surahNumber])

  return state
}
