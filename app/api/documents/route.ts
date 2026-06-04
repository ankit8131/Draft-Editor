import { documents } from '@/lib/db'
import type { DocumentRecord } from '@/lib/db'

export async function GET() {
  return Response.json(Array.from(documents.values()))
}

export async function POST() {
  const id = Date.now().toString()
  const doc: DocumentRecord = {
    id,
    title: 'Untitled Script',
    updatedAt: new Date().toISOString(),
  }
  documents.set(id, doc)
  return Response.json(doc, { status: 201 })
}
