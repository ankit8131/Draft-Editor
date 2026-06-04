'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { VersionRecord } from '@/store/documentsApi'

interface VersionSidebarProps {
  docId: string
  versions: VersionRecord[]
  currentVersionNumber: number | null
  onCreateVersion: () => void
  isCreating: boolean
}

export default function VersionSidebar({
  docId,
  versions,
  currentVersionNumber,
  onCreateVersion,
  isCreating,
}: VersionSidebarProps) {
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!listRef.current) return
    const buttons = Array.from(listRef.current.querySelectorAll<HTMLElement>('button[data-version]'))
    const idx = buttons.indexOf(document.activeElement as HTMLElement)
    if (idx === -1) return

    let next: number | null = null
    if (e.key === 'ArrowDown') next = Math.min(idx + 1, buttons.length - 1)
    else if (e.key === 'ArrowUp') next = Math.max(idx - 1, 0)
    else return

    e.preventDefault()
    buttons[next].focus()
  }

  return (
    <aside aria-label="Version history" className="w-[52px] bg-zinc-50 border-r border-zinc-200 flex flex-col shrink-0 overflow-hidden">
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-1"
        onKeyDown={handleKeyDown}
      >
        {versions.map((v) => {
          const isActive = v.versionNumber === currentVersionNumber
          const savedTime = new Date(v.savedAt).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })
          return (
            <button
              key={v.id}
              type="button"
              data-version={v.versionNumber}
              onClick={() => router.push(`/editor/${docId}?version=${v.versionNumber}`)}
              aria-label={`Version ${v.versionNumber}, saved at ${savedTime}`}
              aria-current={isActive ? 'true' : undefined}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-mono font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'
              }`}
            >
              <span aria-hidden="true">{v.versionNumber}</span>
            </button>
          )
        })}
      </div>

      <div className="py-3 flex justify-center border-t border-zinc-200 shrink-0">
        <button
          type="button"
          onClick={onCreateVersion}
          disabled={isCreating}
          aria-label="Create new version"
          aria-busy={isCreating}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-lg leading-none"
        >
          {isCreating ? (
            <>
              <span aria-hidden="true" className="w-3 h-3 rounded-full border-2 border-zinc-300 border-t-zinc-600 motion-safe:animate-spin" />
              <span className="sr-only">Creating version…</span>
            </>
          ) : (
            <span aria-hidden="true">+</span>
          )}
        </button>
      </div>
    </aside>
  )
}
