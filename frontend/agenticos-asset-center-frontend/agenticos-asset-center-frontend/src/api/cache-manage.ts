import { apiClient } from './core'

// ── 类型定义 ──────────────────────────────────────────────

export interface TtlDistribution {
  total: number
  permanent: number
  expiring_soon: number
  short: number
  long: number
}

export interface CacheStat {
  namespace: string
  label: string
  description: string
  size: number
  hits: number
  misses: number
  hit_rate: number
  volume_mb: number
  memory_bytes: number
  ttl: TtlDistribution
  db_path: string
}

export interface CacheListResponse {
  modules: CacheStat[]
  total_count: number
  total_volume_mb: number
}

export interface CacheEntryInfo {
  key: string
  size_bytes: number
  expire_at: string | null
  ttl_seconds: number | null
  value_type: string
  tag: string
}

export interface CacheDetailResponse {
  namespace: string
  size: number
  entries: CacheEntryInfo[]
  total_entries: number
  limit: number
  offset: number
  search: string
}

export interface CacheClearResponse {
  success: boolean
  namespace: string
  cleared_count: number
  message: string
}

export interface CacheClearAllResponse {
  success: boolean
  cleared_namespaces: string[]
  total_cleared: number
  message: string
}

export interface CacheEntryDeleteResponse {
  success: boolean
  namespace: string
  key: string
  message: string
}

export interface CacheEntryTtlResponse {
  success: boolean
  namespace: string
  key: string
  ttl_seconds: number | null
  message: string
}

export interface CacheEntryValueResponse {
  namespace: string
  key: string
  value_type: string
  value_preview: string
  size_bytes: number
  truncated: boolean
  expire_at: string | null
  ttl_seconds: number | null
  tag: string
}

export interface SlowLogEntry {
  id: number
  timestamp: number
  duration_us: number
  command: string
}

export interface BigKeyInfo {
  namespace: string
  key: string
  size_bytes: number
  ttl_seconds: number | null
}

export interface RedisKeyspaceInfo {
  keys: number
  expires: number
  avg_ttl: number
}

export interface CacheOverviewResponse {
  redis_version: string
  uptime_seconds: number
  uptime_human: string
  connected_clients: number
  used_memory_bytes: number
  used_memory_peak_bytes: number
  maxmemory_bytes: number
  mem_fragmentation_ratio: number
  total_connections_received: number
  total_commands_processed: number
  ops_per_sec: number
  keyspace_hits: number
  keyspace_misses: number
  hit_rate: number
  expired_keys: number
  evicted_keys: number
  pubsub_channels: number
  latency_ms: number
  keyspace: Record<string, RedisKeyspaceInfo>
  slowlog: SlowLogEntry[]
}

export interface CacheBigKeysResponse {
  big_keys: BigKeyInfo[]
}

export interface CacheSlowLogResponse {
  slowlog: SlowLogEntry[]
}

// ── API 函数 ──────────────────────────────────────────────

export const getCacheOverview = async (): Promise<CacheOverviewResponse> => {
  const res = await apiClient.get<CacheOverviewResponse>('/v1/admin/cache/overview')
  return res.data
}

export const getCacheBigKeys = async (topN = 20): Promise<CacheBigKeysResponse> => {
  const res = await apiClient.get<CacheBigKeysResponse>('/v1/admin/cache/big-keys', { params: { top_n: topN } })
  return res.data
}

export const getCacheSlowLog = async (count = 10): Promise<CacheSlowLogResponse> => {
  const res = await apiClient.get<CacheSlowLogResponse>('/v1/admin/cache/slow-log', { params: { count } })
  return res.data
}

export const getCacheModules = async (): Promise<CacheListResponse> => {
  const res = await apiClient.get<CacheListResponse>('/v1/admin/cache')
  return res.data
}

export const getCacheDetail = async (
  namespace: string,
  limit = 100,
  offset = 0,
  search = '',
): Promise<CacheDetailResponse> => {
  const res = await apiClient.get<CacheDetailResponse>(`/v1/admin/cache/${namespace}`, {
    params: { limit, offset, search },
  })
  return res.data
}

export const getCacheEntryValue = async (namespace: string, key: string): Promise<CacheEntryValueResponse> => {
  const res = await apiClient.get<CacheEntryValueResponse>(
    `/v1/admin/cache/${namespace}/entries/${encodeURIComponent(key)}`,
  )
  return res.data
}

export const deleteCacheEntry = async (namespace: string, key: string): Promise<CacheEntryDeleteResponse> => {
  const res = await apiClient.delete<CacheEntryDeleteResponse>(
    `/v1/admin/cache/${namespace}/entries/${encodeURIComponent(key)}`,
  )
  return res.data
}

export const refreshCacheEntryTtl = async (
  namespace: string,
  key: string,
  ttl: number,
): Promise<CacheEntryTtlResponse> => {
  const res = await apiClient.post<CacheEntryTtlResponse>(
    `/v1/admin/cache/${namespace}/entries/${encodeURIComponent(key)}/ttl`,
    { ttl },
  )
  return res.data
}

export const clearCache = async (namespace: string): Promise<CacheClearResponse> => {
  const res = await apiClient.delete<CacheClearResponse>(`/v1/admin/cache/${namespace}`)
  return res.data
}

export const clearAllCaches = async (): Promise<CacheClearAllResponse> => {
  const res = await apiClient.delete<CacheClearAllResponse>('/v1/admin/cache')
  return res.data
}
