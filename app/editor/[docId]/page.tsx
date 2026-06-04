'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  useGetDocumentQuery,
  useGetVersionsQuery,
  useCreateVersionMutation,
  useGetChaptersQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useUpdateDocumentMutation,
} from '@/store/documentsApi'
import Editor from '@/components/Editor'
import SaveStatus from '@/components/SaveStatus'
import VersionSidebar from '@/components/VersionSidebar'
import ChapterTabs from '@/components/ChapterTabs'
import { debounce } from '@/lib/autosave'
import { db } from '@/lib/dexie'
import type { CursorData } from '@/lib/dexie'

export default function EditorPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const versionParam = searchParams.get('version')
  const currentVersionNumber = versionParam ? parseInt(versionParam, 10) : null

  const { data: serverDoc } = useGetDocumentQuery(docId)
  const { data: versionsList, isSuccess: versionsLoaded } = useGetVersionsQuery(docId)
  const [createVersion, { isLoading: isCreating }] = useCreateVersionMutation()

  const currentVersion = versionsList?.find((v) => v.versionNumber === currentVersionNumber)
  const currentVersionId = currentVersion?.id ?? null

  const { data: chaptersList } = useGetChaptersQuery(
    { docId, versionId: currentVersionId! },
    { skip: !currentVersionId },
  )

  const [createChapter, { isLoading: isAddingChapter }] = useCreateChapterMutation()
  const [updateChapter, { isLoading: isSaving, isError }] = useUpdateChapterMutation()
  const [updateDocument] = useUpdateDocumentMutation()

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  // activeChapterId = which chapter the user has selected
  // loadedChapterId = which chapter's content is actually ready in state
  // Only render the Editor when these match — prevents stale content from leaking in
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [loadedChapterId, setLoadedChapterId] = useState<string | null>(null)
  const [activeChapterContent, setActiveChapterContent] = useState<string | null>(null)
  const [activeChapterCursor, setActiveChapterCursor] = useState<CursorData | null>(null)

  const isOnlineRef = useRef(true)
  const [isOnline, setIsOnline] = useState(true)
  const currentChapterIdRef = useRef<string | null>(null)
  const currentVersionIdRef = useRef<string | null>(null)

  useEffect(() => {
    isOnlineRef.current = navigator.onLine
    setIsOnline(navigator.onLine)
    const up = () => { isOnlineRef.current = true; setIsOnline(true) }
    const down = () => { isOnlineRef.current = false; setIsOnline(false) }
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  // Bootstrap: create v1 on first load
  const initDone = useRef(false)
  useEffect(() => {
    if (!versionsLoaded || initDone.current) return
    initDone.current = true
    if (!versionsList || versionsList.length === 0) {
      createVersion({ docId, versionNumber: 1 })
        .unwrap()
        .then(() => router.replace(`/editor/${docId}?version=1`))
        .catch(() => {})
    } else if (!currentVersionNumber) {
      router.replace(`/editor/${docId}?version=1`)
    }
  }, [versionsLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep version id ref in sync
  useEffect(() => {
    currentVersionIdRef.current = currentVersionId
  }, [currentVersionId])

  // Reset on version change
  useEffect(() => {
    setActiveChapterId(null)
    setLoadedChapterId(null)
    setActiveChapterCursor(null)
  }, [currentVersionNumber])

  // Auto-select first chapter when list loads
  useEffect(() => {
    if (!chaptersList || chaptersList.length === 0) return
    setActiveChapterId((prev) => prev ?? chaptersList[0].id)
  }, [chaptersList])

  // Load chapter content: IDB first (fastest, survives refresh), server as fallback.
  useEffect(() => {
    if (!activeChapterId || !currentVersionId) return

    let cancelled = false

    async function load() {
      const local = await db.chapters.get(activeChapterId!)
      if (cancelled) return

      if (local?.content) {
        currentChapterIdRef.current = activeChapterId!
        setActiveChapterContent(local.content)
        setActiveChapterCursor(local.cursor ?? null)
        setLoadedChapterId(activeChapterId!)
        return
      }

      // Nothing local yet — fall back to server
      try {
        const r = await fetch(
          `/api/documents/${docId}/versions/${currentVersionId!}/chapters/${activeChapterId!}`,
        )
        const data = await r.json()
        if (cancelled) return
        currentChapterIdRef.current = activeChapterId!
        setActiveChapterContent(data.content ?? null)
        setActiveChapterCursor(null)
        setLoadedChapterId(activeChapterId!)
      } catch {
        if (cancelled) return
        currentChapterIdRef.current = activeChapterId!
        setActiveChapterContent(null)
        setActiveChapterCursor(null)
        setLoadedChapterId(activeChapterId!)
      }
    }

    load()
    return () => { cancelled = true }
  }, [activeChapterId, currentVersionId, docId])

  // Debounced save — chapterId/versionId captured at call time
  const saveDebounce = useCallback(
    debounce((chapterId: string, versionId: string, content: string) => {
      if (!isOnlineRef.current) return
      updateChapter({ docId, versionId, chapterId, content }).unwrap().catch(() => {})
    }, 1500),
    [docId, updateChapter],
  )

  const handleContentChange = useCallback(
    (content: string) => {
      const chapterId = currentChapterIdRef.current
      const versionId = currentVersionIdRef.current
      if (!chapterId || !versionId) return
      saveDebounce(chapterId, versionId, content)
    },
    [saveDebounce],
  )

  const handleCreateVersion = useCallback(async () => {
    if (!versionsList || isCreating) return
    const nextNumber = versionsList.length + 1
    const sourceVersionId = currentVersionIdRef.current ?? undefined
    await createVersion({ docId, versionNumber: nextNumber, sourceVersionId }).unwrap()
    router.push(`/editor/${docId}?version=${nextNumber}`)
  }, [docId, versionsList, createVersion, router, isCreating])

  const handleChapterSelect = useCallback((chapterId: string) => {
    if (chapterId === currentChapterIdRef.current) return
    saveDebounce.flush()
    setActiveChapterId(chapterId)
    // loadedChapterId stays old — mismatch shows spinner until fetch resolves
  }, [saveDebounce])

  const handleAddChapter = useCallback(async () => {
    if (!currentVersionId || !chaptersList) return
    saveDebounce.flush()
    const order = chaptersList.length + 1
    const result = await createChapter({
      docId,
      versionId: currentVersionId,
      order,
      title: `Chapter ${order}`,
    }).unwrap()
    setActiveChapterId(result.id)
    // fetch effect fires automatically, loadedChapterId mismatch shows spinner
  }, [docId, currentVersionId, chaptersList, createChapter, saveDebounce])

  const [isPublishing, setIsPublishing] = useState(false)
  const [publishFeedback, setPublishFeedback] = useState<'success' | 'error' | null>(null)

  const handlePublish = useCallback(async () => {
    if (!serverDoc || !versionsList || isPublishing) return
    setIsPublishing(true)
    try {
      const versions = await Promise.all(
        versionsList.map(async (v) => {
          const chapRes = await fetch(`/api/documents/${docId}/versions/${v.id}/chapters`)
          const chapters = await chapRes.json()
          const chaptersWithContent = await Promise.all(
            chapters.map(async (ch: { id: string; title: string }) => {
              const r = await fetch(`/api/documents/${docId}/versions/${v.id}/chapters/${ch.id}`)
              const data = await r.json()
              return { id: ch.id, title: ch.title, content: data.content ?? null }
            }),
          )
          return { id: v.id, versionNumber: v.versionNumber, savedAt: v.savedAt, chapters: chaptersWithContent }
        }),
      )
      await db.publications.put({
        id: crypto.randomUUID(),
        docId,
        title: serverDoc.title,
        publishedAt: Date.now(),
        versions,
      })
      setPublishFeedback('success')
    } catch {
      setPublishFeedback('error')
    } finally {
      setIsPublishing(false)
      setTimeout(() => setPublishFeedback(null), 2500)
    }
  }, [docId, serverDoc, versionsList, isPublishing])

  const chapterReady = activeChapterId !== null && loadedChapterId === activeChapterId

  if (!activeChapterId) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full border-2 border-zinc-200 border-t-zinc-600 animate-spin" />
          <span className="text-sm text-zinc-400">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="h-14 bg-white border-b border-zinc-200 px-5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
            aria-label="Back to home"
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
            {editingTitle ? (
                <input
                  autoFocus
                  className="text-sm text-zinc-700 font-medium bg-transparent border-b border-zinc-400 outline-none truncate min-w-0 max-w-[200px]"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => {
                    setEditingTitle(false)
                    const trimmed = titleDraft.trim()
                    if (trimmed && trimmed !== serverDoc?.title) {
                      updateDocument({ id: docId, title: trimmed })
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                />
              ) : (
                <span
                  className="text-sm text-zinc-700 font-medium truncate cursor-pointer hover:text-zinc-900"
                  onClick={() => {
                    setTitleDraft(serverDoc?.title ?? 'Untitled Script')
                    setEditingTitle(true)
                  }}
                >
                  {serverDoc?.title ?? 'Untitled Script'}
                </span>
              )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {currentVersionNumber && (
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 rounded-md">
              <span className="text-[11px] font-mono text-zinc-500">v{currentVersionNumber}</span>
            </span>
          )}
          <SaveStatus isSaving={isSaving} isError={isError} isOnline={isOnline} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <VersionSidebar
          docId={docId}
          versions={versionsList ?? []}
          currentVersionNumber={currentVersionNumber}
          onCreateVersion={handleCreateVersion}
          isCreating={isCreating}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <ChapterTabs
            chapters={chaptersList ?? []}
            activeChapterId={activeChapterId}
            onChapterSelect={handleChapterSelect}
            onAddChapter={handleAddChapter}
            isAdding={isAddingChapter}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            publishFeedback={publishFeedback}
          />

          <main className="flex-1 overflow-y-auto bg-white">
            {!chapterReady ? (
              <div className="flex items-center justify-center h-32">
                <span className="w-4 h-4 rounded-full border-2 border-zinc-200 border-t-zinc-600 animate-spin" />
              </div>
            ) : (
              <Editor
                key={activeChapterId}
                chapterId={activeChapterId}
                initialContent={activeChapterContent}
                initialCursor={activeChapterCursor}
                onContentChange={handleContentChange}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
