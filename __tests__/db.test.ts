import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import os from 'os'
import path from 'path'
import fs from 'fs'

const tmpDb = path.join(os.tmpdir(), `studio-test-${process.pid}.db`)

// Set env before importing the module so getDb() picks up the test path
process.env.STUDIO_DB_PATH = tmpDb

// Dynamic import ensures env is set before module-level code runs
const { documents, versions, chapters, _resetDbForTesting } = await import('../lib/db')

beforeEach(() => {
  _resetDbForTesting()
  if (fs.existsSync(tmpDb)) fs.unlinkSync(tmpDb)
  // Re-importing re-uses the same module; reset forces re-init on next call
})

afterEach(() => {
  _resetDbForTesting()
  if (fs.existsSync(tmpDb)) fs.unlinkSync(tmpDb)
})

describe('documents', () => {
  it('set and get a document', () => {
    documents.set('d1', { id: 'd1', title: 'My Script', updatedAt: '2024-01-01T00:00:00Z' })
    const doc = documents.get('d1')
    expect(doc).toEqual({ id: 'd1', title: 'My Script', updatedAt: '2024-01-01T00:00:00Z' })
  })

  it('has() returns true for existing doc', () => {
    documents.set('d2', { id: 'd2', title: 'Draft', updatedAt: '2024-01-01T00:00:00Z' })
    expect(documents.has('d2')).toBe(true)
  })

  it('has() returns false for missing doc', () => {
    expect(documents.has('nope')).toBe(false)
  })

  it('get() returns undefined for missing doc', () => {
    expect(documents.get('missing')).toBeUndefined()
  })

  it('values() returns all documents', () => {
    documents.set('a', { id: 'a', title: 'A', updatedAt: '2024-01-01T00:00:00Z' })
    documents.set('b', { id: 'b', title: 'B', updatedAt: '2024-01-01T00:00:00Z' })
    const all = [...documents.values()]
    expect(all).toHaveLength(2)
    expect(all.map(d => d.id).sort()).toEqual(['a', 'b'])
  })

  it('set() overwrites existing doc (upsert)', () => {
    documents.set('d3', { id: 'd3', title: 'Old', updatedAt: '2024-01-01T00:00:00Z' })
    documents.set('d3', { id: 'd3', title: 'New', updatedAt: '2024-06-01T00:00:00Z' })
    expect(documents.get('d3')?.title).toBe('New')
  })
})

describe('versions', () => {
  beforeEach(() => {
    documents.set('doc1', { id: 'doc1', title: 'Script', updatedAt: '2024-01-01T00:00:00Z' })
  })

  it('set and get a version', () => {
    versions.set('v1', { id: 'v1', docId: 'doc1', versionNumber: 1, savedAt: '2024-01-01T00:00:00Z' })
    expect(versions.get('v1')).toEqual({ id: 'v1', docId: 'doc1', versionNumber: 1, savedAt: '2024-01-01T00:00:00Z' })
  })

  it('has() returns correct boolean', () => {
    versions.set('v2', { id: 'v2', docId: 'doc1', versionNumber: 2, savedAt: '2024-01-01T00:00:00Z' })
    expect(versions.has('v2')).toBe(true)
    expect(versions.has('vX')).toBe(false)
  })

  it('values() lists all versions', () => {
    versions.set('va', { id: 'va', docId: 'doc1', versionNumber: 1, savedAt: '2024-01-01T00:00:00Z' })
    versions.set('vb', { id: 'vb', docId: 'doc1', versionNumber: 2, savedAt: '2024-01-01T00:00:00Z' })
    expect([...versions.values()]).toHaveLength(2)
  })
})

describe('chapters', () => {
  beforeEach(() => {
    documents.set('doc1', { id: 'doc1', title: 'Script', updatedAt: '2024-01-01T00:00:00Z' })
    versions.set('ver1', { id: 'ver1', docId: 'doc1', versionNumber: 1, savedAt: '2024-01-01T00:00:00Z' })
  })

  it('set and get a chapter', () => {
    chapters.set('ch1', { id: 'ch1', versionId: 'ver1', order: 0, title: 'Act 1', content: '{"root":{}}' })
    expect(chapters.get('ch1')).toEqual({ id: 'ch1', versionId: 'ver1', order: 0, title: 'Act 1', content: '{"root":{}}' })
  })

  it('stores null content', () => {
    chapters.set('ch2', { id: 'ch2', versionId: 'ver1', order: 1, title: 'Act 2', content: null })
    expect(chapters.get('ch2')?.content).toBeNull()
  })

  it('has() returns correct boolean', () => {
    chapters.set('ch3', { id: 'ch3', versionId: 'ver1', order: 2, title: 'Act 3', content: null })
    expect(chapters.has('ch3')).toBe(true)
    expect(chapters.has('chX')).toBe(false)
  })

  it('values() lists all chapters', () => {
    chapters.set('c1', { id: 'c1', versionId: 'ver1', order: 0, title: 'A', content: null })
    chapters.set('c2', { id: 'c2', versionId: 'ver1', order: 1, title: 'B', content: null })
    expect([...chapters.values()]).toHaveLength(2)
  })

  it('set() overwrites chapter (upsert)', () => {
    chapters.set('ch4', { id: 'ch4', versionId: 'ver1', order: 0, title: 'Old', content: null })
    chapters.set('ch4', { id: 'ch4', versionId: 'ver1', order: 0, title: 'Updated', content: 'new' })
    expect(chapters.get('ch4')?.title).toBe('Updated')
  })
})
