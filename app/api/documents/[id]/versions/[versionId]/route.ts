import type { NextRequest } from 'next/server'
import { versions } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { versionId } = await params
  const version = versions.get(versionId)
  if (!version) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(version)
}
