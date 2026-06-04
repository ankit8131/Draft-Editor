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

export class DraftDB extends Dexie {
  docs!: EntityTable<LocalDoc, 'id'>

  constructor() {
    super('DraftDB')
    this.version(1).stores({
      // indexed fields: id (primary), savedAt, syncedAt (for querying unsynced docs)
      docs: 'id, savedAt, syncedAt',
    })
  }
}

export const db = new DraftDB()
