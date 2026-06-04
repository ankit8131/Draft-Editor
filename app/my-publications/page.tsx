'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { db, type Publication } from '@/lib/dexie'

export default function MyPublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.publications.orderBy('publishedAt').reverse().toArray().then((pubs) => {
      setPublications(pubs)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="px-8 sm:px-12 h-16 flex items-center justify-between border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Back to home"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 1L3 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="w-px h-4 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-zinc-900 rounded-sm" />
            <span className="font-semibold text-sm tracking-tight text-zinc-900">Pocket FM Studio</span>
          </div>
          <span className="text-zinc-300">/</span>
          <span className="text-sm text-zinc-500">My Publications</span>
        </div>
      </nav>

      <main id="main-content" className="flex-1 px-8 sm:px-12 py-12 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8">My Publications</h1>

        {loading ? (
          <div role="status" className="flex items-center gap-3 text-zinc-400">
            <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-zinc-200 border-t-zinc-500 motion-safe:animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : publications.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-zinc-400 text-sm">No publications yet.</p>
            <p className="text-zinc-300 text-xs mt-2">Hit Publish inside the editor to save a snapshot here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {publications.map((pub) => (
              <Link
                key={pub.id}
                href={`/my-publications/${pub.id}`}
                className="flex items-center justify-between py-4 group hover:bg-zinc-50 -mx-3 px-3 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
                    {pub.title || 'Untitled Script'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {pub.versions.length} version{pub.versions.length !== 1 ? 's' : ''} &middot; Published{' '}
                    {new Date(pub.publishedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0">
                  <path d="M5 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
