import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const SOURCE_BASE = 'https://raw.githubusercontent.com/semarketir/quranjson/master/source'
const CHAPTER_COUNT = 114

async function fetchJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function stripBom(value) {
  return value.replace(/\uFEFF/g, '').trim()
}

async function buildQuranData() {
  const metadata = await fetchJson(`${SOURCE_BASE}/surah.json`)
  const metadataById = new Map(
    metadata.map((entry) => [Number(entry.index), entry]),
  )

  const chapters = []

  for (let chapterId = 1; chapterId <= CHAPTER_COUNT; chapterId += 1) {
    const [surah, translation] = await Promise.all([
      fetchJson(`${SOURCE_BASE}/surah/surah_${chapterId}.json`),
      fetchJson(
        `${SOURCE_BASE}/translation/en/en_translation_${chapterId}.json`,
      ),
    ])

    const chapterMeta = metadataById.get(chapterId)
    const verseCount = Number(surah.count ?? chapterMeta?.count ?? 0)

    const verses = Array.from({ length: verseCount }, (_unused, index) => {
      const verseId = index + 1
      const key = `verse_${verseId}`

      return {
        id: verseId,
        ar: stripBom(String(surah.verse?.[key] ?? '')),
        en: stripBom(String(translation.verse?.[key] ?? '')),
      }
    })

    chapters.push({
      id: chapterId,
      name:
        String(chapterMeta?.title ?? '').trim() ||
        String(translation.name ?? surah.name ?? `Surah ${chapterId}`).trim(),
      nameAr: String(chapterMeta?.titleAr ?? '').trim(),
      verses,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    source: 'https://github.com/semarketir/quranjson',
    chapters,
  }
}

const outputDir = resolve(process.cwd(), 'public', 'quran')
const outputFile = resolve(outputDir, 'quran-data.json')

const data = await buildQuranData()
await mkdir(outputDir, { recursive: true })
await writeFile(outputFile, `${JSON.stringify(data)}\n`, 'utf8')

console.log(`Wrote ${outputFile}`)
