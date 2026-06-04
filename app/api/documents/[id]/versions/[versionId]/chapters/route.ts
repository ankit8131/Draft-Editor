import type { NextRequest } from 'next/server'
import { versions, chapters } from '@/lib/db'
import type { ChapterRecord } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { versionId } = await params
  if (!versions.has(versionId)) return Response.json({ error: 'Not found' }, { status: 404 })

  const versionChapters = [...chapters.values()]
    .filter((c) => c.versionId === versionId)
    .sort((a, b) => a.order - b.order)
    .map(({ content: _content, ...meta }) => meta)

  return Response.json(versionChapters)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { versionId } = await params
  if (!versions.has(versionId)) return Response.json({ error: 'Not found' }, { status: 404 })

  const { order, title } = await req.json() as { order: number; title: string }
  const chapterId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const chapter: ChapterRecord = { id: chapterId, versionId, order, title, content: null }
  chapters.set(chapterId, chapter)

  return Response.json(chapter, { status: 201 })
}
