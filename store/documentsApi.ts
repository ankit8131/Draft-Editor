import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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

export type ChapterMeta = {
  id: string
  versionId: string
  order: number
  title: string
}

export type ChapterRecord = ChapterMeta & {
  content: string | null
}

export const documentsApi = createApi({
  reducerPath: 'documentsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Versions', 'Chapters'],
  endpoints: (builder) => ({
    getDocument: builder.query<DocumentRecord, string>({
      query: (id) => `/documents/${id}`,
    }),
    getVersions: builder.query<VersionRecord[], string>({
      query: (docId) => `/documents/${docId}/versions`,
      providesTags: (_result, _error, docId) => [{ type: 'Versions', id: docId }],
    }),
    createVersion: builder.mutation<
      VersionRecord,
      { docId: string; versionNumber: number; sourceVersionId?: string }
    >({
      query: ({ docId, versionNumber, sourceVersionId }) => ({
        url: `/documents/${docId}/versions`,
        method: 'POST',
        body: { versionNumber, sourceVersionId },
      }),
      invalidatesTags: (_result, _error, { docId }) => [{ type: 'Versions', id: docId }],
    }),
    getChapters: builder.query<ChapterMeta[], { docId: string; versionId: string }>({
      query: ({ docId, versionId }) => `/documents/${docId}/versions/${versionId}/chapters`,
      providesTags: (_result, _error, { versionId }) => [{ type: 'Chapters', id: versionId }],
    }),
    getChapter: builder.query<
      ChapterRecord,
      { docId: string; versionId: string; chapterId: string }
    >({
      query: ({ docId, versionId, chapterId }) =>
        `/documents/${docId}/versions/${versionId}/chapters/${chapterId}`,
    }),
    createChapter: builder.mutation<
      ChapterRecord,
      { docId: string; versionId: string; order: number; title: string }
    >({
      query: ({ docId, versionId, order, title }) => ({
        url: `/documents/${docId}/versions/${versionId}/chapters`,
        method: 'POST',
        body: { order, title },
      }),
      invalidatesTags: (_result, _error, { versionId }) => [{ type: 'Chapters', id: versionId }],
    }),
    updateChapter: builder.mutation<
      ChapterRecord,
      { docId: string; versionId: string; chapterId: string; content?: string; title?: string }
    >({
      query: ({ docId, versionId, chapterId, content, title }) => ({
        url: `/documents/${docId}/versions/${versionId}/chapters/${chapterId}`,
        method: 'PATCH',
        body: { content, title },
      }),
    }),
    updateDocument: builder.mutation<DocumentRecord, { id: string; title: string }>({
      query: ({ id, title }) => ({
        url: `/documents/${id}`,
        method: 'PATCH',
        body: { title },
      }),
      async onQueryStarted({ id, title }, { dispatch, queryFulfilled }) {
        dispatch(
          documentsApi.util.updateQueryData('getDocument', id, (draft) => {
            draft.title = title
          }),
        )
        try { await queryFulfilled } catch { /* revert on error happens automatically */ }
      },
    }),
  }),
})

export const {
  useGetDocumentQuery,
  useGetVersionsQuery,
  useCreateVersionMutation,
  useGetChaptersQuery,
  useGetChapterQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useUpdateDocumentMutation,
} = documentsApi
