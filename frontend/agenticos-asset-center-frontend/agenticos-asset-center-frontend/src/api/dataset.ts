/**
 * 数据集前端 API 客户端
 * 后端基路径：/v1/datasets（通过 vite proxy /api 转发到 Task API）
 */
import { createHttp } from './http'
import type { TablePreviewResponse } from './datasource'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/datasets`,
})

export interface DatasetItem {
  id: string
  name: string
  source: string
  datasource_id: string | null
  tables: string[] | null
  description: string | null
  owner_id: string | null
  owner_name: string | null
  is_public: boolean
  vector_sync_enabled: boolean
  created_at: string
  updated_at: string
}

export interface DatasetListResponse {
  total: number
  items: DatasetItem[]
  limit: number
  offset: number
}

export interface BizSource {
  id: string
  name: string
  type: string
  source_category: string
  description: string | null
}

export interface BizTable {
  table_name: string
  chinese_name?: string
}

export const DatasetApi = {
  list: (params?: { keyword?: string; limit?: number; offset?: number }) =>
    http.get<DatasetListResponse>('', { params }).then((r) => r.data),

  create: (payload: { name: string; datasource_id?: string; source: string; tables?: string[]; description?: string; is_public?: boolean; vector_sync_enabled?: boolean }) =>
    http.post<DatasetItem>('', payload).then((r) => r.data),

  get: (id: string) => http.get<DatasetItem>(`/${id}`).then((r) => r.data),

  update: (id: string, payload: Partial<DatasetItem>) =>
    http.patch<DatasetItem>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => http.delete(`/${id}`).then(() => true),

  listSources: () =>
    http.get<{ items: BizSource[] }>('/meta/sources').then((r) => r.data.items),

  listTables: (sourceName: string) =>
    http.get<{ items: BizTable[] }>(`/meta/sources/${sourceName}/tables`).then((r) => r.data.items),

  listTablesById: (datasourceId: string) =>
    http.get<{ items: BizTable[] }>(`/meta/sources-by-id/${datasourceId}/tables`).then((r) => r.data.items),

  // 获取数据集允许的表列表（按数据集白名单过滤）
  listTablesByDataset: (datasetId: string) =>
    http.get<{ items: BizTable[] }>(`/${datasetId}/tables`).then((r) => r.data.items),

  // 预览数据集白名单内表的数据（返回格式与数据源预览一致）
  previewTableData: (datasetId: string, tableName: string, limit = 1000) =>
    http.get<TablePreviewResponse>(`/${datasetId}/tables/${encodeURIComponent(tableName)}/data`, {
      params: { limit },
    }).then((r) => r.data),
}
