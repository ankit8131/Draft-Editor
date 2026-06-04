interface SaveStatusProps {
  isSaving: boolean
  isError: boolean
  isOnline: boolean
}

export default function SaveStatus({ isSaving, isError, isOnline }: SaveStatusProps) {
  if (!isOnline) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <span className="text-xs text-zinc-500">Offline</span>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        <span className="text-xs text-zinc-500">Save failed</span>
      </div>
    )
  }
  if (isSaving) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse shrink-0" />
        <span className="text-xs text-zinc-400">Saving…</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      <span className="text-xs text-zinc-400">Saved</span>
    </div>
  )
}
