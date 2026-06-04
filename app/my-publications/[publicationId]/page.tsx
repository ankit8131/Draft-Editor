'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { db, type Publication, type PublicationChapter, type PublicationVersion } from '@/lib/dexie'

function lexicalToParas(content: string | null): string[] {
  if (!content) return []
  try {
    const state = JSON.parse(content)
    return (state.root?.children ?? []).map((node: { children?: { text?: string }[] }) =>
      (node.children ?? []).map((c) => c.text ?? '').join(''),
    )
  } catch {
    return []
  }
}

export default function PublicationDetailPage({
  params,
}: {
  params: Promise<{ publicationId: string }>
}) {
  const { publicationId } = use(params)
  const [pub, setPub] = useState<Publication | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeVersion, setActiveVersion] = useState<PublicationVersion | null>(null)
  const [activeChapter, setActiveChapter] = useState<PublicationChapter | null>(null)

  useEffect(() => {
    db.publications.get(publicationId).then((p) => {
      if (p) {
        setPub(p)
        const first = p.versions[0] ?? null
        setActiveVersion(first)
        setActiveChapter(first?.chapters[0] ?? null)
      }
      setLoading(false)
    })
  }, [publicationId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <span className="w-4 h-4 rounded-full border-2 border-zinc-200 border-t-zinc-600 animate-spin" />
      </div>
    )
  }

  if (!pub) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-sm text-zinc-400">Publication not found.</p>
      </div>
    )
  }

  const paragraphs = lexicalToParas(activeChapter?.content ?? null)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="h-14 bg-white border-b border-zinc-200 px-5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/my-publications"
            className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
            aria-label="Back to publications"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 1L3 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="w-px h-4 bg-zinc-200 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3.5 h-3.5 bg-zinc-900 rounded-sm shrink-0" />
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest shrink-0 hidden sm:block">
            Pocket FM Studio
            </span>
            <span className="text-zinc-200 shrink-0 hidden sm:block">/</span>
            <span className="text-sm text-zinc-700 font-medium truncate">
              {pub.title || 'Untitled Script'}
            </span>
          </div>
        </div>
        <span className="text-xs text-zinc-400 shrink-0">
          Published {new Date(pub.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Version sidebar */}
        <aside className="w-14 border-r border-zinc-100 flex flex-col items-center py-3 gap-1 overflow-y-auto shrink-0">
          {pub.versions.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setActiveVersion(v)
                setActiveChapter(v.chapters[0] ?? null)
              }}
              title={`Version ${v.versionNumber}`}
              className={`w-8 h-8 rounded-md text-[11px] font-mono transition-colors ${
                activeVersion?.id === v.id
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
              }`}
            >
              v{v.versionNumber}
            </button>
          ))}
        </aside>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chapter tabs */}
          <div className="flex items-center gap-1 px-8 sm:px-14 border-b border-zinc-100 overflow-x-auto shrink-0">
            {(activeVersion?.chapters ?? []).map((ch) => {
              const isActive = ch.id === activeChapter?.id
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch)}
                  className={`px-3 py-2 text-[13px] whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    isActive
                      ? 'border-zinc-900 text-zinc-900 font-medium'
                      : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {ch.title}
                </button>
              )
            })}
          </div>

          {/* Chapter content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[65ch] mx-auto px-8 py-12">
              {!activeChapter ? (
                <p className="text-sm text-zinc-400">No chapters in this version.</p>
              ) : paragraphs.length === 0 ? (
                <p className="text-sm text-zinc-300 italic">No content.</p>
              ) : (
                paragraphs.map((para, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-zinc-800 mb-4 whitespace-pre-wrap">
                    {para || ' '}
                  </p>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
