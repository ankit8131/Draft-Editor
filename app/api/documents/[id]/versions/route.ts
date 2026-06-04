import type { NextRequest } from 'next/server'
import { documents, versions, chapters } from '@/lib/db'
import type { VersionRecord, ChapterRecord } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const docVersions = [...versions.values()]
    .filter((v) => v.docId === id)
    .sort((a, b) => a.versionNumber - b.versionNumber)
  return Response.json(docVersions)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!documents.has(id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { versionNumber, sourceVersionId } = body as {
    versionNumber: number
    sourceVersionId?: string
  }

  const existing = [...versions.values()].find(
    (v) => v.docId === id && v.versionNumber === versionNumber,
  )
  if (existing) return Response.json(existing)

  const versionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const version: VersionRecord = {
    id: versionId,
    docId: id,
    versionNumber,
    savedAt: new Date().toISOString(),
  }
  versions.set(versionId, version)

  if (sourceVersionId) {
    const sourceChapters = [...chapters.values()]
      .filter((c) => c.versionId === sourceVersionId)
      .sort((a, b) => a.order - b.order)
    sourceChapters.forEach((ch, i) => {
      const newId = `${Date.now() + i}-${Math.random().toString(36).slice(2)}`
      const newChapter: ChapterRecord = { ...ch, id: newId, versionId }
      chapters.set(newId, newChapter)
    })
  } else {
    const chapterId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const chapter: ChapterRecord = {
      id: chapterId,
      versionId,
      order: 1,
      title: 'Chapter 1',
      content: null,
    }
    chapters.set(chapterId, chapter)
  }

  return Response.json(version, { status: 201 })
}
