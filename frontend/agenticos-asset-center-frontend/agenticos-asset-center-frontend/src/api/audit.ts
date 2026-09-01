import { apiClient } from './core'

export interface AuditLog {
  id: string
  event_type: string
  event_category: 'user_operation' | 'system_event'
  user_id: string | null
  username: string | null
  display_name: string | null
  ip_address: string | null
  user_agent: string | null
  target_resource: string | null
  action: string
  result: 'success' | 'failed' | 'partial' | 'pending'
  error_message: string | null
  details: Record<string, unknown> | null
  session_id: string | null
  platform: string | null
  created_at: string
}

export interface AuditLogListResponse {
  total: number
  page: number
  page_size: number
  items: AuditLog[]
}

export interface AuditLogQuery {
  start_time?: string
  end_time?: string
  user_id?: string
  username?: string
  event_type?: string
  event_category?: string
  result?: string
  session_id?: string
  platform?: string
  keyword?: string
  page?: number
  page_size?: number
}

export interface AuditEventTypesResponse {
  user_operation: string[]
  system_event: string[]
}

export interface AuditStatsResponse {
  total: number
  user_operations: number
  system_events: number
  failed: number
}

export interface HermesTokenUsageTotals {
  total_input: number
  total_output: number
  total_tokens: number
  total_cache_read: number
  total_cache_write: number
  total_reasoning: number
  total_sessions: number
  total_api_calls: number
  total_tool_calls: number
  total_estimated_cost: number
  total_actual_cost: number
}

export interface HermesTokenUsageDailyEntry {
  day: string | null
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  reasoning_tokens: number
  api_calls: number
  sessions: number
}

export interface HermesTokenUsageSession {
  id: string
  source: string
  user_id: string | null
  username: string | null
  model: string | null
  title: string | null
  started_at: number
  ended_at: number | null
  message_count: number | null
  tool_call_count: number | null
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  reasoning_tokens: number
  api_call_count: number
  estimated_cost_usd: number | null
  actual_cost_usd: number | null
  total_tokens: number
}

export interface HermesTokenUsageResponse {
  state_db_path: string
  exists: boolean
  error_message: string | null
  total: number
  totals: HermesTokenUsageTotals
  daily: HermesTokenUsageDailyEntry[]
  sessions: HermesTokenUsageSession[]
}

export interface HermesTokenUsageQuery {
  start_time?: string
  end_time?: string
  username?: string
  limit?: number
  offset?: number
}

// ── 日志管理（P1 新增） ──

export interface StorageStatsResponse {
  total: number
  user_operation_count: number
  system_event_count: number
  today_new: number
  table_size_mb: number | null
}

export interface RetentionConfigResponse {
  user_operation_days: number
  system_event_days: number
  cleanup_interval_minutes: number
}

export interface CleanupPreviewResponse {
  user_operation: { count: number; cutoff: string }
  system_event: { count: number; cutoff: string }
}

export interface SysLogCleanupResponse {
  user_operation_deleted: number
  system_event_deleted: number
  user_operation_cutoff: string
  system_event_cutoff: string
}

export const getStorageStats = async (): Promise<StorageStatsResponse> => {
  const response = await apiClient.get<StorageStatsResponse>('/v1/audit/storage-stats')
  return response.data
}

export const getRetentionConfig = async (): Promise<RetentionConfigResponse> => {
  const response = await apiClient.get<RetentionConfigResponse>('/v1/audit/retention-config')
  return response.data
}

export const previewCleanup = async (): Promise<CleanupPreviewResponse> => {
  const response = await apiClient.post<CleanupPreviewResponse>('/v1/audit/cleanup/preview')
  return response.data
}

export const triggerCleanup = async (): Promise<SysLogCleanupResponse> => {
  const response = await apiClient.post<SysLogCleanupResponse>('/v1/audit/cleanup')
  return response.data
}

export const listAuditLogs = async (params: AuditLogQuery): Promise<AuditLogListResponse> => {
  const response = await apiClient.get<AuditLogListResponse>('/v1/audit/logs', {
    params,
  })
  return response.data
}

export const getAuditEventTypes = async (): Promise<AuditEventTypesResponse> => {
  const response = await apiClient.get<AuditEventTypesResponse>('/v1/audit/event-types')
  return response.data
}

export const getAuditStats = async (days: number = 1): Promise<AuditStatsResponse> => {
  const response = await apiClient.get<AuditStatsResponse>('/v1/audit/stats', { params: { days } })
  return response.data
}

export const getAuditLog = async (auditId: string): Promise<AuditLog> => {
  const response = await apiClient.get<AuditLog>(`/v1/audit/logs/${auditId}`)
  return response.data
}

export const exportAuditLogs = async (params: AuditLogQuery & { format: 'csv' | 'json' }): Promise<void> => {
  const response = await apiClient.get<Blob>('/v1/audit/export', {
    params,
    responseType: 'blob',
  })
  const disposition = response.headers['content-disposition']
  const match = typeof disposition === 'string' ? disposition.match(/filename="?([^"]+)"?/) : null
  const filename = match?.[1] || `audit_logs.${params.format}`
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const getAuditTokenUsage = async (
  params: HermesTokenUsageQuery = {},
): Promise<HermesTokenUsageResponse> => {
  const response = await apiClient.get<HermesTokenUsageResponse>(
    '/v1/audit/token-usage',
    { params },
  )
  return response.data
}
