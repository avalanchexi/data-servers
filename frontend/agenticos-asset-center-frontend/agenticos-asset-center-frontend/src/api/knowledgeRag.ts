/**
 * Knowledge RAG 前端 API 客户端。
 *
 * 知识管理页面统一使用 `/v1/knowledge/*` 正式接口。文档上传、解析和构建
 * 由 `knowledgeDocumentChain.ts` 适配到同一正式接口，不再保留 `/v1/kb` 客户端。
 */
import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const knowledgeHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/knowledge`,
  timeout: 60000,
})

// -------------------- 类型 --------------------
export interface KnowledgeBase {
  id: string
  name: string
  description: string | null
  owner_id: string | null
  owner_name: string | null
  default_parser: string
  is_public: boolean
  is_enabled: boolean
  status: string
  document_count: number
  chunk_count: number
  storage_size_bytes: number
  settings: Record<string, unknown> | null
  parser_config?: Record<string, unknown> | null
  /** @deprecated 仅作为过渡兼容字段，正式链路请使用 parser_config。 */
  ragflow_parser_config?: Record<string, unknown> | null
  last_sync_at?: string | null
  created_at: string
  updated_at: string
}

export interface KbListResponse {
  total: number
  items: KnowledgeBase[]
  limit: number
  offset: number
}

export interface UploadItem {
  id: string
  kb_id: string
  kb_document_category_id?: string | null
  uploader_id: string | null
  uploader_name: string | null
  original_name: string
  display_name?: string | null
  stored_path: string
  mime: string | null
  size_bytes: number
  sha256: string | null
  status: 'uploaded' | 'parsing' | 'parsed' | 'failed' | string
  progress: number
  error_message: string | null
  retry_count: number
  /** @deprecated 当前页面仍用作解析引擎状态提示，后续可重命名为 parser_run_status。 */
  ragflow_upload_status?: string | null
  document_id?: string | null
  chunk_count?: number
  vector_count?: number
  vector_status?: 'none' | 'pending' | 'vectorizing' | 'vectorized' | 'failed' | string
  vector_progress?: number
  vector_error_message?: string | null
  parser_config?: Record<string, unknown> | null
  parser_config_source?: 'kb' | 'document' | string
  parser_plan?: Record<string, unknown> | null
  uploaded_at: string
  updated_at: string | null
  effective_time: string | null
  is_enabled: boolean
  started_at: string | null
  finished_at: string | null
  lightrag_status: 'none' | 'building' | 'built' | 'failed' | string
}

export interface UploadListResponse {
  total: number
  items: UploadItem[]
  limit: number
  offset: number
}

export interface UpdateEffectiveTimeRequest {
  effective_time: string | null
}

export interface ParseResult {
  upload_id: string
  status: string
  document_id?: string | null
  chunks?: number | null
  error?: string | null
}

export interface ParseProgress {
  upload_id: string
  status: string
  stage: string | null
  progress: number
  error_message: string | null
  ragflow_run?: string | null
  ragflow_progress_msg?: string | null
}

export interface ChunkPreview {
  id: string
  seq: number
  page_no: number | null
  char_count: number
  content: string
}

export interface ChunkPreviewResponse {
  document_id: string
  total: number
  items: ChunkPreview[]
}

export interface BuildResponse {
  upload_id: string
  lightrag_status: string
  chunk_count: number
}

export interface BuildStatusResponse {
  upload_id: string
  lightrag_status: string
  chunk_total: number
  chunk_processed: number
  chunk_failed: number
}

export interface DocumentCategoryTreeNode {
  id: string
  knowledge_base_id: string
  parent_id: string | null
  name: string
  code: string | null
  path: string
  depth: number
  sort_order: number
  is_root: number
  status: string
  if_delete: number
  business_attrs: Record<string, unknown>
  metadata: Record<string, unknown>
  description: string | null
  document_count: number
  created_at: string | null
  updated_at: string | null
  children: DocumentCategoryTreeNode[]
}

export interface DocumentCategoryTreeResponse {
  knowledge_base_id: string
  items: DocumentCategoryTreeNode[]
}

export type DocumentCategoryResponse = Omit<DocumentCategoryTreeNode, 'children'>

export interface DocumentCategoryCreatePayload {
  knowledge_base_id: string
  parent_id: string
  name: string
  description?: string | null
  sort_order?: number
  business_attrs?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface DocumentCategoryUpdatePayload {
  document_category_id: string
  name?: string
  description?: string | null
  sort_order?: number
  business_attrs?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface DocumentMoveCategoryPayload {
  document_id: string
  kb_document_category_id: string
}

export interface UploadMoveCategoryPayload {
  upload_id: string
  kb_document_category_id: string
}

export interface UploadUpdatePayload {
  upload_id: string
  original_name?: string
  kb_document_category_id?: string
}

export interface KnowledgeDocumentResponse {
  id: string
  knowledge_base_id: string
  kb_document_category_id: string | null
  title: string
  source: string | null
  status: string
  size_bytes: number
  page_count: number
  chunk_count: number
  created_at: string | null
  updated_at: string | null
}

export interface KnowledgeUploadResponse {
  id: string
  knowledge_base_id: string
  kb_document_category_id: string | null
  document_id: string | null
  original_name: string
  display_name?: string | null
  is_enabled?: boolean
  status: string
  uploaded_at: string | null
  updated_at: string | null
}

// -------------------- Document Categories --------------------
export const DocumentCategoryApi = {
  tree: (knowledgeBaseId: string) =>
    knowledgeHttp
      .get<DocumentCategoryTreeResponse>('/document-categories/tree', {
        params: { knowledge_base_id: knowledgeBaseId },
      })
      .then((r) => r.data),
  create: (payload: DocumentCategoryCreatePayload) =>
    knowledgeHttp.post<DocumentCategoryResponse>('/document-categories', payload).then((r) => r.data),
  update: (payload: DocumentCategoryUpdatePayload) =>
    knowledgeHttp.patch<DocumentCategoryResponse>('/document-categories', payload).then((r) => r.data),
  remove: (documentCategoryId: string) =>
    knowledgeHttp
      .delete('/document-categories', {
        params: { document_category_id: documentCategoryId },
      })
      .then(() => true),
  moveDocument: (payload: DocumentMoveCategoryPayload) =>
    knowledgeHttp.patch<KnowledgeDocumentResponse>('/documents/document-category', payload).then((r) => r.data),
  moveUpload: (payload: UploadMoveCategoryPayload) =>
    knowledgeHttp.patch<KnowledgeUploadResponse>('/uploads/document-category', payload).then((r) => r.data),
  updateUpload: (payload: UploadUpdatePayload) =>
    knowledgeHttp.patch<KnowledgeUploadResponse>('/uploads', payload).then((r) => r.data),
}

// -------------------- KB --------------------
export const KbApi = {
  list: (params?: { keyword?: string; status?: string; is_enabled?: boolean; limit?: number; offset?: number }) =>
    knowledgeHttp.get<KbListResponse>('/knowledge-bases', { params }).then((r) => r.data),
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
  remove: (id: string) => knowledgeHttp.delete(`/knowledge-bases/${id}`).then(() => true),
  /** 刷新所有知识库的存储容量（登录后调用） */
  refreshAllStorage: () =>
    knowledgeHttp.post<{ updated: number; errors: unknown[] }>('/knowledge-bases/refresh-all-storage').then((r) => r.data),
}

export const formatBytes = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  // 后端返回 naive datetime 可能包含微秒（6位小数），截断至毫秒（3位）以符合 ECMAScript
  // 标准日期格式（YYYY-MM-DDTHH:mm:ss.sss），确保浏览器统一按本地时间解析
  const normalized = dateStr.replace(/\.(\d{3})\d+/, '.$1')
  const date = new Date(normalized)
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// -------------------- 向量/图谱浏览 --------------------
export interface VectorChunkItem {
  id: string
  workspace: string
  full_doc_id: string | null
  chunk_order_index: number | null
  tokens: number | null
  content: string | null
  file_path: string | null
  source_files: VectorSourceFile[]
  model_name: string | null
  create_time: string | null
  update_time: string | null
}

export interface VectorChunkListResponse {
  total: number
  items: VectorChunkItem[]
  limit: number
  offset: number
}

export interface VectorEntityItem {
  id: string
  workspace: string
  entity_name: string | null
  entity_type: string
  content: string | null
  chunk_ids: string[] | null
  file_path: string | null
  source_files: VectorSourceFile[]
  model_name: string | null
  create_time: string | null
  update_time: string | null
}

export interface VectorEntityListResponse {
  total: number
  items: VectorEntityItem[]
  limit: number
  offset: number
}

export interface VectorRelationItem {
  id: string
  workspace: string
  source_id: string | null
  target_id: string | null
  content: string | null
  chunk_ids: string[] | null
  file_path: string | null
  source_files: VectorSourceFile[]
  model_name: string | null
  create_time: string | null
  update_time: string | null
}

export interface VectorRelationListResponse {
  total: number
  items: VectorRelationItem[]
  limit: number
  offset: number
}

export interface VectorSourceFile {
  document_id: string
  file_name: string
}

export interface VectorStats {
  chunk_count: number
  entity_count: number
  relation_count: number
}

export interface GraphEntityItem {
  name: string
  entity_type: string
  description: string
  source_id: string
  chunk_ids: string[]
  file_path: string
  source_files?: VectorSourceFile[]
}

export interface GraphRelationItem {
  source: string
  relation: string
  target: string
  weight: number
  chunk_ids: string[]
  file_path: string
  source_files?: VectorSourceFile[]
}

export interface GraphEntitiesResponse {
  total: number
  items: GraphEntityItem[]
  limit: number
  offset: number
}

export interface GraphRelationsResponse {
  total: number
  items: GraphRelationItem[]
  limit: number
  offset: number
}

export interface GraphStats {
  entity_count: number
  relation_count: number
  entity_type_distribution: Record<string, number>
  relation_type_distribution: Record<string, number>
}

export const BrowseApi = {
  // 向量
  vectorStats: (kbId: string) =>
    knowledgeHttp.get<VectorStats>('/retrieval/vector/stats', { params: { kb_id: kbId } }).then((r) => r.data),
  vectorChunks: (kbId: string, params?: { keyword?: string; document_id?: string; limit?: number; offset?: number }) =>
    knowledgeHttp.get<VectorChunkListResponse>('/retrieval/vector/chunks', { params: { kb_id: kbId, ...params } }).then((r) => r.data),
  vectorEntities: (kbId: string, params?: { keyword?: string; document_id?: string; limit?: number; offset?: number }) =>
    knowledgeHttp.get<VectorEntityListResponse>('/retrieval/vector/entities', { params: { kb_id: kbId, ...params } }).then((r) => r.data),
  vectorRelations: (kbId: string, params?: { keyword?: string; document_id?: string; limit?: number; offset?: number }) =>
    knowledgeHttp.get<VectorRelationListResponse>('/retrieval/vector/relations', { params: { kb_id: kbId, ...params } }).then((r) => r.data),

  // 图谱
  graphStats: (kbId: string) =>
    knowledgeHttp.get<GraphStats>('/retrieval/graph/stats', { params: { kb_id: kbId } }).then((r) => r.data),
  graphEntities: (kbId: string, params?: { keyword?: string; limit?: number; offset?: number }) =>
    knowledgeHttp.get<GraphEntitiesResponse>('/retrieval/graph/entities', { params: { kb_id: kbId, ...params } }).then((r) => r.data),
  graphRelations: (kbId: string, params?: { keyword?: string; limit?: number; offset?: number }) =>
    knowledgeHttp.get<GraphRelationsResponse>('/retrieval/graph/relations', { params: { kb_id: kbId, ...params } }).then((r) => r.data),
}

// -------------------- 知识库 & 文档管理（新接口 /v1/knowledge） --------------------
export interface KnowledgeDocumentItem {
  upload_file_id: string
  knowledge_base_id: string
  kb_document_category_id?: string | null
  document_id?: string | null
  file_object_id?: string | null
  upload_status: string
  original_name: string
  display_name: string | null
  content_type: string | null
  size_bytes: number
  content_sha256?: string | null
  storage_status: string
  if_enable?: number | null
  is_enabled?: boolean | null
  if_delete: number
  create_tm: string
  modify_tm: string
}

export interface KnowledgeDocumentListResponse {
  total: number
  items: KnowledgeDocumentItem[]
  limit: number
  offset: number
}

export const KnowledgeKbApi = {
  list: (params?: { keyword?: string; status?: string; is_enabled?: boolean; limit?: number; offset?: number }) =>
    knowledgeHttp.get<KbListResponse>('/knowledge-bases', { params }).then((r) => r.data),
}

export const KnowledgeDocumentApi = {
  list: (params?: { knowledge_base_id?: string; upload_status?: string; parse_status?: string; is_enabled?: boolean; keyword?: string; limit?: number; offset?: number }) =>
    knowledgeHttp.get<KnowledgeDocumentListResponse>('/document-uploads', { params }).then((r) => r.data),
}

// -------------------- 召回测试 --------------------
export type RecallMode = 'naive' | 'local' | 'global' | 'hybrid' | 'mix'

export interface RecallRequest {
  kb_id?: string
  query: string
  mode: RecallMode
  top_k?: number
  only_context?: boolean
}

export interface RecallResponse {
  status: string
  error?: string | null
  query: string
  kb_id: string | null
  mode: RecallMode
  answer?: string | null
  citations: Record<string, unknown>[]
  entities: Record<string, unknown>[]
  relations: Record<string, unknown>[]
  graph_evidence: Record<string, unknown>[]
  duration_seconds?: number
  fallback?: Record<string, unknown> | null
  warnings?: string[]
}

export interface RecommendQuestionItem {
  question: string
  reason?: string
  evidence?: string
  source_document?: string
}

export interface RecommendQuestionsRequest {
  kb_id: string
  count?: number
}

export interface RecommendQuestionsResponse {
  kb_id: string
  questions: RecommendQuestionItem[]
  generated_by: 'llm'
}

export interface RecallTestHistoryItem {
  id: string
  kb_id: string
  kb_name?: string | null
  user_id: string
  username?: string | null
  query: string
  mode: RecallMode
  method_label?: string | null
  top_k: number
  hit_count: number
  duration_ms?: number | null
  status: 'success' | 'empty' | 'failed'
  error_message?: string | null
  result_summary?: Record<string, unknown> | null
  trace_summary?: Record<string, unknown> | null
  delete_tm?: string | null
  if_delete?: number
  tenant_id?: string
  creator?: string | null
  modifier?: string | null
  create_tm?: string | null
  modify_tm?: string | null
}

export interface RecallTestHistoryListResponse {
  total: number
  items: RecallTestHistoryItem[]
  limit: number
  offset: number
}

export interface CreateRecallTestHistoryRequest {
  kb_id: string
  kb_name?: string | null
  query: string
  mode: RecallMode
  method_label?: string | null
  top_k?: number
  hit_count: number
  duration_ms?: number | null
  status?: 'success' | 'empty' | 'failed'
  error_message?: string | null
  result_summary?: Record<string, unknown> | null
  trace_summary?: Record<string, unknown> | null
}

export const RecallApi = {
  search: (payload: RecallRequest) =>
    knowledgeHttp.post<RecallResponse>('/retrieval/search', { ...payload, only_context: true }).then((r) => r.data),
  recommendQuestions: (payload: RecommendQuestionsRequest) =>
    knowledgeHttp.post<RecommendQuestionsResponse>('/retrieval/recommend-questions', payload).then((r) => r.data),
  listRecallTestHistory: (params?: { kb_id?: string; limit?: number; offset?: number }) =>
    knowledgeHttp.get<RecallTestHistoryListResponse>('/retrieval/recall-test-history', { params }).then((r) => r.data),
  createRecallTestHistory: (payload: CreateRecallTestHistoryRequest) =>
    knowledgeHttp.post<RecallTestHistoryItem>('/retrieval/recall-test-history', payload).then((r) => r.data),
  removeRecallTestHistory: (id: string) =>
    knowledgeHttp.delete(`/retrieval/recall-test-history/${id}`).then(() => true),
}
