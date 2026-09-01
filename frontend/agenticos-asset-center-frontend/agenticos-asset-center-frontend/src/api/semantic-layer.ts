import { createHttp } from './http'

const http = createHttp({ baseURL: '/api/v1/semantic-models' })

// ── 类型定义 ──

export interface GenLogEntry {
  step: string
  message: string
  level: string
  timestamp?: string
}

/** 校验问题（五维 + 编译/类型感知共用） */
export interface ValidationIssue {
  level: string
  message: string
  code?: string
  suggestion?: string
  location?: {
    object?: string
    index?: number
    field?: string
  }
}

/** 编译级 dry-run 单指标检查结果 */
export interface CompileCheck {
  metric: string
  metric_type: string
  index: number
  ok: boolean
  sql: string
  error: string
}

/** 编译级 dry-run 结果（SQL 编译 + EXPLAIN 可执行性验证） */
export interface CompileValidationResult {
  model_id: string
  model_name: string
  total_checks: number
  checks: CompileCheck[]
  issues: ValidationIssue[]
  valid: boolean
}

/** 静态校验结果（必填字段 + 描述质量 + 指标/维度表达式） */
export interface StaticValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  schema_available: boolean
}

export interface SemanticModel {
  id: string
  name: string
  label_zh: string
  description: string | null
  dataset_id: string
  source_table: string
  category: string | null
  ontology_domain: string | null
  dimensions: Record<string, any>[]
  metrics: Record<string, any>[]
  relations: Record<string, any>[]
  dq_rules: Record<string, any>[]
  gen_status: 'idle' | 'generating' | 'graph_building' | 'error'
  gen_log: GenLogEntry[]
  owner_id: string | null
  owner_name: string | null
  is_public: boolean
  extra_config: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  total: number
  items: T[]
  limit: number
  offset: number
}

export interface SyncStatus {
  total_models: number
  total_metrics: number
  cache_valid: boolean
}

// ── API 客户端 ──

