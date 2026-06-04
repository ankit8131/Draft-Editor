'use client'

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

  return (
    <aside className="w-[52px] bg-zinc-50 border-r border-zinc-200 flex flex-col shrink-0 overflow-hidden">
      {/* Version tabs */}
      <div className="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-1">
        {versions.map((v) => {
          const isActive = v.versionNumber === currentVersionNumber
          const savedTime = new Date(v.savedAt).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })
          return (
            <button
              key={v.id}
              onClick={() => router.push(`/editor/${docId}?version=${v.versionNumber}`)}
              title={`Version ${v.versionNumber} · ${savedTime}`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-mono font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'
              }`}
            >
              {v.versionNumber}
            </button>
          )
        })}
      </div>

      {/* New version button */}
      <div className="py-3 flex justify-center border-t border-zinc-200 shrink-0">
        <button
          onClick={onCreateVersion}
          disabled={isCreating}
          title="New version"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-lg leading-none"
        >
          {isCreating ? (
            <span className="w-3 h-3 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
          ) : (
            '+'
          )}
        </button>
      </div>
    </aside>
  )
}
