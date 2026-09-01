import { apiClient } from './core'

export interface LLMCacheStat {
  table_name: string
  label: string
  description: string
  count: number
  size_bytes: number
}

export interface LLMCacheListResponse {
  modules: LLMCacheStat[]
  total_count: number
}

export interface LLMCacheEntryInfo {
  key: string
  size_bytes: number
  model: string
  hit_count: number
  token_count: number
  created_at: string | null
  last_accessed: string | null
  expired_at: string | null
  extra: Record<string, unknown>
}

export interface LLMCacheDetailResponse {
  table_name: string
  count: number
  entries: LLMCacheEntryInfo[]
  total_entries: number
  limit: number
  offset: number
}

export interface LLMCacheClearResponse {
  success: boolean
  table_name: string
  cleared_count: number
  message: string
}

export interface LLMCacheClearAllResponse {
  success: boolean
  cleared_tables: string[]
  total_cleared: number
  message: string
}

export const getLLMCacheModules = async (): Promise<LLMCacheListResponse> => {
  const res = await apiClient.get<LLMCacheListResponse>('/v1/admin/llm-cache')
  return res.data
}

export const getLLMCacheDetail = async (tableName: string, limit = 100, offset = 0): Promise<LLMCacheDetailResponse> => {
  const res = await apiClient.get<LLMCacheDetailResponse>(`/v1/admin/llm-cache/${tableName}`, { params: { limit, offset } })
  return res.data
}

export const clearLLMCache = async (tableName: string): Promise<LLMCacheClearResponse> => {
  const res = await apiClient.delete<LLMCacheClearResponse>(`/v1/admin/llm-cache/${tableName}`)
  return res.data
}

export const clearAllLLMCaches = async (): Promise<LLMCacheClearAllResponse> => {
  const res = await apiClient.delete<LLMCacheClearAllResponse>('/v1/admin/llm-cache')
  return res.data
}
