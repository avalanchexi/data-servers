import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/ontology`,
})

// ── 新类型定义 ──────────────────────────────────────────────

export interface ClassDef {
  id: string
  name: string
  domain: string
  label_zh: string | null
  description: string | null
  parent_class_id: string | null
  is_abstract: boolean
  attributes?: Record<string, unknown>[]
  enums?: Record<string, unknown>[]
  semantics?: Record<string, unknown>
}

export interface EntityDef {
  id: string
  class_id?: string | null
  class_name?: string
  name: string
  aliases: string[]
  properties: Record<string, unknown>
  extraction_confidence: number
  is_verified: boolean
  source_chunk_ids?: string[]
  source_doc_ids?: string[]
  created_at?: string | null
  updated_at?: string | null
  embedding?: number[]
}

export interface RelationshipDef {
  id: string
  subject_entity_id?: string | null
  subject_entity_name?: string
  predicate: string
  object_entity_id?: string | null
  object_entity_name?: string
  properties: Record<string, unknown>
  confidence: number
  is_verified: boolean
}

export interface MetricDef {
  id: string
  canonical_name: string
  label_zh: string
  aliases: string[]
  definition: string
  formula: string | null
  source_columns: string[]
  metric_type: string
  domain: string | null
  owner: string | null
  version: string
  expected_range: string | null
}

export interface DomainInfo {
  domain: string
  label_zh?: string
  description?: string
  source: string
  entity_count: number
  relationship_count: number
  metric_count: number
  created_at?: string
  updated_at?: string
}

export interface DomainFullData {
  domain_info: DomainInfo
  classes: ClassDef[]
  entities: EntityDef[]
  relationships: RelationshipDef[]
  metric_definitions: MetricDef[]
  alignments?: AlignmentDef[]
  constraints?: ConstraintDef[]
  cross_domains?: CrossDomainDef[]
}

export interface AlignmentDef {
  id: string
  source_class_id: string
  target_class_id: string
  alignment_type: string
  confidence: number
  mapping_properties: Record<string, unknown>
  is_verified: boolean
  verified_by: string | null
  created_at: string | null
}

export interface ConstraintDef {
  [key: string]: unknown
}

export interface CrossDomainDef {
  [key: string]: unknown
}

// ── 兼容别名（供 OntologyGraph 等旧引用使用）──

export type OntologyClass = ClassDef
export type OntologyEntity = EntityDef
export type OntologyRelationship = RelationshipDef
export type OntologyMetric = MetricDef

// ── 保留的旧类型 ──────────────────────────────────────────

export interface DiagnosisCheck {
  name: string
  score: number
  weight: number
  issues: string[]
  suggestions: string[]
}

export interface DiagnosisReport {
  domain: string
  total_score: number
  level: string
  checks: DiagnosisCheck[]
  suggestions: string[]
}

export interface OntologyStats {
  total_classes: number
  total_entities: number
  total_relations: number
  entities_by_class: Record<string, number>
  orphan_entities: number
}

export interface SchemaGenerateResult {
  status?: string
  message?: string
  imported?: { name: string; status: string; reason?: string }[]
  created?: { name: string; status: string; reason?: string }[]
  created_classes?: { name: string; status: string }[]
  domain: string
  total: number
  relationships?: { predicate: string; description: string }[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit?: number
  offset?: number
}

// ── 常量 ──────────────────────────────────────────────────

export const METRIC_TYPES = [
  { value: 'ratio', label: '比率' },
  { value: 'count', label: '计数' },
  { value: 'sum', label: '求和' },
  { value: 'average', label: '平均值' },
  { value: 'custom', label: '自定义' },
] as const

export const DIAGNOSIS_LEVEL_LABELS: Record<string, string> = {
  excellent: '优秀',
  good: '良好',
  fair: '一般',
  poor: '较差',
}

export const DIAGNOSIS_LEVEL_COLORS: Record<string, string> = {
  excellent: '#22c55e',
  good: '#3b82f6',
  fair: '#f59e0b',
  poor: '#ef4444',
}

// ── API ───────────────────────────────────────────────────

export const OntologyApi = {

  // ── 领域管理 ──

  listDomains: () =>
    http.get<{ domains: DomainInfo[] }>('/domains').then((r) => r.data),

  getDomain: (domain: string) =>
    http.get<DomainFullData>(`/domains/${encodeURIComponent(domain)}`).then((r) => r.data),

  createDomain: (payload: { domain: string; label_zh?: string; description?: string; source?: string }) =>
    http.post('/domains', payload).then((r) => r.data),

  deleteDomain: (domain: string) =>
    http.delete(`/domains/${encodeURIComponent(domain)}`).then((r) => r.data),

  // ── 全量更新（以 domain 为粒度）──

  updateClasses: (domain: string, classes: ClassDef[]) =>
    http.put(`/domains/${encodeURIComponent(domain)}/classes`, { classes }).then((r) => r.data),

  updateEntities: (domain: string, entities: EntityDef[]) =>
    http.put(`/domains/${encodeURIComponent(domain)}/entities`, { entities }).then((r) => r.data),

  updateRelationships: (domain: string, relationships: RelationshipDef[]) =>
    http.put(`/domains/${encodeURIComponent(domain)}/relationships`, { relationships }).then((r) => r.data),

  updateMetrics: (domain: string, metrics: MetricDef[]) =>
    http.put(`/domains/${encodeURIComponent(domain)}/metrics`, { metric_definitions: metrics }).then((r) => r.data),

  // ── Schema 生成（三种方式）──

  importLinkML: (file: File, domain?: string) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<SchemaGenerateResult>(
      `/schema/import-linkml?domain=${encodeURIComponent(domain || 'imported')}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data)
  },

  generateFromRAG: (payload: { kb_ids: string[]; domain?: string; max_chunks?: number }) =>
    http.post<SchemaGenerateResult>('/schema/generate-from-rag', payload).then((r) => r.data),

  generateCustom: (payload: { domain: string; classes: Record<string, unknown>[] }) =>
    http.post<SchemaGenerateResult>('/schema/generate-custom', payload).then((r) => r.data),

  // ── 诊断与统计 ──

  runDiagnosis: (domain: string) =>
    http.get<DiagnosisReport>(`/diagnosis/${encodeURIComponent(domain)}`).then((r) => r.data),

  getStats: (domain?: string) =>
    http.get<OntologyStats>('/stats', { params: domain ? { domain } : {} }).then((r) => r.data),

  // ── 跨域对齐 ──

  runAlignment: (payload: { source_domain: string; target_domain: string; threshold?: number }) =>
    http.post('/alignment/run', payload).then((r) => r.data),

  // ── 兼容方法（供 OntologyGraph 等旧引用使用，内部转为 getDomain 调用）──

  listClasses: async (domain?: string): Promise<PaginatedResponse<ClassDef>> => {
    if (!domain) return { items: [], total: 0 }
    const data = await OntologyApi.getDomain(domain)
    return { items: data.classes, total: data.classes.length }
  },

  listEntities: async (params?: {
    query?: string
    class_id?: string
    domain?: string
    min_confidence?: number
    is_verified?: boolean
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<EntityDef>> => {
    if (!params?.domain) return { items: [], total: 0 }
    const data = await OntologyApi.getDomain(params.domain)
    let items: EntityDef[] = data.entities
    if (params.class_id) items = items.filter((e) => e.class_id === params.class_id)
    if (params.query) {
      const q = params.query.toLowerCase()
      items = items.filter(
        (e) => e.name.toLowerCase().includes(q) || e.aliases.some((a) => a.toLowerCase().includes(q)),
      )
    }
    const minConf = params.min_confidence
    if (minConf !== undefined) items = items.filter((e) => e.extraction_confidence >= minConf)
    if (params.is_verified !== undefined) items = items.filter((e) => e.is_verified === params.is_verified)
    const total = items.length
    const offset = params.offset || 0
    const limit = params.limit || total
    return { items: items.slice(offset, offset + limit), total }
  },

  listRelationships: async (params?: {
    subject_entity_id?: string
    predicate?: string
    object_entity_id?: string
    domain?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<RelationshipDef>> => {
    if (!params?.domain) return { items: [], total: 0 }
    const data = await OntologyApi.getDomain(params.domain)
    let items: RelationshipDef[] = data.relationships
    if (params.subject_entity_id) items = items.filter((r) => r.subject_entity_id === params.subject_entity_id)
    if (params.predicate) items = items.filter((r) => r.predicate === params.predicate)
    if (params.object_entity_id) items = items.filter((r) => r.object_entity_id === params.object_entity_id)
    const total = items.length
    const offset = params.offset || 0
    const limit = params.limit || total
    return { items: items.slice(offset, offset + limit), total }
  },

  // ── 指标管理（基于 domain 全量数据的便捷封装）──

  listMetrics: async (params?: {
    query?: string
    domain?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<MetricDef>> => {
    if (!params?.domain) return { items: [], total: 0 }
    const data = await OntologyApi.getDomain(params.domain)
    let items: MetricDef[] = data.metric_definitions || []
    if (params.query) {
      const q = params.query.toLowerCase()
      items = items.filter(
        (m) => m.label_zh.toLowerCase().includes(q) || m.canonical_name.toLowerCase().includes(q) || m.definition.toLowerCase().includes(q),
      )
    }
    const total = items.length
    const offset = params.offset || 0
    const limit = params.limit || total
    return { items: items.slice(offset, offset + limit), total }
  },

  // ── 图谱（供 OntologyGraph 使用，端点保持不变）──

  getGraphData: (limit = 500, domain?: string) =>
    http.get<{
      vertices: Record<string, unknown>[]
      edges: Record<string, unknown>[]
      total_vertices: number
      total_edges: number
      error?: string
    }>('/graph/data', { params: domain ? { limit, domain } : { limit } }).then((r) => r.data),

  syncGraph: () =>
    http.post<{ classes: number; entities: number; relationships: number }>('/graph/sync').then((r) => r.data),

  getVectorLayout: (domain?: string) =>
    http.get<{ positions: Record<string, [number, number]> }>('/graph/vector-layout', { params: { domain } }).then((r) => r.data),

  // ── 初始化 ──

  initialize: () =>
    http.post<{ status: string; message: string; started_at: string }>('/initialize').then((r) => r.data),

  getInitializeStatus: () =>
    http.get<{ running: boolean; started_at: string | null; result: unknown; error: string | null }>('/initialize/status').then((r) => r.data),
}
