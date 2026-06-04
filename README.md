# Pocket FM Studio

A distraction-free script writing app. Auto-saves. Works offline. Supports multiple versions and chapters.

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | Next.js 16.2.7 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Editor | Lexical |
| State | Redux Toolkit (RTK Query) |
| Server DB | better-sqlite3 → `.data/studio.db` |
| Local DB | Dexie (IndexedDB) — offline cache |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Node 18+ required. The SQLite database is created automatically at `.data/studio.db` on first run.

## How to Use

### Create a script
1. Go to the home page.
2. Click **New Script** — you land in the editor with Version 1 ready.

### Write
- Just type. Auto-save fires 300ms after you stop typing (local) and 1.5s to the server.
- Formatting toolbar: **Bold**, *Italic*, Underline.
- Cursor position is restored on reload.

### Chapters
- Add chapters with the **+** tab at the top.
- Click a chapter tab to switch. Each chapter saves independently.

### Versions
- The left sidebar shows version numbers (`1`, `2`, …).
- Click **+** at the bottom of the sidebar to fork the current version into a new one.
- Switch versions freely — content is isolated per version.

### Publish
- Click **Publish** in the chapter tab bar.
- Snapshots all versions + chapters into IndexedDB.
- View saved publications at `/my-publications`.

### Offline
- Writes go to IndexedDB immediately.
- When you come back online, the server syncs automatically.
- The save indicator in the header shows online/offline state.

### Rename a script
- Click the script title in the header to edit it inline. Press **Enter** or click away to save.

## Scripts

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run start    # start production server
npm run lint     # run ESLint
```

## Project Structure

```
app/
  page.tsx                  # home / landing
  editor/[docId]/page.tsx   # main editor page
  my-publications/          # saved publications list
  api/documents/            # REST API routes (documents, versions, chapters)

components/
  Editor.tsx                # Lexical editor + auto-save plugin
  VersionSidebar.tsx        # version switcher
  ChapterTabs.tsx           # chapter tabs + publish button
  SaveStatus.tsx            # online/offline + save indicator
  NewScriptButton.tsx       # creates doc + redirects to editor

lib/
  db.ts                     # better-sqlite3 (server)
  dexie.ts                  # IndexedDB schema (client)
  autosave.ts               # debounce utility

store/
  documentsApi.ts           # RTK Query endpoints
```

## Data

Server data lives in `.data/studio.db` (SQLite, git-ignored). Local drafts live in the browser's IndexedDB. Deleting `.data/` resets all server-side documents.

---

## Chapter Feature — Design Explanation

### Why chapters exist

A script is not one big wall of text. It has acts, scenes, or episodes. Chapters let writers split a script into named sections and work on each independently — without scrolling through a 50-page document.

### Why chapters belong to a version, not a document

Each **version** has its own set of chapters. This is intentional.

When you fork a version (e.g. v1 → v2), the chapters are copied from the source. After that, v1 and v2 have completely independent chapter sets. You can restructure chapters in v2 without touching v1. The version is the unit of a complete draft; chapters are its parts.

```
Document
 └── Version 1
 │    ├── Chapter 1  (Act I)
 │    └── Chapter 2  (Act II)
 └── Version 2  (forked from v1)
      ├── Chapter 1  (Act I — rewritten)
      └── Chapter 2  (Act II)
      └── Chapter 3  (new epilogue)
```

### Why chapter content is loaded lazily

The chapter list (titles, order) loads upfront. The **content** of a chapter is only fetched when you click its tab.

This matters because scripts get long. Loading all chapters at once would mean fetching megabytes of Lexical JSON on every page load. Lazy loading keeps the initial load fast regardless of how many chapters a script has.

### Why each chapter has its own editor instance

The `Editor` component is mounted with `key={activeChapterId}`. When you switch tabs, React unmounts the old editor and mounts a fresh one with the new chapter's content.

This is simpler and safer than trying to swap content inside a live Lexical instance, which can leak state from the previous chapter (selection, undo history, dirty marks).

### How stale content is prevented

Two state values track which chapter is active:

| Variable | Meaning |
|---|---|
| `activeChapterId` | Chapter the user selected (intent) |
| `loadedChapterId` | Chapter whose content is actually in state (ready) |

The editor only renders when `activeChapterId === loadedChapterId`. While they differ, a spinner shows. This prevents the previous chapter's content from flashing in the editor for the split second before the new chapter loads.

### Where chapter content lives

| Location | When written | When read |
|---|---|---|
| IndexedDB (Dexie) | Every keystroke (300ms debounce) | On tab switch — checked first |
| SQLite (server) | 1.5s after typing stops, only if online | Fallback if IDB has nothing |

IDB is always checked first. If the chapter has been opened before, it loads instantly from the local cache — no network round trip.
