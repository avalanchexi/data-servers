import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/datacontext`,
})

export interface DomainInfo {
  id: string
  name: string
  type: 'ontology' | 'dataset'  // 本体模型 | 数据集
}

export interface SyncLogEntry {
  step: string
  message: string
  level: string
  timestamp?: string
}

export interface DatasetSyncInfo {
  id: string
  name: string
  tables: string[]
  status: string
  synced_at: string | null
  updated_at: string | null
  sync_log: SyncLogEntry[]
}

export interface OntologyDomainInfo {
  name: string
  label_zh: string
  source: string
  class_count: number
  entity_count: number
  metric_count: number
  status: string
  synced_at: string | null
  updated_at: string | null
}

export interface FullSyncStatus {
  status: string
  synced_at: string | null
  updated_at: string | null
  error_msg?: string | null
}

export interface SyncStatus {
  total_datasets: number
  synced_datasets: number
  stale_datasets: number
  stale_dataset_ids: string[]
  datasets: DatasetSyncInfo[]
  ontology_synced: boolean
  last_ontology_sync: string | null
  ontology_domains: OntologyDomainInfo[]
  full_sync?: FullSyncStatus | null
  error?: string
}

export interface SyncResult {
  status?: string
  message?: string
  datasets_synced?: number
  datasets_skipped?: number
  datasets?: number
  tables?: number
  columns?: number
  classes?: number
  entities?: number
  relationships?: number
  metrics?: number
  ontology_changed?: boolean
  error?: string
}

export interface ExploreResult {
  type: string
  name: string
  chinese_name?: string
  description?: string
  dataset_id?: string
  dataset_name?: string
  table_name?: string
  value?: string
  data_type?: string
  domain?: string
  metric_type?: string
  formula?: string
  canonical_name?: string
  label_zh?: string
  labels: string[]
  source: string
  similarity?: number
  rrf_score?: number
}

export interface LineageResult {
  source_table: string
  source_column: string
  target_table: string
  target_column: string
  relation_type: string
}

export interface FkEdge {
  source_table: string
  target_table: string
}

export interface MetricResult {
  type: string
  name: string
  canonical_name: string
  chinese_name: string
  label_zh: string
  description: string
  definition: string
  metric_type: string
  domain: string
  dataset_id?: string
  formula: string
  labels: string[]
  source: string
  model_name?: string
  model_label?: string
}

export interface TableSchema {
  table: string
  columns: string
  fk_relations: string
  table_name?: string
}

export interface SchemaTreeColumn {
  name: string
  chinese_name?: string
  data_type?: string
  is_pk?: boolean
  ontology_class?: string
  ontology_property?: string
}

export interface SchemaTreeTable {
  type: string
  table: string
  name: string
  document?: string
  dataset_id: string
  dataset_name: string
  columns: SchemaTreeColumn[]
  fk_relations?: Array<{
    source_table: string
    source_column: string
    target_table: string
    target_column: string
  }>
  chinese_name?: string
  row_count?: number
}

export interface SchemaTreeDataset {
  dataset_id: string
  dataset_name: string
  tables: SchemaTreeTable[]
}

export interface SchemaTreeResponse {
  dataset_id: string | null
  datasets: SchemaTreeDataset[]
}

export interface CronJobInfo {
  id: string
  name: string
  schedule: string
  interval_minutes: number
  enabled: boolean
  last_run_at: string | null
}

// ── 血缘子图查询参数 ──────────────────────────────────

export interface LineageSubgraphParams {
  node_name: string
  node_type: string  // Table|Column|SemanticModel|Metric|Class|Entity
  direction?: 'upstream' | 'downstream' | 'both'
  max_depth?: number  // 1-3
  dataset_id?: string
}

// ── DCG 子图类型 ──────────────────────────────────────

export interface SubgraphNode {
  type: string
  name: string
  chinese_name?: string
  description?: string
  dataset_id?: string
  dataset_name?: string
  table_name?: string
  value?: string
  data_type?: string
  domain?: string
  labels: string[]
  source: string
  // Table 节点附加统计信息
  row_count?: number
  stats_summary?: Record<string, any>
  // 血缘影响标注（由 getLineageSubgraph 返回）
  lineageRole?: 'seed' | 'upstream' | 'downstream' | 'both'
  lineageDepth?: number
}

export interface SubgraphEdge {
  source: string
  target: string
  edgeType: string
  label: string
  sourceType: string
  targetType: string
  dataset_id?: string
  sourceTable?: string
  targetTable?: string
}

// 血缘影响摘要 — 后端在统一图上计算，前端仅渲染
interface LineageImpactItem {
  name: string      // 原始 name（用于重新以该节点为 seed 探索）
  type: string
  label: string     // 展示名（chinese_name 兜底）
  depth: number
}

export interface LineageImpact {
  seed: { name: string; type: string; label: string } | null
  upstream: { total: number; byType: Record<string, number>; items: LineageImpactItem[] }
  downstream: { total: number; byType: Record<string, number>; items: LineageImpactItem[] }
  riskLevel: 'low' | 'medium' | 'high'
}

export interface SubgraphResult {
  dataset_id: string | null
  nodes: SubgraphNode[]
  edges: SubgraphEdge[]
  ontologyNodes: SubgraphNode[]
  ontologyEdges: SubgraphEdge[]
}

// ── API ──────────────────────────────────────────────────

export const DataContextApi = {
  // 同步管理
  getSyncStatus: () =>
    http.get<SyncStatus>('/sync/status').then((r) => r.data),

  runIncrementalSync: (force: boolean = false) =>
    http.post<SyncResult>('/sync/incremental', null, { params: { force } }).then((r) => r.data),

  runFullSync: () =>
    http.post<SyncResult>('/sync/full').then((r) => r.data),
  // 单个数据集同步
  syncDataset: (datasetId: string) =>
    http.post<SyncResult>(`/sync/datasets/${datasetId}`).then((r) => r.data),

  // 单个本体领域同步
  syncOntologyDomain: (domainName: string) =>
    http.post<{ status: string; domain: string; result: Record<string, number> }>(
      `/sync/ontology/${encodeURIComponent(domainName)}`,
    ).then((r) => r.data),

  // 图谱探索
  explore: (params: { query: string; dataset_id?: string; max_results?: number }) =>
    http
      .get<{ query: string; dataset_id: string | null; total: number; results: ExploreResult[] }>('/explore', { params })
      .then((r) => r.data),

  // DCG 子图
  getSubgraph: (dataset_id?: string, include_dimension_members: boolean = false) =>
    http
      .get<SubgraphResult>('/subgraph', { params: { ...(dataset_id ? { dataset_id } : {}), include_dimension_members } })
      .then((r) => r.data),

  getFkEdges: (datasetId: string) =>
    http
      .get<{ dataset_id: string; total: number; edges: FkEdge[] }>('/explore/fk-edges', { params: { dataset_id: datasetId } })
      .then((r) => r.data),

  listDomains: () =>
    http.get<{ domains: DomainInfo[]; total: number }>('/domains').then((r) => r.data),

  // 跨模态搜索
  search: (params: { term: string; node_type?: string; limit?: number }) =>
    http
      .get<{ term: string; type: string; total: number; results: Record<string, unknown>[] }>('/search', { params })
      .then((r) => r.data),

  // 表结构查询
  getSchemaTree: (dataset_id?: string) =>
    http
      .get<SchemaTreeResponse>('/schema/tree', { params: dataset_id ? { dataset_id } : {} })
      .then((r) => r.data),

  getSchema: (table_name: string, dataset_name?: string) =>
    http
      .get<TableSchema>('/schema', { params: { table_name, dataset_name } })
      .then((r) => r.data),

  // 血缘追踪
  getLineage: (column_name: string, table_name?: string, direction: string = 'both') =>
    http
      .get<{ column: string; table: string; direction: string; total: number; results: LineageResult[] }>('/lineage', {
        params: { column_name, table_name, direction },
      })
      .then((r) => r.data),

  // 血缘影响子图（统一图上下游遍历，返回影响摘要）
  getLineageSubgraph: (params: LineageSubgraphParams) =>
    http
      .get<SubgraphResult & { node_name: string; node_type: string; direction: string; max_depth: number; dataset_id: string | null; impact: LineageImpact }>('/lineage/subgraph', { params })
      .then((r) => r.data),

  // 指标浏览
  getMetrics: (domain?: string) =>
    http
      .get<{ domain: string | null; total: number; metrics: MetricResult[] }>('/metrics', { params: { domain } })
      .then((r) => r.data),

  // CRON 定时任务
  getCronJobs: () =>
    http.get<{ jobs: CronJobInfo[] }>('/cron').then((r) => r.data),

  updateCronJob: (id: string, payload: { interval_minutes?: number; enabled?: boolean }) =>
    http.put<CronJobInfo>(`/cron/${id}`, payload).then((r) => r.data),

  toggleCronJob: (id: string) =>
    http.post<CronJobInfo>(`/cron/${id}/toggle`).then((r) => r.data),

}
