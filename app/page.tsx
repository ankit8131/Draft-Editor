import Link from 'next/link'
import NewScriptButton from '@/components/NewScriptButton'

const features = [
  {
    num: '01',
    title: 'Auto-save',
    desc: 'Every keystroke saved locally. Never lose a line, even mid-sentence.',
  },
  {
    num: '02',
    title: 'Works offline',
    desc: 'Write without internet. Changes sync automatically when you reconnect.',
  },
  {
    num: '03',
    title: 'Version history',
    desc: 'Branch your script freely. Switch between versions with one click.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="px-8 sm:px-12 h-16 flex items-center justify-between border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 bg-zinc-900 rounded-sm" />
          <span className="font-semibold text-sm tracking-tight text-zinc-900">Pocket FM Studio</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/my-publications"
            className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            My Publications
          </Link>
          <span className="text-[11px] text-zinc-400 tracking-widest uppercase hidden sm:block">
            Script Writer
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
        <div className="inline-flex items-center gap-2 mb-10 px-3 py-1.5 rounded-full bg-zinc-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[11px] text-zinc-600 tracking-wide">
            Professional Script Writing
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.04] mb-7 max-w-3xl text-zinc-900">
          Write your story.
          <br />
          <span className="text-zinc-300">Without limits.</span>
        </h1>

        <p className="text-zinc-500 text-base sm:text-lg max-w-sm leading-relaxed mb-12">
          A distraction-free writing environment for creators. Auto-saves. Works offline.
        </p>

        <NewScriptButton />

        <p className="mt-5 text-xs text-zinc-400">No account needed. Starts instantly.</p>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          {features.map((f) => (
            <div key={f.num} className="px-10 py-12">
              <p className="text-xs text-zinc-300 mb-5 font-mono tracking-widest">{f.num}</p>
              <h3 className="font-semibold text-sm text-zinc-900 mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-100 px-8 sm:px-12 py-5 flex items-center justify-between">
        <p className="text-xs text-zinc-400">© {new Date().getFullYear()} Pocket FM Studio</p>
        <p className="text-xs text-zinc-300">Built for writers.</p>
      </footer>
    </div>
  )
}
