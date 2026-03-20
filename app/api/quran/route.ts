import { NextResponse } from 'next/server'
import { RECITERS } from '@/app/quran/reciters'
import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get('chapter')

  try {
    const filePath = path.join(process.cwd(), 'public', 'quran', 'quran-data.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const quranData = JSON.parse(fileContent)

    if (chapterId) {
      const id = parseInt(chapterId)
      if (isNaN(id) || id < 1 || id > 114) {
        return NextResponse.json({ error: 'Invalid chapter ID. Must be between 1 and 114.' }, { status: 400 })
      }

      const chapter = quranData.chapters.find((c: any) => c.id === id)
      if (chapter) {
        return NextResponse.json({
          chapter,
          reciters: RECITERS.map((r) => ({
            id: r.id,
            label: r.label,
            audioUrl: `${r.baseUrl}/${r.padding ? String(id).padStart(r.padding, '0') : id}.mp3`,
          })),
        })
      }
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // Return summary of all chapters and list of reciters
    return NextResponse.json({
      reciters: RECITERS,
      chapters: quranData.chapters.map((c: any) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
        verseCount: c.verses.length,
      })),
      source: quranData.source,
      generatedAt: quranData.generatedAt,
    })
  } catch (error) {
    console.error('Quran API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch Quran data' }, { status: 500 })
  }
}
