import type { NextRequest } from 'next/server'
import { documents } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = documents.get(id)
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(doc)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = documents.get(id)
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updated = { ...doc, ...body, id, updatedAt: new Date().toISOString() }
  documents.set(id, updated)
  return Response.json(updated)
}
