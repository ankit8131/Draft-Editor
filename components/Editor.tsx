'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
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
  FORMAT_TEXT_COMMAND,
  TextFormatType,
} from 'lexical'
import type { EditorState } from 'lexical'
import { db } from '@/lib/dexie'
import type { CursorData } from '@/lib/dexie'
import { debounce } from '@/lib/autosave'

function PersistencePlugin({ chapterId }: { chapterId: string }) {
  const [editor] = useLexicalComposerContext()
  const cursorRef = useRef<CursorData | null>(null)
  const isReadyRef = useRef(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      isReadyRef.current = true
    })
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const saveToIDB = debounce((content: string) => {
      db.chapters.put({
        id: chapterId,
        content,
        cursor: cursorRef.current,
        savedAt: Date.now(),
        syncedAt: null,
      })
    }, 300)

    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      editorState.read(() => {
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
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          if (!isReadyRef.current) return
          saveToIDB(JSON.stringify(editorState))
        }
      })
    })
  }, [editor, chapterId])

  return null
}

function RestoreSelectionPlugin({ cursor }: { cursor: CursorData | null }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!cursor) return
    const id = setTimeout(() => {
      editor.update(() => {
        try {
          const selection = $createRangeSelection()
          selection.anchor.set(cursor.anchorKey, cursor.anchorOffset, cursor.anchorType)
          selection.focus.set(cursor.focusKey, cursor.focusOffset, cursor.focusType)
          $setSelection(selection)
        } catch {
          // stale node keys after content change; best-effort restore
        }
      })
    }, 0)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

type ActiveFormats = { bold: boolean; italic: boolean; underline: boolean }

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [active, setActive] = useState<ActiveFormats>({ bold: false, italic: false, underline: false })

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          setActive({
            bold: sel.hasFormat('bold'),
            italic: sel.hasFormat('italic'),
            underline: sel.hasFormat('underline'),
          })
        }
      })
    })
  }, [editor])

  const btns: { label: string; fmt: TextFormatType; cls: string }[] = [
    { label: 'B', fmt: 'bold', cls: 'font-bold' },
    { label: 'I', fmt: 'italic', cls: 'italic' },
    { label: 'U', fmt: 'underline', cls: 'underline' },
  ]

  return (
    <div className="flex items-center gap-0.5 px-8 sm:px-14 py-1.5 border-b border-zinc-100 shrink-0">
      {btns.map((btn) => (
        <button
          key={btn.fmt}
          onMouseDown={(e) => {
            e.preventDefault()
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, btn.fmt)
          }}
          className={`w-7 h-7 rounded text-sm transition-colors ${btn.cls} ${
            active[btn.fmt as keyof ActiveFormats]
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
          }`}
          title={btn.fmt.charAt(0).toUpperCase() + btn.fmt.slice(1)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}

interface EditorProps {
  chapterId: string
  initialContent?: string | null
  initialCursor?: CursorData | null
  onContentChange?: (json: string) => void
}

const theme = {
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

function onError(error: Error) {
  console.error(error)
}

function EditorComponent({ chapterId, initialContent, initialCursor, onContentChange }: EditorProps) {
  const isReadyRef = useRef(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      isReadyRef.current = true
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const initialConfig = {
    namespace: 'DraftEditor',
    theme,
    onError,
    editorState: initialContent ?? null,
  }

  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (!isReadyRef.current) return
      onContentChange?.(JSON.stringify(editorState))
    },
    [onContentChange],
  )

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <ToolbarPlugin />
      <div className="relative px-8 sm:px-14 pt-10 pb-32 max-w-[680px] mx-auto">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-[60vh] outline-none text-[17px] leading-[1.85] text-zinc-800 caret-zinc-900 font-[var(--font-geist-sans)]"
              aria-label="Document editor"
            />
          }
          placeholder={
            <div className="absolute top-10 left-8 sm:left-14 text-zinc-300 pointer-events-none select-none text-[17px] leading-[1.85]">
              Start writing…
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <PersistencePlugin chapterId={chapterId} />
        <RestoreSelectionPlugin cursor={initialCursor ?? null} />
      </div>
    </LexicalComposer>
  )
}

export default memo(EditorComponent)
