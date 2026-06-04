'use client'

import { memo, useCallback, useEffect, useRef } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createRangeSelection,
  $getSelection,
  $isRangeSelection,
  $setSelection,
} from 'lexical'
import type { EditorState } from 'lexical'
import { db } from '@/lib/dexie'
import type { CursorData } from '@/lib/dexie'
import { debounce } from '@/lib/autosave'

// Saves content + cursor to IndexedDB on every content change.
// Runs inside LexicalComposer to access the editor instance directly.
function PersistencePlugin({ docId }: { docId: string }) {
  const [editor] = useLexicalComposerContext()
  // Cursor ref is always updated (no re-render); included in each IndexedDB write
  const cursorRef = useRef<CursorData | null>(null)

  useEffect(() => {
    const saveToIDB = debounce((content: string) => {
      db.docs.put({
        id: docId,
        content,
        cursor: cursorRef.current,
        savedAt: Date.now(),
        syncedAt: null, // mark unsynced — EditorPage updates this after server save
      })
    }, 300)

    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      editorState.read(() => {
        // Track cursor on every update (content change or cursor move)
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          cursorRef.current = {
            anchorKey: sel.anchor.key,
            anchorOffset: sel.anchor.offset,
            anchorType: sel.anchor.type as 'text' | 'element',
            focusKey: sel.focus.key,
            focusOffset: sel.focus.offset,
            focusType: sel.focus.type as 'text' | 'element',
          }
        }
        // Only write to IndexedDB when content changed (not on cursor-only moves)
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          saveToIDB(JSON.stringify(editorState))
        }
      })
    })
  }, [editor, docId])

  return null
}

// Restores cursor position from IndexedDB after the editor initializes.
// Node keys are preserved when Lexical deserializes from JSON, so stored
// anchor/focus keys are valid after restoring content from IndexedDB.
function RestoreSelectionPlugin({ cursor }: { cursor: CursorData | null }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!cursor) return
    // Defer past synchronous initialization so the editor state is ready
    const id = setTimeout(() => {
      editor.update(() => {
        try {
          const selection = $createRangeSelection()
          selection.anchor.set(cursor.anchorKey, cursor.anchorOffset, cursor.anchorType)
          selection.focus.set(cursor.focusKey, cursor.focusOffset, cursor.focusType)
          $setSelection(selection)
        } catch {
          // Node keys may be stale if content structure changed; best-effort
        }
      })
    }, 0)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — run once on mount only

  return null
}

interface EditorProps {
  docId: string
  initialContent?: string | null
  initialCursor?: CursorData | null
  onContentChange?: (json: string) => void
}

const theme = {}

function onError(error: Error) {
  console.error(error)
}

// memo() — React never re-renders this for parent state changes (save status, online/offline).
// Lexical owns the DOM for keystrokes; React only re-renders when docId/initial* props change.
function EditorComponent({ docId, initialContent, initialCursor, onContentChange }: EditorProps) {
  const initialConfig = {
    namespace: 'DraftEditor',
    theme,
    onError,
    editorState: initialContent ?? null,
  }

  const handleChange = useCallback(
    (editorState: EditorState) => {
      onContentChange?.(JSON.stringify(editorState))
    },
    [onContentChange],
  )

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative min-h-screen">
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-screen p-8 outline-none text-base leading-relaxed"
              aria-label="Document editor"
            />
          }
          placeholder={
            <div className="absolute top-8 left-8 text-gray-400 pointer-events-none select-none">
              Start writing...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        {/* ignoreSelectionChange: server sync only fires on content changes */}
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <PersistencePlugin docId={docId} />
        <RestoreSelectionPlugin cursor={initialCursor ?? null} />
      </div>
    </LexicalComposer>
  )
}

export default memo(EditorComponent)
