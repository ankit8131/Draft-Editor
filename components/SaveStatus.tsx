interface SaveStatusProps {
  isSaving: boolean
  isError: boolean
  isOnline: boolean
}

export default function SaveStatus({ isSaving, isError, isOnline }: SaveStatusProps) {
  let label: string
  let dotClass: string

  if (!isOnline) {
    label = 'Offline'
    dotClass = 'bg-amber-400'
  } else if (isError) {
    label = 'Save failed'
    dotClass = 'bg-red-500'
  } else if (isSaving) {
    label = 'Saving…'
    dotClass = 'bg-zinc-400 motion-safe:animate-pulse'
  } else {
    label = 'Saved'
    dotClass = 'bg-emerald-500'
  }

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="flex items-center gap-2">
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}
