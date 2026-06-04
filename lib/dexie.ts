import Dexie, { type EntityTable } from 'dexie'

// Serialized Lexical selection point — node keys are stable across JSON serialization
export type CursorData = {
  anchorKey: string
  anchorOffset: number
  anchorType: 'text' | 'element'
  focusKey: string
  focusOffset: number
  focusType: 'text' | 'element'
}

export type LocalDoc = {
  id: string
  content: string       // Lexical EditorState JSON
  cursor: CursorData | null
  savedAt: number       // ms timestamp of last local write
  syncedAt: number | null  // null = pending server sync
}

export type LocalChapter = {
  id: string         // chapterId
  content: string
  cursor: CursorData | null
  savedAt: number
  syncedAt: number | null
}

export type PublicationChapter = {
  id: string
  title: string
  content: string | null
}

export type PublicationVersion = {
  id: string
  versionNumber: number
  savedAt: string
  chapters: PublicationChapter[]
}

export type Publication = {
  id: string
  docId: string
  title: string
  publishedAt: number
  versions: PublicationVersion[]
}

export class DraftDB extends Dexie {
  docs!: EntityTable<LocalDoc, 'id'>
  chapters!: EntityTable<LocalChapter, 'id'>
  publications!: EntityTable<Publication, 'id'>

  constructor() {
    super('DraftDB')
    this.version(1).stores({ docs: 'id, savedAt, syncedAt' })
    this.version(2).stores({ docs: 'id, savedAt, syncedAt', chapters: 'id, savedAt, syncedAt' })
    this.version(3).stores({
      docs: 'id, savedAt, syncedAt',
      chapters: 'id, savedAt, syncedAt',
      publications: 'id, docId, publishedAt',
    })
  }
}

export const db = new DraftDB()
