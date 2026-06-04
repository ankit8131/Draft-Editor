'use client'

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
  return (
    <div className="flex items-center gap-1 px-8 sm:px-14 border-b border-zinc-100 overflow-x-auto shrink-0">
      {chapters.map((ch) => {
        const isActive = ch.id === activeChapterId
        return (
          <button
            key={ch.id}
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
      <button
        onClick={onAddChapter}
        disabled={isAdding}
        title="Add chapter"
        className="ml-1 px-2 py-2 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg leading-none border-b-2 border-transparent -mb-px"
      >
        {isAdding ? (
          <span className="inline-block w-3 h-3 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
        ) : (
          '+'
        )}
      </button>

      <div className="ml-auto pl-4 shrink-0">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          title="Publish script"
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
              <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
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
