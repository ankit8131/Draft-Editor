'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewScriptButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/documents', { method: 'POST' })
      const doc = await res.json()
      router.push(`/editor/${doc.id}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2.5 bg-zinc-900 text-white px-8 py-3.5 text-sm font-medium hover:bg-zinc-700 active:bg-zinc-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
          Creating…
        </>
      ) : (
        <>
          Start writing
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M1 7h12M7 1l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}
    </button>
  )
}
