'use client'

import { useEffect, useState } from 'react'

import { fetchSurahs } from '@/app/quran/lib/quranApi'
import { readStorageWithExpiry, writeStorageWithExpiry } from '@/app/quran/lib/storage'
import type { Surah } from '@/app/quran/types/quran'

const SURAHS_CACHE_KEY = 'quran:chapters:v2'
const SURAHS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

type UseSurahsState = {
  surahs: Surah[]
  isLoading: boolean
  error: string | null
}

export function useSurahs(): UseSurahsState {
  const [state, setState] = useState<UseSurahsState>({
    surahs: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let isCancelled = false
    const cached = readStorageWithExpiry<Surah[]>(SURAHS_CACHE_KEY)

    if (cached && cached.length > 0) {
      setState({ surahs: cached, isLoading: false, error: null })
      return
    }

    async function load() {
      try {
        const surahs = await fetchSurahs()
        if (isCancelled) {
          return
        }

        writeStorageWithExpiry(SURAHS_CACHE_KEY, surahs, SURAHS_CACHE_TTL_MS)
        setState({ surahs, isLoading: false, error: null })
      } catch (error) {
        if (isCancelled) {
          return
        }

        setState({
          surahs: [],
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load the surah list right now.',
        })
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [])

  return state
}
