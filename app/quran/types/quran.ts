export type RevelationPlace = 'Meccan' | 'Medinan'

export interface Surah {
  id: number
  nameArabic: string
  nameSimple: string
  translatedName: string
  versesCount: number
  revelationPlace: RevelationPlace
}

export interface Verse {
  id: number
  verseKey: string
  verseNumber: number
  textArabic: string
  translation: string
}

export interface ReciterDefinition {
  id: string
  name: string
  nameAr: string
  primaryBaseUrl: string
  fallbackBaseUrl?: string
  default?: boolean
}

export interface Reciter extends ReciterDefinition {
  primary: (surahNumber: number) => string
  fallback?: (surahNumber: number) => string
}

export interface PlayerState {
  currentSurah: Surah | null
  isPlaying: boolean
  currentReciter: Reciter
  isLooping: boolean
  autoplayNext: boolean
  progress: number
  duration: number
  currentTime: number
}
