import request from '@/utils/http'

export function fetchDraftList(params: any) {
  return request.get({
    url: '/api/draft/list',
    params
  })
}

export function fetchDraftDetail(id: number) {
  return request.get({
    url: `/api/draft/detail/${id}`
  })
}

export function createDraft(data: any) {
  return request.post({
    url: '/api/draft/create',
    data
  })
}

export function updateDraft(id: number, data: any) {
  return request.put({
    url: `/api/draft/update/${id}`,
    data
  })
}

export function deleteDraft(id: number) {
  return request.del({
    url: `/api/draft/delete/${id}`
  })
}

export function fetchDraftSegments(draftId: number) {
  return request.get({
    url: `/api/draft/${draftId}/segments`
  })
}

export function saveDraftSegments(draftId: number, data: any[]) {
  return request.post({
    url: `/api/draft/${draftId}/segments/save`,
    data
  })
}

export interface DraftVocabularyItem {
  id?: number
  draftId?: number

  word: string
  phonetic: string
  partOfSpeech: string
  meaning: string
  simpleDefinition: string
  exampleSentence: string

  sortOrder: number
}

export const fetchDraftVocabularies = (draftId: number) => {
  return request.get({
    url: `/api/draft/${draftId}/vocabularies`
  })
}

export const saveDraftVocabularies = (draftId: number, data: DraftVocabularyItem[]) => {
  return request.post({
    url: `/api/draft/${draftId}/vocabularies/save`,
    data
  })
}

export function importDraftSrt(draftId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return request.post({
    url: `/api/draft/${draftId}/segments/import-srt`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function publishDraft(draftId: number) {
  return request.post({
    url: `/api/draft/${draftId}/publish`
  })
}

export function generateDraftContent(data: any) {
  return request.post({
    url: '/api/draft/ai/generate',
    data
  })
}

export function fetchArticleByUrl(data: { url: string }) {
  return request.post({
    url: '/api/draft/source/fetch-url',
    data
  })
}
