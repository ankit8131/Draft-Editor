'use client'

import { useRef } from 'react'
import type { ChapterMeta } from '@/store/documentsApi'

interface ChapterTabsProps {
  chapters: ChapterMeta[]
  activeChapterId: string | null
  onChapterSelect: (chapterId: string) => void
  onAddChapter: () => void
  isAdding: boolean
  onPublish: () => void
  isPublishing: boolean
  publishFeedback: 'success' | 'error' | null
}

export default function ChapterTabs({
  chapters,
  activeChapterId,
  onChapterSelect,
  onAddChapter,
  isAdding,
  onPublish,
  isPublishing,
  publishFeedback,
}: ChapterTabsProps) {
  const tablistRef = useRef<HTMLDivElement>(null)

  function handleTabKeyDown(e: React.KeyboardEvent) {
    if (!tablistRef.current) return
    const tabs = Array.from(tablistRef.current.querySelectorAll<HTMLElement>('[role="tab"]'))
    const idx = tabs.indexOf(document.activeElement as HTMLElement)
    if (idx === -1) return

    let next: number | null = null
    if (e.key === 'ArrowLeft') next = idx === 0 ? tabs.length - 1 : idx - 1
    else if (e.key === 'ArrowRight') next = idx === tabs.length - 1 ? 0 : idx + 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return

    e.preventDefault()
    tabs[next].focus()
  }

  return (
    <div className="flex items-center gap-1 px-8 sm:px-14 border-b border-zinc-100 overflow-x-auto shrink-0">
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Chapters"
        className="flex items-center gap-1"
        onKeyDown={handleTabKeyDown}
      >
        {chapters.map((ch) => {
          const isActive = ch.id === activeChapterId
          return (
            <button
              key={ch.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChapterSelect(ch.id)}
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

      <button
        type="button"
        onClick={onAddChapter}
        disabled={isAdding}
        aria-label="Add chapter"
        className="ml-1 px-2 py-2 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg leading-none border-b-2 border-transparent -mb-px"
      >
        {isAdding ? (
          <>
            <span aria-hidden="true" className="inline-block w-3 h-3 rounded-full border-2 border-zinc-300 border-t-zinc-600 motion-safe:animate-spin" />
            <span className="sr-only">Adding chapter…</span>
          </>
        ) : (
          <span aria-hidden="true">+</span>
        )}
      </button>

      <div className="ml-auto pl-4 shrink-0">
        {publishFeedback && (
          <span role="status" aria-live="polite" className="sr-only">
            {publishFeedback === 'success' ? 'Script published successfully' : 'Publish failed, please try again'}
          </span>
        )}
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing}
          aria-busy={isPublishing}
          aria-label={
            isPublishing ? 'Publishing…' :
            publishFeedback === 'success' ? 'Published successfully' :
            publishFeedback === 'error' ? 'Publish failed' :
            'Publish script'
          }
          className={`px-3 py-1 text-[12px] font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            publishFeedback === 'success'
              ? 'bg-emerald-100 text-emerald-700'
              : publishFeedback === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-zinc-900 text-white hover:bg-zinc-700'
          }`}
        >
          {isPublishing ? (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-full border-2 border-zinc-500 border-t-white motion-safe:animate-spin" />
              Publishing…
            </span>
          ) : publishFeedback === 'success' ? (
            'Published!'
          ) : publishFeedback === 'error' ? (
            'Failed'
          ) : (
            'Publish'
          )}
        </button>
      </div>
    </div>
  )
}
