import { createApi } from '@reduxjs/toolkit/query/react'

export type DocumentRecord = {
  id: string
  title: string
  content: string | null
  updatedAt: string
}

type MockArgs = {
  url: string
  method?: string
  body?: Record<string, unknown>
}

// In-memory store for mock backend.
// updatedAt starts at epoch (new Date(0)) so any locally-saved content
// is always treated as newer. A real backend would return the actual saved timestamp.
const mockStore: Record<string, DocumentRecord> = {
  'doc-1': {
    id: 'doc-1',
    title: 'Untitled Document',
    content: null,
    updatedAt: new Date(0).toISOString(),
  },
}

const mockBaseQuery = async ({ url, method = 'GET', body }: MockArgs) => {
  const match = url.match(/^\/documents\/(.+)$/)
  if (!match) return { error: { status: 404, error: 'Not found' } }

  const id = match[1]

  if (method === 'GET') {
    const doc = mockStore[id]
    return doc ? { data: doc } : { error: { status: 404, error: 'Not found' } }
  }

  if (method === 'PATCH') {
    if (!mockStore[id]) return { error: { status: 404, error: 'Not found' } }
    mockStore[id] = {
      ...mockStore[id],
      ...(body as Partial<DocumentRecord>),
      updatedAt: new Date().toISOString(),
    }
    return { data: mockStore[id] }
  }

  return { error: { status: 405, error: 'Method not allowed' } }
}

export const documentsApi = createApi({
  reducerPath: 'documentsApi',
  baseQuery: mockBaseQuery,
  endpoints: (builder) => ({
    getDocument: builder.query<DocumentRecord, string>({
      query: (id) => ({ url: `/documents/${id}` }),
    }),
    saveDocument: builder.mutation<DocumentRecord, { id: string; content: string }>({
      query: ({ id, content }) => ({
        url: `/documents/${id}`,
        method: 'PATCH',
        body: { content },
      }),
    }),
  }),
})

export const { useGetDocumentQuery, useSaveDocumentMutation } = documentsApi
