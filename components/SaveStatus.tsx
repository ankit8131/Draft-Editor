interface SaveStatusProps {
  isSaving: boolean
  isError: boolean
  isOnline: boolean
}

export default function SaveStatus({ isSaving, isError, isOnline }: SaveStatusProps) {
  if (!isOnline) return <span className="text-xs text-amber-500">Offline — saved locally</span>
  if (isError) return <span className="text-xs text-red-500">Save failed</span>
  if (isSaving) return <span className="text-xs text-gray-400">Saving...</span>
  return <span className="text-xs text-gray-300">Saved</span>
}
