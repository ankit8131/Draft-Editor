@AGENTS.md

# Ankit Studio — Project Rules for Claude

## What this app is

Script writing app. Users write scripts with chapters, versions, and offline support.

- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS 4, Lexical editor, Redux Toolkit (RTK Query)
- **Server storage**: better-sqlite3 at `.data/studio.db` (auto-created, git-ignored)
- **Client storage**: Dexie (IndexedDB) — offline drafts, cursor, publications

## Key architecture facts

- Every write goes to **IndexedDB first** (300ms debounce), then server (1.5s debounce, skipped offline).
- Lexical editor state is stored as JSON strings — never raw HTML.
- `lib/db.ts` = server DB (SQLite, route handlers only). `lib/dexie.ts` = client DB (browser only).
- RTK Query lives in `store/documentsApi.ts`. All API calls go through it — do not use raw `fetch` in components except where already done for chapter content loading.
- Dexie schema versions must be incremented when adding tables or indexes — never mutate an existing version.

## File layout

```
app/
  page.tsx                        # home page
  editor/[docId]/page.tsx         # editor (client component)
  my-publications/                # publications list
  api/documents/route.ts          # GET /api/documents, POST /api/documents
  api/documents/[id]/route.ts     # GET/PATCH /api/documents/:id
  api/documents/[id]/versions/    # versions CRUD
  api/documents/[id]/versions/[versionId]/chapters/  # chapters CRUD

components/
  Editor.tsx        # Lexical setup + PersistencePlugin + ToolbarPlugin
  VersionSidebar.tsx
  ChapterTabs.tsx
  SaveStatus.tsx
  NewScriptButton.tsx

lib/
  db.ts             # SQLite helpers (server-side only)
  dexie.ts          # IndexedDB schema + db singleton
  autosave.ts       # debounce util with .flush()

store/
  documentsApi.ts   # RTK Query API slice
```

## Coding rules

- Use **npm**. Never yarn or pnpm.
- All new components go in `components/`. All new API routes follow the existing file structure under `app/api/`.
- Server-only code (SQLite, `fs`, `path`) must stay in `lib/db.ts` and route handlers. Never import `lib/db.ts` from a client component.
- Client-only code (Dexie, `window`, `navigator`) must stay in client components or `lib/dexie.ts`.
- Use `'use client'` only when required (event handlers, hooks, browser APIs).
- Tailwind only for styling — no CSS modules, no inline styles.
- TypeScript everywhere. No `any` unless unavoidable, and add a comment if so.
- Do not add comments unless the **why** is non-obvious.
- No new dependencies without asking first.

## Dev workflow

```bash
npm run dev    # start dev server
npm run build  # check for build errors before shipping
npm run lint   # ESLint
```

Data resets if `.data/` is deleted. Safe to do in dev.

## What NOT to do

- Do not mock the SQLite layer in tests — integration must hit the real DB.
- Do not call `router.push` after every mutation — only when navigation is the intent.
- Do not use `useEffect` to sync derived state — compute it inline or use `useMemo`.
- Do not add optimistic updates unless the user asks — the current pattern is server-authoritative.
- Do not create new Dexie table versions without bumping the version number.
