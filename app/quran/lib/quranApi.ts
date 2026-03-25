import type { Surah, Verse } from '@/app/quran/types/quran'

const QURAN_API_BASE_URL = 'https://api.quran.com/api/v4'
const PRIMARY_TRANSLATION_RESOURCE_ID = 131
const FALLBACK_TRANSLATION_RESOURCE_ID = 20

const ARABIC_DIACRITICS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g

type ChaptersResponse = {
  chapters: Array<{
    id: number
    revelation_place: 'makkah' | 'madinah'
    name_simple: string
    name_arabic: string
    verses_count: number
    translated_name: {
      name: string
    }
  }>
}

type ArabicVersesResponse = {
  verses: Array<{
    id: number
    verse_key: string
    verse_number: number
    text_uthmani: string
  }>
}

type TranslationResponse = {
  translations: Array<{
    text: string
  }>
}

function sanitizeTranslationText(value: string) {
  return value
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Quran API request failed with ${response.status}`)
  }

  return (await response.json()) as T
}

async function fetchTranslationByResource(
  surahNumber: number,
  resourceId: number,
) {
  return fetchJson<TranslationResponse>(
    `${QURAN_API_BASE_URL}/quran/translations/${resourceId}?chapter_number=${surahNumber}`,
  )
}

export function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(ARABIC_DIACRITICS_REGEX, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchSurahs() {
  const data = await fetchJson<ChaptersResponse>(`${QURAN_API_BASE_URL}/chapters`)

  return data.chapters.map<Surah>((chapter) => ({
    id: chapter.id,
    nameArabic: chapter.name_arabic,
    nameSimple: chapter.name_simple,
    translatedName: chapter.translated_name.name,
    versesCount: chapter.verses_count,
    revelationPlace: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
  }))
}

export async function fetchVersesBySurah(surahNumber: number) {
  const [arabic, primaryTranslation] = await Promise.all([
    fetchJson<ArabicVersesResponse>(
      `${QURAN_API_BASE_URL}/verses/by_chapter/${surahNumber}?language=en&fields=text_uthmani&per_page=300`,
    ),
    fetchTranslationByResource(surahNumber, PRIMARY_TRANSLATION_RESOURCE_ID),
  ])

  const translation =
    primaryTranslation.translations.length > 0
      ? primaryTranslation
      : await fetchTranslationByResource(
          surahNumber,
          FALLBACK_TRANSLATION_RESOURCE_ID,
        )

  return arabic.verses.map<Verse>((verse, index) => ({
    id: verse.id,
    verseKey: verse.verse_key,
    verseNumber: verse.verse_number,
    textArabic: verse.text_uthmani,
    translation: sanitizeTranslationText(translation.translations[index]?.text ?? ''),
  }))
}