export const SemanticLayerApi = {
  // 模型 CRUD
  list: (params?: Record<string, any>) =>
    http.get('', { params }).then(r => r.data as PaginatedResponse<SemanticModel>),

  get: (id: string) =>
    http.get(`/${id}`).then(r => r.data as SemanticModel),

  create: (data: Partial<SemanticModel>) =>
    http.post('', data).then(r => r.data as SemanticModel),

  update: (id: string, data: Partial<SemanticModel>) =>
    http.patch(`/${id}`, data).then(r => r.data as SemanticModel),

  delete: (id: string) =>
    http.delete(`/${id}`),
  // 批量删除（不存在的 ID 自动跳过，errors 汇报缺失项）
  deleteBatch: (modelIds: string[]) =>
    http.post('/batch-delete', { model_ids: modelIds }).then(r => r.data as { deleted_count: number; errors: string[] }),


  // 指标操作
  addMetric: (modelId: string, metric: Record<string, any>) =>
    http.post(`/${modelId}/metrics`, metric).then(r => r.data as SemanticModel),

  updateMetric: (modelId: string, metricName: string, data: Record<string, any>) =>
    http.put(`/${modelId}/metrics/${metricName}`, data).then(r => r.data as SemanticModel),

  deleteMetric: (modelId: string, metricName: string) =>
    http.delete(`/${modelId}/metrics/${metricName}`).then(r => r.data as SemanticModel),

  // 维度操作
  addDimension: (modelId: string, dim: Record<string, any>) =>
    http.post(`/${modelId}/dimensions`, dim).then(r => r.data as SemanticModel),

  updateDimension: (modelId: string, dimName: string, data: Record<string, any>) =>
    http.put(`/${modelId}/dimensions/${dimName}`, data).then(r => r.data as SemanticModel),

  deleteDimension: (modelId: string, dimName: string) =>
    http.delete(`/${modelId}/dimensions/${dimName}`).then(r => r.data as SemanticModel),

  // 关系操作
  addRelation: (modelId: string, relation: Record<string, any>) =>
    http.post(`/${modelId}/relations`, relation).then(r => r.data as SemanticModel),

  updateRelation: (modelId: string, index: number, data: Record<string, any>) =>
    http.put(`/${modelId}/relations/${index}`, data).then(r => r.data as SemanticModel),

  deleteRelation: (modelId: string, index: number) =>
    http.delete(`/${modelId}/relations/${index}`).then(r => r.data as SemanticModel),

  // DQ 规则操作
  addDqRule: (modelId: string, rule: Record<string, any>) =>
    http.post(`/${modelId}/dq-rules`, rule).then(r => r.data as SemanticModel),

  updateDqRule: (modelId: string, index: number, data: Record<string, any>) =>
    http.put(`/${modelId}/dq-rules/${index}`, data).then(r => r.data as SemanticModel),

  deleteDqRule: (modelId: string, index: number) =>
    http.delete(`/${modelId}/dq-rules/${index}`).then(r => r.data as SemanticModel),

  // 设计器辅助
  getTableColumns: (modelId: string) =>
    http.get(`/${modelId}/table-columns`).then(r => r.data as { columns: Array<{ name: string; data_type: string; nullable: boolean; is_primary_key: boolean; mapped_as?: string }>; error?: string }),

  validateModel: (modelId: string) =>
    http.post(`/${modelId}/validate`).then(r => r.data as StaticValidationResult),

  // 自动生成模型描述（LLM 基于当前模型定义生成适用场景描述）
  generateDescription: (modelId: string) =>
    http.post(`/${modelId}/generate-description`).then(r => r.data as { description: string }),

  getRelatedModelsDimensions: (modelId: string) =>
    http.get(`/${modelId}/related-models-dimensions`).then(r => r.data as Array<{ model_name: string; model_label: string; dimensions: Array<{ name: string; label_zh: string; dim_type: string }> }>),

  getAllRelations: () =>
    http.get('/relations/all').then(r => r.data as Array<{
      index: number;
      source_model_id: string;
      source_model_name: string;
      source_model_label: string;
      source_expr: string;
      source_field_name: string;
      source_field_label: string;
      source_field_type: string;
      target_model_id: string;
      target_model_name: string;
      target_model_label: string;
      target_expr: string;
      target_field_name: string;
      target_field_label: string;
      target_field_type: string;
      relation_type: string;
      join_type: string;
      description: string;
    }>),

  getModelRelationsWithDetails: (modelId: string) =>
    http.get(`/${modelId}/relations-with-details`).then(r => r.data as Array<{
      index: number;
      source_model_id: string;
      source_model_name: string;
      source_model_label: string;
      source_expr: string;
      source_field_name: string;
      source_field_label: string;
      source_field_type: string;
      target_model_id: string;
      target_model_name: string;
      target_model_label: string;
      target_expr: string;
      target_field_name: string;
      target_field_label: string;
      target_field_type: string;
      relation_type: string;
      join_type: string;
      description: string;
    }>),

  // 全局指标列表
  listAllMetrics: (params?: Record<string, any>) =>
    http.get('/metrics', { params }).then(r => r.data),

  // 全局维度列表
  listAllDimensions: (params?: Record<string, any>) =>
    http.get('/dimensions', { params }).then(r => r.data),

  // 异步自动生成（立即返回，后台执行）
  autoGenerate: (datasetId: string, tableName: string) =>
    http.post('/initialize/auto-generate', { dataset_id: datasetId, table_name: tableName }).then(r => r.data as SemanticModel),

  // 异步重新生成
  regenerate: (modelId: string) =>
    http.post(`/${modelId}/regenerate`).then(r => r.data as SemanticModel),

  // 异步图谱构建
  syncGraph: (modelId: string) =>
    http.post(`/${modelId}/sync-graph`).then(r => r.data as SemanticModel),

  // 批量异步自动生成（一次调用处理多张表）
  autoGenerateBatch: (datasetId: string, tableNames: string[], autoDiscover = false) =>
    http.post('/initialize/auto-generate-batch', {
      dataset_id: datasetId,
      table_names: tableNames,
      auto_discover: autoDiscover,
    }).then(r => r.data as { batch_size: number; created: string[]; skipped: string[]; candidates_from_dcg: boolean }),

  // 获取候选表（供批量生成弹窗展示推荐列表）
  getAutoGenerateCandidates: (datasetId: string) =>
    http.get('/initialize/candidates', { params: { dataset_id: datasetId } }).then(r => r.data as Array<{
      table_name: string
      chinese_name: string
      column_count: number
      row_count: number
      has_pk: boolean
      has_fk: boolean
      numeric_cols: number
      has_existing_model: boolean
      score: number
      reasons: string[]
      column_summary: Array<{ name: string; chinese_name: string; data_type: string; is_pk: boolean }>
    }>),

  // 查询批量生成进度
  getBatchProgress: (datasetId: string) =>
    http.get('/initialize/batch-progress', { params: { dataset_id: datasetId } }).then(r => r.data as {
      total: number
      idle: number
      generating: number
      graph_building: number
      error: number
      models: Array<{
        id: string
        name: string
        label_zh: string
        source_table: string
        gen_status: string
        gen_log: Array<{ step: string; message: string; level: string }>
      }>
    }),

  // 校验
  checkSchemaChanges: (modelId: string) =>
    http.get(`/validation/schema-changes/${modelId}`).then(r => r.data),

  checkOrphanMetrics: (modelId: string) =>
    http.get(`/validation/orphan-metrics/${modelId}`).then(r => r.data),

  /** 数据集级批量校验：对数据集下所有语义模型执行五维校验
   * 大数据集模型多、表结构冷缓存时耗时长，超时放宽到 10 分钟（默认 30s 不够） */
  validateDataset: (datasetId: string) =>
    http.post(`/validation/dataset/${datasetId}`, undefined, { timeout: 600000 }).then(r => r.data as {
      dataset_id: string
      generated_at: string
      total_models: number
      models: Array<{
        model_id: string
        model_name: string
        model_label: string
        source_table: string
        schema_available: boolean
        categories: Array<{
          key: string
          label: string
          issues: Array<ValidationIssue>
          error_count: number
          warning_count: number
          info_count: number
          valid: boolean
        }>
        summary: {
          error_count: number
          warning_count: number
          info_count: number
          valid: boolean
        }
      }>
      summary: {
        error_count: number
        warning_count: number
        info_count: number
      }
    }),

  /** 编译级 dry-run：对模型每个可编译指标执行 SQL 编译 + EXPLAIN 可执行性验证 */
  validateModelCompile: (modelId: string) =>
    http.get(`/validation/compile/${modelId}`).then(r => r.data as CompileValidationResult),

  // 同步状态
  getSyncStatus: () =>
    http.get('/sync/status').then(r => r.data as SyncStatus),

  // SQL 预览
  previewSql: (modelId: string, params: Record<string, any>) =>
    http.post(`/${modelId}/preview-sql`, params).then(r => r.data),

  // 关系发现（同步，可能超时，推荐使用流式方法）
  discoverRelationships: (params: { dataset_ids?: string[] }) =>
    http.post('/relationships/discover', params).then(r => r.data as {
      candidates: Array<{
        source_model_name: string
        source_model_label: string
        source_table: string
        source_dim_name: string
        source_dim_label: string
        source_expr: string
        target_model_name: string
        target_model_label: string
        target_table: string
        target_dim_name: string
        target_dim_label: string
        target_expr: string
        confidence: number
        source: string
        reason: string
        relation_type: string
        join_type: string
        is_existing: boolean
      }>
      summary: { total: number; high_confidence: number; medium_confidence: number; low_confidence: number; new_count: number; existing_count: number }
    }),

  // SSE 流式关系发现（推荐，不会超时，支持实时进度）
  discoverRelationshipsStream: async (
    params: { dataset_ids?: string[] },
    callbacks: {
      onProgress: (layer: number, name: string, status: string, details: Record<string, any>) => void
      onResult: (result: {
        candidates: Array<{
          source_model_name: string
          source_model_label: string
          source_table: string
          source_dim_name: string
          source_dim_label: string
          source_expr: string
          target_model_name: string
          target_model_label: string
          target_table: string
          target_dim_name: string
          target_dim_label: string
          target_expr: string
          confidence: number
          source: string
          reason: string
          relation_type: string
          join_type: string
          is_existing: boolean
        }>
        summary: { total: number; high_confidence: number; medium_confidence: number; low_confidence: number; new_count: number; existing_count: number }
      }) => void
      onError: (error: string) => void
    }
  ): Promise<AbortController> => {
    const controller = new AbortController()

    // 在后台执行 fetch，通过回调返回结果
    ;(async () => {
      try {
        const response = await fetch('/api/v1/semantic-models/relationships/discover/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal,
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('无法读取响应流')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let eventType = ''
          let dataStr = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6)
            } else if (line === '' && eventType) {
              try {
                const data = JSON.parse(dataStr)
                if (eventType === 'progress') {
                  callbacks.onProgress(data.layer, data.name, data.status, data)
                } else if (eventType === 'result') {
                  callbacks.onResult(data)
                } else if (eventType === 'error') {
                  callbacks.onError(data.message || '未知错误')
                }
              } catch { /* 解析失败跳过 */ }
              eventType = ''
              dataStr = ''
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          callbacks.onError(err.message || '连接失败')
        }
      }
    })()

    return controller
  },

  confirmRelationships: (params: {
    confirmed: Array<{
      source_model_name: string
      target_model_name: string
      source_expr: string
      target_expr: string
      relation_type?: string
      join_type?: string
    }>
    rejected?: Array<{
      source_model_name: string
      target_model_name: string
      source_expr: string
      target_expr: string
    }>
  }) =>
    http.post('/relationships/confirm', params).then(r => r.data as { added: number; errors: string[] }),

  // ── 导入导出 ──

  /** 导出语义模型为 JSON 文件下载 */
  exportModels: (datasetId?: string) =>
    http.post('/export', { dataset_id: datasetId || null }, { responseType: 'blob' })
      .then(r => {
        const blob = r.data as Blob
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `semantic_models_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      }),

  /** 导入语义模型 JSON 文件 */
  importModels: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post('/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data as {
      imported: number
      overwritten: number
      skipped: number
      errors: string[]
      skipped_datasets: string[]
    })
  },
}
