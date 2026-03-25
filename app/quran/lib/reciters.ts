import type { Reciter, ReciterDefinition } from '@/app/quran/types/quran'

export function formatSurahNumber(surahNumber: number) {
  return String(surahNumber).padStart(3, '0')
}

export const RECITER_DEFINITIONS: ReciterDefinition[] = [
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    nameAr: 'محمود خليل الحصري',
    primaryBaseUrl: 'https://archive.org/download/MahmoudKhalilAl-husary/',
    fallbackBaseUrl: 'https://server8.mp3quran.net/husary/',
    default: true,
  },
  {
    id: 'alafasy',
    name: 'Mishary Rashid Alafasy',
    nameAr: 'مشاري راشد العفاسي',
    primaryBaseUrl: 'https://server8.mp3quran.net/afs/',
  },
  {
    id: 'sudais',
    name: 'Abdul Rahman Al-Sudais',
    nameAr: 'عبد الرحمن السديس',
    primaryBaseUrl: 'https://server11.mp3quran.net/sds/',
  },
  {
    id: 'ghamdi',
    name: 'Saad Al-Ghamdi',
    nameAr: 'سعد الغامدي',
    primaryBaseUrl: 'https://server7.mp3quran.net/s_gmd/',
  },
  {
    id: 'minshawi',
    name: 'Mohamed Siddiq Al-Minshawi',
    nameAr: 'محمد صديق المنشاوي',
    primaryBaseUrl: 'https://server10.mp3quran.net/minsh/',
  },
]

export const RECITERS: Reciter[] = RECITER_DEFINITIONS.map((reciter) => ({
  ...reciter,
  primary: (surahNumber: number) =>
    `${reciter.primaryBaseUrl}${formatSurahNumber(surahNumber)}.mp3`,
  fallback: reciter.fallbackBaseUrl
    ? (surahNumber: number) =>
        `${reciter.fallbackBaseUrl}${formatSurahNumber(surahNumber)}.mp3`
    : undefined,
}))

export function getDefaultReciter() {
  return RECITERS.find((reciter) => reciter.default) ?? RECITERS[0]
}

export function getReciterById(reciterId: string) {
  return RECITERS.find((reciter) => reciter.id === reciterId) ?? getDefaultReciter()
}
