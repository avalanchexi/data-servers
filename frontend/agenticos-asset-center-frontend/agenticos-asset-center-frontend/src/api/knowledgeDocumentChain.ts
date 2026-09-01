/**
 * 知识库文档管理正式 API 适配层。
 *
 * 这里统一封装 `/v1/knowledge/document-uploads`、解析、构建和分类接口。
 * 页面只消费这里暴露的稳定结构，避免把后端字段转换逻辑散落到组件里。
 */
import { AxiosProgressEvent } from 'axios'
import { createHttp } from './http'
import {
  BuildResponse,
  BuildStatusResponse,
  ChunkPreviewResponse,
  DocumentCategoryApi,
  DocumentCategoryResponse,
  DocumentCategoryTreeResponse,
  KbListResponse,
  KnowledgeBase,
  ParseProgress,
  ParseResult,
  UploadItem,
  UploadListResponse,
  UpdateEffectiveTimeRequest,
} from './knowledgeRag'

const API_PROXY_PREFIX = '/api'

const knowledgeHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/knowledge`,
  timeout: 60000,
})

export interface KnowledgeBaseDeleteImpact {
  knowledge_base_id: string
  linked_agents: Array<{
    id: string
    name: string
  }>
}

export interface KnowledgeBaseDocumentStats {
  total: number
  ready: number
  pending: number
  processing: number
  failed: number
  disabled: number
}

export interface KnowledgeBaseRecallSummary {
  status: 'success' | 'empty' | 'failed'
  hit_count: number
  duration_ms: number | null
  tested_at: string
}

export interface KnowledgeBaseOverviewItem extends KnowledgeBase {
  document_stats: KnowledgeBaseDocumentStats
  availability: 'normal' | 'partial' | 'unavailable' | 'disabled'
  current_stage: 'new' | 'processing' | 'maintaining'
  latest_recall: KnowledgeBaseRecallSummary | null
}

export interface KnowledgeBaseOverviewResponse {
  total: number
  items: KnowledgeBaseOverviewItem[]
  limit: number
  offset: number
}

interface KnowledgeDocumentFileResponse {
  upload_file_id: string
  knowledge_base_id: string
  kb_document_category_id?: string | null
  document_id?: string | null
  file_object_id: string
  upload_status: string
  source_type: string
  uploader_id?: string | null
  uploader_name?: string | null
  upload_batch_id?: string | null
  effective_tm?: string | null
  if_enable?: number | null
  is_enabled?: boolean | null
  if_inherit_kb_parser: number
  parser_config_override?: Record<string, unknown> | null
  latest_parse_task_id?: string | null
  latest_parse_status?: string | null
  latest_parse_progress?: number | null
  latest_parse_error_code?: string | null
  latest_parse_error_msg?: string | null
  lightrag_status?: string | null
  chunk_count?: number | null
  original_name?: string | null
  display_name?: string | null
  content_type?: string | null
  size_bytes?: number | null
  content_sha256?: string | null
  storage_status?: string | null
  if_delete: number
  create_tm?: string | null
  modify_tm?: string | null
}

interface KnowledgeDocumentFileListResponse {
  total: number
  items: KnowledgeDocumentFileResponse[]
  limit: number
  offset: number
}

export interface KnowledgeDocumentFileBatchDeleteItemResponse {
  index: number
  upload_file_id: string
  success: boolean
  delete_result?: {
    upload_file_id: string
    file_object_id: string
    delete_mode: 'physical' | 'logical_keep_file' | 'logical_delete_file'
    physical_deleted: boolean
    object_deleted: boolean
    if_delete?: number | null
    storage_status?: string | null
  } | null
  error_code?: string | null
  error_msg?: string | null
}

export interface KnowledgeDocumentFileBatchDeleteResponse {
  total: number
  success_count: number
  failed_count: number
  items: KnowledgeDocumentFileBatchDeleteItemResponse[]
}

interface KnowledgeDocumentFileBatchResponse {
  upload_batch_id: string
  total: number
  success_count: number
  failed_count: number
  items: Array<{
    index: number
    filename: string
    success: boolean
    upload?: KnowledgeDocumentFileResponse | null
    error_code?: string | null
    error_msg?: string | null
  }>
}

interface KnowledgeBuildSubmitResponse {
  status: string
  results: Array<{
    upload_id: string
    status: string
    chunk_count?: number
    error?: string
    message?: string
  }>
}

export interface KnowledgeBuildBatchItem extends BuildResponse {
  success: boolean
  error?: string
}

interface KnowledgeParseSubmitResponse {
  total: number
  accepted_count: number
  rejected_count: number
  items: Array<{
    upload_file_id: string
    parse_task_id?: string | null
    accepted: boolean
    parse_status?: string | null
    error_code?: string | null
    error_msg?: string | null
  }>
}

interface KnowledgeParseProgressResponse {
  parse_task_id: string
  upload_file_id: string
  knowledge_base_id: string
  file_object_id: string
  parser_engine: string
  parser_strategy: string
  parse_status: string
  parse_stage?: string | null
  progress: number
  retry_count: number
  chunk_count: number
  error_code?: string | null
  error_msg?: string | null
  runtime_metadata?: Record<string, unknown>
  start_tm?: string | null
  finish_tm?: string | null
  create_tm?: string | null
  modify_tm?: string | null
}

interface KnowledgeDocumentChunkListResponse {
  document_id?: string | null
  upload_file_id: string
  total: number
  items: Array<{
    chunk_id: string
    document_id: string
    upload_file_id?: string | null
    parse_task_id?: string | null
    seq_no: number
    content: string
    content_with_weight?: string | null
    char_count: number
    token_count: number
    page_no?: number | null
  }>
  limit: number
  offset: number
}

function parseStatusToPageStatus(parseStatus?: string | null, uploadStatus = 'uploaded'): UploadItem['status'] {
  if (parseStatus === 'queued' || parseStatus === 'running') return 'parsing'
  if (parseStatus === 'success' || parseStatus === 'succeeded') return 'parsed'
  if (parseStatus === 'failed') return 'failed'
  return uploadStatus === 'stored' ? 'uploaded' : uploadStatus
}

function pageStatusToParseStatus(status?: string): string | undefined {
  if (!status) return undefined
  if (status === 'uploaded') return 'uploaded'
  if (status === 'parsing') return 'running'
  if (status === 'parsed') return 'success'
  if (status === 'failed') return 'failed'
  return status
}

function submitStatusToPageStatus(parseStatus?: string | null, accepted?: boolean): string {
  if (accepted) return 'running'
  if (parseStatus === 'queued' || parseStatus === 'running') return 'running'
  if (parseStatus === 'success' || parseStatus === 'succeeded') return 'parsed'
  if (!parseStatus) return 'failed'
  return parseStatusToPageStatus(parseStatus)
}

function toUploadItem(row: KnowledgeDocumentFileResponse): UploadItem {
  const status = parseStatusToPageStatus(row.latest_parse_status, row.upload_status || 'uploaded')
  const rawName = row.original_name || row.file_object_id
  const displayName = row.display_name || rawName
  const isEnabled = typeof row.is_enabled === 'boolean' ? row.is_enabled : Number(row.if_enable ?? 1) === 1
  return {
    id: row.upload_file_id,
    kb_id: row.knowledge_base_id,
    kb_document_category_id: row.kb_document_category_id || null,
    uploader_id: row.uploader_id || null,
    uploader_name: row.uploader_name || row.uploader_id || null,
    original_name: rawName,
    display_name: displayName,
    stored_path: row.file_object_id,
    mime: row.content_type || null,
    size_bytes: Number(row.size_bytes || 0),
    sha256: row.content_sha256 || null,
    status,
    progress: status === 'parsed' ? 100 : Number(row.latest_parse_progress || 0),
    error_message: row.latest_parse_error_msg || null,
    retry_count: 0,
    ragflow_upload_status: row.latest_parse_status || null,
    document_id: row.document_id || null,
    chunk_count: row.chunk_count ?? undefined,
    vector_status: 'none',
    vector_progress: 0,
    vector_error_message: null,
    parser_config: row.parser_config_override || {},
    parser_config_source: row.if_inherit_kb_parser === 1 ? 'kb' : 'document',
    parser_plan: null,
    uploaded_at: row.create_tm || '',
    updated_at: row.modify_tm || null,
    effective_time: row.effective_tm || null,
    is_enabled: isEnabled,
    started_at: null,
    finished_at: status === 'parsed' ? row.modify_tm || null : null,
    lightrag_status: row.lightrag_status || 'none',
  }
}

function toParseResult(item: KnowledgeParseSubmitResponse['items'][number]): ParseResult {
  return {
    upload_id: item.upload_file_id,
    status: submitStatusToPageStatus(item.parse_status, item.accepted),
    error: item.error_msg || null,
  }
}

export const KnowledgeDocumentCategoryApi = {
  ...DocumentCategoryApi,
  updateUpload: (payload: { upload_id: string; original_name?: string; kb_document_category_id?: string }) =>
    knowledgeHttp
      .patch<KnowledgeDocumentFileResponse>(`/document-uploads/${payload.upload_id}`, {
        display_name: payload.original_name,
        kb_document_category_id: payload.kb_document_category_id,
      })
      .then((r) => {
        const item = toUploadItem(r.data)
        return {
          id: item.id,
          knowledge_base_id: item.kb_id,
          kb_document_category_id: item.kb_document_category_id || null,
          document_id: item.document_id || null,
          original_name: item.display_name || item.original_name,
          display_name: item.display_name || null,
          is_enabled: item.is_enabled,
          status: item.status,
          uploaded_at: item.uploaded_at,
          updated_at: item.updated_at,
        }
      }),
  tree: (knowledgeBaseId: string): Promise<DocumentCategoryTreeResponse> => DocumentCategoryApi.tree(knowledgeBaseId),
  create: (payload: Parameters<typeof DocumentCategoryApi.create>[0]): Promise<DocumentCategoryResponse> =>
    DocumentCategoryApi.create(payload),
  update: (payload: Parameters<typeof DocumentCategoryApi.update>[0]): Promise<DocumentCategoryResponse> =>
    DocumentCategoryApi.update(payload),
  remove: (documentCategoryId: string): Promise<boolean> => DocumentCategoryApi.remove(documentCategoryId),
}

export const KnowledgeBaseApi = {
  list: (params?: { keyword?: string; status?: string; is_enabled?: boolean; limit?: number; offset?: number }) =>
    knowledgeHttp.get<KbListResponse>('/knowledge-bases', { params }).then((r) => r.data),
  overview: (params?: {
    knowledge_base_id?: string
    keyword?: string
    is_enabled?: boolean
    availability?: string
    recall_status?: string
    limit?: number
    offset?: number
  }) => knowledgeHttp.get<KnowledgeBaseOverviewResponse>('/knowledge-bases/overview', { params }).then((r) => r.data),
  create: (payload: {
    name: string
    description?: string
    default_parser?: string
    is_public?: boolean
    is_enabled?: boolean
    settings?: Record<string, unknown>
    parser_config?: Record<string, unknown>
  }) => knowledgeHttp.post<KnowledgeBase>('/knowledge-bases', payload).then((r) => r.data),
  update: (id: string, payload: Partial<KnowledgeBase>) =>
    knowledgeHttp.patch<KnowledgeBase>(`/knowledge-bases/${id}`, payload).then((r) => r.data),
  deleteImpact: (id: string) =>
    knowledgeHttp.get<KnowledgeBaseDeleteImpact>(`/knowledge-bases/${id}/delete-impact`).then((r) => r.data),
  remove: (id: string) => knowledgeHttp.delete(`/knowledge-bases/${id}`).then(() => true),
  refreshAllStorage: () => Promise.resolve({ updated: 0, errors: [] as unknown[] }),
}

export const KnowledgeUploadApi = {
  upload: (
    kbId: string,
    files: File[],
    onProgress?: (e: AxiosProgressEvent) => void,
    effectiveTime?: string | null,
    kbDocumentCategoryId?: string | null
  ): Promise<UploadItem[]> => {
    const form = new FormData()
    form.append('knowledge_base_id', kbId)
    form.append('if_inherit_kb_parser', '1')
    if (effectiveTime) {
      form.append('effective_tm', effectiveTime)
    }
    if (kbDocumentCategoryId) {
      form.append('kb_document_category_id', kbDocumentCategoryId)
    }
    files.forEach((file) => form.append('files', file, file.name))
    return knowledgeHttp
      .post<KnowledgeDocumentFileBatchResponse>('/document-uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
        timeout: 600000,
      })
      .then((r) => {
        const uploaded = r.data.items
          .filter((item) => item.success && item.upload)
          .map((item) => toUploadItem(item.upload as KnowledgeDocumentFileResponse))
        if (!uploaded.length && r.data.failed_count > 0) {
          const firstError = r.data.items.find((item) => !item.success)
          throw new Error(firstError?.error_msg || '上传失败')
        }
        return uploaded
      })
  },
  // ── 单文件上传（用于逐文件独立进度展示） ──
  uploadSingle: (
    kbId: string,
    file: File,
    onProgress?: (e: AxiosProgressEvent) => void,
    effectiveTime?: string | null,
    kbDocumentCategoryId?: string | null,
    signal?: AbortSignal
  ): Promise<UploadItem> => {
    const form = new FormData()
    form.append('knowledge_base_id', kbId)
    form.append('if_inherit_kb_parser', '1')
    if (effectiveTime) form.append('effective_tm', effectiveTime)
    if (kbDocumentCategoryId) form.append('kb_document_category_id', kbDocumentCategoryId)
    form.append('files', file, file.name)
    return knowledgeHttp
      .post<KnowledgeDocumentFileBatchResponse>('/document-uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
        timeout: 600000,
        signal,
      })
      .then((r) => {
        const item = r.data.items[0]
        if (!item.success || !item.upload) {
          throw new Error(item.error_msg || '上传失败')
        }
        return toUploadItem(item.upload as KnowledgeDocumentFileResponse)
      })
  },
  list: (params?: {
    kb_id?: string
    kb_document_category_id?: string
    status?: string
    keyword?: string
    is_enabled?: boolean
    limit?: number
    offset?: number
  }): Promise<UploadListResponse> =>
    knowledgeHttp
      .get<KnowledgeDocumentFileListResponse>('/document-uploads', {
        params: {
          knowledge_base_id: params?.kb_id,
          kb_document_category_id: params?.kb_document_category_id,
          parse_status: pageStatusToParseStatus(params?.status),
          keyword: params?.keyword,
          is_enabled: params?.is_enabled,
          limit: params?.limit,
          offset: params?.offset,
        },
      })
      .then((r) => ({
        total: r.data.total,
        items: r.data.items.map(toUploadItem),
        limit: r.data.limit,
        offset: r.data.offset,
      })),
  get: (id: string): Promise<UploadItem> =>
    knowledgeHttp.get<KnowledgeDocumentFileResponse>(`/document-uploads/${id}`).then((r) => toUploadItem(r.data)),
  updateParserConfig: (
    id: string,
    payload: { inherit_kb: boolean; parser_config?: Record<string, unknown> | null }
  ): Promise<UploadItem> =>
    knowledgeHttp
      .patch<KnowledgeDocumentFileResponse>(`/document-uploads/${id}`, {
        if_inherit_kb_parser: payload.inherit_kb ? 1 : 0,
        parser_config_override: payload.parser_config || {},
      })
      .then((r) => toUploadItem(r.data)),
  updateEffectiveTime: (id: string, payload: UpdateEffectiveTimeRequest) =>
    knowledgeHttp
      .patch<KnowledgeDocumentFileResponse>(`/document-uploads/${id}`, {
        effective_tm: payload.effective_time,
      })
      .then((r) => toUploadItem(r.data)),
  updateEnabled: (id: string, isEnabled: boolean): Promise<UploadItem> =>
    knowledgeHttp
      .patch<KnowledgeDocumentFileResponse>(`/document-uploads/${id}/enabled`, {
        is_enabled: isEnabled,
      })
      .then((r) => toUploadItem(r.data)),
  downloadUrl: (id: string) => `${API_PROXY_PREFIX}/v1/knowledge/document-uploads/${id}/download`,
  download: (id: string) => {
    window.open(`${API_PROXY_PREFIX}/v1/knowledge/document-uploads/${id}/download`, '_blank')
  },
  remove: (id: string) => knowledgeHttp.delete(`/document-uploads/${id}`, { timeout: 300000 }).then(() => true),
  batchDelete: (uploadIds: string[]): Promise<KnowledgeDocumentFileBatchDeleteResponse> =>
    knowledgeHttp
      .post<KnowledgeDocumentFileBatchDeleteResponse>(
        '/document-uploads/batch-delete',
        { upload_file_ids: uploadIds },
        { timeout: 300000 }
      )
      .then((r) => r.data),
}

export const KnowledgeParseApi = {
  trigger: (uploadIds: string[], options?: { force?: boolean }): Promise<ParseResult[]> =>
    knowledgeHttp
      .post<KnowledgeParseSubmitResponse>('/document-uploads/parse', {
        upload_file_ids: uploadIds,
        force: Boolean(options?.force),
      }, { timeout: 0 })
      .then((r) => r.data.items.map(toParseResult)),
  retry: (uploadId: string): Promise<ParseResult> =>
    knowledgeHttp
      .post<KnowledgeParseSubmitResponse['items'][number]>(`/document-uploads/${uploadId}/parse`, undefined, {
        params: { force: true },
        timeout: 0,
      })
      .then((r) => toParseResult(r.data)),
  vectorize: (uploadIds: string[]): Promise<ParseResult[]> =>
    Promise.resolve(uploadIds.map((upload_id) => ({ upload_id, status: 'parsed' }))),
  progress: (uploadId: string): Promise<ParseProgress> =>
    knowledgeHttp
      .get<KnowledgeParseProgressResponse>(`/document-parses/${uploadId}/progress`)
      .then((r) => ({
        upload_id: r.data.upload_file_id,
        status: parseStatusToPageStatus(r.data.parse_status),
        stage: r.data.parse_stage || null,
        progress: r.data.progress,
        error_message: r.data.error_msg || null,
        ragflow_run: r.data.parse_status,
        ragflow_progress_msg: r.data.error_msg || null,
      })),
  chunks: (uploadId: string, params?: { limit?: number; offset?: number }): Promise<ChunkPreviewResponse> =>
    knowledgeHttp
      .get<KnowledgeDocumentChunkListResponse>(`/document-parses/${uploadId}/chunks`, { params })
      .then((r) => ({
        document_id: r.data.document_id || '',
        total: r.data.total,
        items: r.data.items.map((chunk) => ({
          id: chunk.chunk_id,
          seq: chunk.seq_no,
          page_no: chunk.page_no ?? null,
          char_count: chunk.char_count,
          content: chunk.content,
        })),
      })),
}

const submitKnowledgeBuild = (
  uploadIds: string[],
  kbId?: string
): Promise<KnowledgeBuildBatchItem[]> => {
  const uniqueUploadIds = Array.from(new Set(uploadIds.filter(Boolean)))
  if (!uniqueUploadIds.length) return Promise.resolve([])

  return knowledgeHttp
    .post<KnowledgeBuildSubmitResponse>(
      '/indexing/build',
      {
        upload_ids: uniqueUploadIds,
        kb_id: kbId || undefined,
      }
    )
    .then((r) => {
      const resultMap = new Map(r.data.results.map((item) => [item.upload_id, item]))
      return uniqueUploadIds.map((uploadId) => {
        const item = resultMap.get(uploadId)
        const error = item?.error || item?.message
        const success = Boolean(item && item.status !== 'error' && !error)
        return {
          upload_id: item?.upload_id || uploadId,
          lightrag_status: success ? item?.status || 'building' : 'none',
          chunk_count: Number(item?.chunk_count || 0),
          success,
          error: success ? undefined : error || '知识构建未返回结果',
        }
      })
    })
}

export const KnowledgeBuildApi = {
  /**
   * 文档管理的构建接口提交 upload_id 列表。
   * 后端会根据正式上传表、文档表和切片表自行找到需要构建的数据，避免前端或 docqa 再读取知识管理主表。
   */
  triggerBatch: submitKnowledgeBuild,
  trigger: (uploadId: string): Promise<BuildResponse> =>
    submitKnowledgeBuild([uploadId]).then(([item]) => {
      if (!item?.success) {
        throw new Error(item?.error || '知识构建提交失败')
      }
      return item
    }),
  /**
   * 构建是后台异步执行的，通过专用状态端点获取逐 chunk 颗粒度的进度。
   * 保持文档管理工作区需要的返回结构，页面不直接感知后端构建实现细节。
   */
  status: (uploadId: string): Promise<BuildStatusResponse> =>
    knowledgeHttp
      .get<BuildStatusResponse>(`/indexing/build/status/${uploadId}`)
      .then((r) => r.data),
}

export const documentParseApiBundle = {
  kbApi: KnowledgeBaseApi,
  overviewApi: KnowledgeBaseApi.overview,
  documentCategoryApi: KnowledgeDocumentCategoryApi,
  uploadApi: KnowledgeUploadApi,
  parseApi: KnowledgeParseApi,
  buildApi: KnowledgeBuildApi,
}
