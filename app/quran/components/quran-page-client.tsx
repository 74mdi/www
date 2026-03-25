'use client'

import { useEffect, useMemo, useState } from 'react'

import BottomPlayer from '@/app/quran/components/BottomPlayer'
import ReciterSelector from '@/app/quran/components/ReciterSelector'
import SearchBar from '@/app/quran/components/SearchBar'
import SurahList from '@/app/quran/components/SurahList'
import VerseView from '@/app/quran/components/VerseView'
import { PlayerProvider, useAudioPlayer } from '@/app/quran/hooks/useAudioPlayer'
import { useSurahs } from '@/app/quran/hooks/useSurahs'
import { normalizeSearchValue } from '@/app/quran/lib/quranApi'
import type { Surah } from '@/app/quran/types/quran'

function QuranPageContent({
  arabicFontClassName,
  surahs,
  isLoading,
  error,
}: {
  arabicFontClassName: string
  surahs: Surah[]
  isLoading: boolean
  error: string | null
}) {
  const {
    currentReciter,
    currentSurah,
    isPlaying,
    playSurah,
    reciters,
    setCurrentReciterById,
    setPlaybackQueue,
  } = useAudioPlayer()

  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [rawSearch, setRawSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(rawSearch.trim())
    }, 150)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [rawSearch])

  const filteredSurahs = useMemo(() => {
    if (!searchQuery) {
      return surahs
    }

    const normalizedQuery = normalizeSearchValue(searchQuery)

    return surahs.filter((surah) =>
      [
        normalizeSearchValue(surah.nameArabic),
        normalizeSearchValue(surah.nameSimple),
        normalizeSearchValue(surah.translatedName),
        String(surah.id),
      ].some((value) => value.includes(normalizedQuery)),
    )
  }, [searchQuery, surahs])

  useEffect(() => {
    setPlaybackQueue(filteredSurahs.length > 0 ? filteredSurahs : surahs)
  }, [filteredSurahs, setPlaybackQueue, surahs])

  return (
    <div className='pb-32'>
      <header className='space-y-4'>
        <div className='space-y-2'>
          <div className='text-[11px] uppercase tracking-[0.18em] text-rurikon-300'>
            Quran listening
          </div>
          <div className='flex flex-col gap-2'>
            <h1
              className='m-0 text-[2rem] leading-[1.05] text-rurikon-700 sm:text-[2.35rem]'
              dir='rtl'
              lang='ar'
            >
              <span className={arabicFontClassName}>القرآن الكريم</span>
            </h1>
            <p className='max-w-xl text-sm leading-6 text-rurikon-400 sm:text-[15px] sm:leading-7'>
              The Holy Quran in a quieter, lighter reading experience with streaming reciters,
              instant search, and a persistent player that matches the rest of the site.
            </p>
          </div>
        </div>

        <div className='space-y-4 pt-2'>
          <SearchBar
            onChange={setRawSearch}
            onClear={() => {
              setRawSearch('')
              setSearchQuery('')
            }}
            value={rawSearch}
          />
          <ReciterSelector
            currentReciterId={currentReciter.id}
            onSelect={setCurrentReciterById}
            reciters={reciters}
          />
        </div>
      </header>

      <section className='mt-8 space-y-3'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-[11px] uppercase tracking-[0.16em] text-rurikon-300'>
            {isLoading ? 'Loading surahs' : `${filteredSurahs.length} surahs`}
          </p>
          {currentSurah ? (
            <p className='text-[12px] text-rurikon-300'>
              Now {isPlaying ? 'playing' : 'paused'}: {currentSurah.nameSimple}
            </p>
          ) : null}
        </div>

        <SurahList
          arabicFontClassName={arabicFontClassName}
          currentSurahId={currentSurah?.id ?? null}
          error={error}
          isLoading={isLoading}
          isPlaying={isPlaying}
          onOpenSurah={setSelectedSurah}
          onPlaySurah={playSurah}
          surahs={filteredSurahs}
        />
      </section>

      <VerseView
        arabicFontClassName={arabicFontClassName}
        onClose={() => setSelectedSurah(null)}
        surah={selectedSurah}
      />
      <BottomPlayer arabicFontClassName={arabicFontClassName} />
    </div>
  )
}

export default function QuranPageClient({ arabicFontClassName }: { arabicFontClassName: string }) {
  const { surahs, isLoading, error } = useSurahs()

  return (
    <PlayerProvider surahs={surahs}>
      <QuranPageContent
        arabicFontClassName={arabicFontClassName}
        error={error}
        isLoading={isLoading}
        surahs={surahs}
      />
    </PlayerProvider>
  )
}
