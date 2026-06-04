'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useGetDocumentQuery, useSaveDocumentMutation } from '@/store/documentsApi'
import Editor from '@/components/Editor'
import SaveStatus from '@/components/SaveStatus'
import { debounce } from '@/lib/autosave'
import { db } from '@/lib/dexie'
import type { CursorData } from '@/lib/dexie'

export default function EditorPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = use(params)

  const { data: serverDoc, isSuccess: serverLoaded } = useGetDocumentQuery(docId)
  const [saveDocument, { isLoading: isSaving, isError }] = useSaveDocumentMutation()

  // undefined = still resolving, null = empty doc, string = content
  const [initialContent, setInitialContent] = useState<string | null | undefined>(undefined)
  const [initialCursor, setInitialCursor] = useState<CursorData | null>(null)
  const [wasRestored, setWasRestored] = useState(false)

  // isOnlineRef: used inside debounced callback (no stale closure issues)
  // isOnline state: drives SaveStatus re-render
  const isOnlineRef = useRef(true)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Sync with actual browser state on mount
    isOnlineRef.current = navigator.onLine
    setIsOnline(navigator.onLine)

    const handleOnline = () => { isOnlineRef.current = true; setIsOnline(true) }
    const handleOffline = () => { isOnlineRef.current = false; setIsOnline(false) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Recovery: once server data lands, read IndexedDB and pick the newer source.
  // Guard with a ref so multiple serverDoc updates don't re-trigger recovery.
  const recoveryDone = useRef(false)
  useEffect(() => {
    if (!serverLoaded || recoveryDone.current) return
    recoveryDone.current = true

    db.docs.get(docId).then((localDoc) => {
      if (!localDoc) {
        // No local data at all — use server
        setInitialContent(serverDoc?.content ?? null)
        return
      }

      // Unsynced local changes always win: they contain edits the server never received
      // (typed while offline, or refreshed before the 500ms debounce fired)
      if (localDoc.syncedAt === null) {
        setInitialContent(localDoc.content)
        setInitialCursor(localDoc.cursor)
        setWasRestored(true)
        return
      }

      // Both sides are synced — prefer whichever has the later timestamp.
      // Handles multi-device: if another session saved to the server after this
      // local copy was last synced, the server version wins.
      const serverTime = serverDoc?.updatedAt
        ? new Date(serverDoc.updatedAt).getTime()
        : 0

      if (localDoc.savedAt > serverTime) {
        setInitialContent(localDoc.content)
        setInitialCursor(localDoc.cursor)
        setWasRestored(true)
      } else {
        setInitialContent(serverDoc?.content ?? null)
      }
    })
  }, [serverLoaded, docId, serverDoc])

  // When back online, flush any pending (unsynced) local writes to the server
  useEffect(() => {
    if (!isOnline) return
    db.docs.get(docId).then(async (localDoc) => {
      if (!localDoc || localDoc.syncedAt !== null) return
      try {
        await saveDocument({ id: docId, content: localDoc.content }).unwrap()
        await db.docs.update(docId, { syncedAt: Date.now() })
      } catch {
        // Will retry on next online event
      }
    })
  }, [isOnline, docId, saveDocument])

  // Debounced server sync. Uses isOnlineRef so the debounce isn't recreated on
  // every online/offline toggle — the ref always has the current value.
  const handleContentChange = useCallback(
    debounce((content: string) => {
      if (!isOnlineRef.current) return // skip — PersistencePlugin already wrote to IndexedDB
      saveDocument({ id: docId, content })
        .unwrap()
        .then(() => db.docs.update(docId, { syncedAt: Date.now() }))
        .catch(() => {}) // IndexedDB copy is the safety net
    }, 500),
    [docId, saveDocument],
  )

  if (initialContent === undefined) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {serverDoc?.title ?? 'Untitled'}
        </span>
        <div className="flex items-center gap-3">
          {wasRestored && (
            <span className="text-xs text-blue-500">Restored from local storage</span>
          )}
          <SaveStatus isSaving={isSaving} isError={isError} isOnline={isOnline} />
        </div>
      </header>
      <Editor
        docId={docId}
        initialContent={initialContent}
        initialCursor={initialCursor}
        onContentChange={handleContentChange}
      />
    </div>
  )
}
