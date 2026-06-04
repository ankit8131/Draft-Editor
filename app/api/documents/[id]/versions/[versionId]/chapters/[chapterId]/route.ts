import type { NextRequest } from 'next/server'
import { chapters } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; chapterId: string }> }
) {
  const { chapterId } = await params
  const chapter = chapters.get(chapterId)
  if (!chapter) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(chapter)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; chapterId: string }> }
) {
  const { chapterId } = await params
  const chapter = chapters.get(chapterId)
  if (!chapter) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as { content?: string; title?: string }
  const updated = { ...chapter, ...body }
  chapters.set(chapterId, updated)
  return Response.json(updated)
}
