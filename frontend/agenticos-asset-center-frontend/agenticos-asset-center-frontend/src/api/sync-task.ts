import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/sync-tasks`,
})

export interface SyncTaskCreateRequest {
  name: string
  source_datasource_id: string
  source_tables?: SyncSourceTable[]
  target_datasource_id: string
  target_dataset_name?: string
  sync_mode?: 'full_refresh' | 'incremental'
  incremental_cursor_column?: string
  incremental_initial_value?: string
  schedule_enabled?: boolean
  schedule_cron?: string
  description?: string
}

export interface SyncTaskUpdateRequest {
  name?: string
  source_tables?: SyncSourceTable[]
  target_dataset_name?: string
  sync_mode?: 'full_refresh' | 'incremental'
  incremental_cursor_column?: string
  incremental_initial_value?: string
  schedule_enabled?: boolean
  schedule_cron?: string
  description?: string
  status?: 'pending' | 'running' | 'success' | 'failed' | 'paused'
}

export interface SyncTaskResponse {
  id: string
  name: string
  source_datasource_id: string
  source_tables: SyncSourceTable[] | null
  target_datasource_id: string
  target_dataset_name: string | null
  sync_mode: string
  incremental_cursor_column: string | null
  incremental_initial_value: string | null
  schedule_enabled: boolean
  schedule_cron: string | null
  description: string | null
  status: string
  owner_id: string
  owner_name: string
  created_at: string
  updated_at: string
}

export interface SyncFileMapping {
  source: string
  target: string
  field_mappings?: SyncFieldMapping[]
}

export interface SyncFieldMapping {
  source: string
  target: string
}

export type SyncSourceTable = string | SyncFileMapping

export interface SyncTaskListResponse {
  items: SyncTaskResponse[]
  total: number
  limit: number
  offset: number
}

export interface SyncTaskRunResponse {
  message: string
  task_id: string
  status: string
}

export interface SyncTaskLogsResponse {
  task_id: string
  logs: string
  status: string
}

export const SyncTaskApi = {
  list: (params?: { keyword?: string; status?: string; limit?: number; offset?: number }) =>
    http.get<SyncTaskListResponse>('', { params }).then((r) => r.data),

  get: (id: string) =>
    http.get<SyncTaskResponse>(`/${id}`).then((r) => r.data),

  create: (payload: SyncTaskCreateRequest) =>
    http.post<SyncTaskResponse>('', payload).then((r) => r.data),

  update: (id: string, payload: SyncTaskUpdateRequest) =>
    http.patch<SyncTaskResponse>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    http.delete(`/${id}`).then(() => true),

  run: (id: string) =>
    http.post<SyncTaskRunResponse>(`/${id}/run`).then((r) => r.data),

  getLogs: (id: string) =>
    http.get<SyncTaskLogsResponse>(`/${id}/logs`).then((r) => r.data),

  cancel: (id: string) =>
    http.post<SyncTaskRunResponse>(`/${id}/cancel`).then((r) => r.data),
}

export default SyncTaskApi
