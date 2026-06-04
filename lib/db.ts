import Database from 'better-sqlite3'
import path from 'path'

export type DocumentRecord = {
  id: string
  title: string
  updatedAt: string
}

export type VersionRecord = {
  id: string
  docId: string
  versionNumber: number
  savedAt: string
}

export type ChapterRecord = {
  id: string
  versionId: string
  order: number
  title: string
  content: string | null
}

// Persist to a file next to the project root so data survives server restarts
const DB_PATH = path.join(process.cwd(), '.data', 'studio.db')

const globalStore = global as typeof global & { __db?: Database.Database }

function getDb(): Database.Database {
  if (!globalStore.__db) {
    const fs = require('fs') as typeof import('fs')
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

    const db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')

    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY,
        docId TEXT NOT NULL REFERENCES documents(id),
        versionNumber INTEGER NOT NULL,
        savedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        versionId TEXT NOT NULL REFERENCES versions(id),
        "order" INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT
      );
    `)

    globalStore.__db = db
  }
  return globalStore.__db
}

// Map-like wrappers so existing route handlers need no changes

function makeDocumentsProxy() {
  return {
    values(): Iterable<DocumentRecord> {
      return getDb().prepare('SELECT * FROM documents').all() as DocumentRecord[]
    },
    has(id: string): boolean {
      return !!(getDb().prepare('SELECT 1 FROM documents WHERE id = ?').get(id))
    },
    get(id: string): DocumentRecord | undefined {
      return getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocumentRecord | undefined
    },
    set(_id: string, doc: DocumentRecord): void {
      getDb()
        .prepare('INSERT OR REPLACE INTO documents (id, title, updatedAt) VALUES (?, ?, ?)')
        .run(doc.id, doc.title, doc.updatedAt)
    },
  }
}

function makeVersionsProxy() {
  return {
    values(): Iterable<VersionRecord> {
      return getDb().prepare('SELECT * FROM versions').all() as VersionRecord[]
    },
    has(id: string): boolean {
      return !!(getDb().prepare('SELECT 1 FROM versions WHERE id = ?').get(id))
    },
    get(id: string): VersionRecord | undefined {
      return getDb().prepare('SELECT * FROM versions WHERE id = ?').get(id) as VersionRecord | undefined
    },
    set(_id: string, v: VersionRecord): void {
      getDb()
        .prepare('INSERT OR REPLACE INTO versions (id, docId, versionNumber, savedAt) VALUES (?, ?, ?, ?)')
        .run(v.id, v.docId, v.versionNumber, v.savedAt)
    },
  }
}

function makeChaptersProxy() {
  return {
    values(): Iterable<ChapterRecord> {
      return getDb().prepare('SELECT * FROM chapters').all() as ChapterRecord[]
    },
    has(id: string): boolean {
      return !!(getDb().prepare('SELECT 1 FROM chapters WHERE id = ?').get(id))
    },
    get(id: string): ChapterRecord | undefined {
      return getDb().prepare('SELECT * FROM chapters WHERE id = ?').get(id) as ChapterRecord | undefined
    },
    set(_id: string, ch: ChapterRecord): void {
      getDb()
        .prepare('INSERT OR REPLACE INTO chapters (id, versionId, "order", title, content) VALUES (?, ?, ?, ?, ?)')
        .run(ch.id, ch.versionId, ch.order, ch.title, ch.content ?? null)
    },
  }
}

export const documents = makeDocumentsProxy()
export const versions = makeVersionsProxy()
export const chapters = makeChaptersProxy()
