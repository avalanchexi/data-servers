import { apiClient } from './core'

export interface MemoryStatsOverview {
  long_term_count: number
  session_count: number
  builtin_memory_enabled: boolean
  builtin_memory_char_limit: number
  builtin_memory_char_used: number
  builtin_user_enabled: boolean
  builtin_user_char_limit: number
  builtin_user_char_used: number
  provider_name: string | null
  provider_available: boolean
  session_db_size_bytes: number
  hermes_home: string
}

export interface BuiltinEntry {
  index: number
  content: string
  char_count: number
}

export interface BuiltinFileSnapshot {
  file: string
  enabled: boolean
  char_limit: number
  char_used: number
  last_modified: string | null
  drift_detected: boolean
  entries: BuiltinEntry[]
  path?: string
}

export interface MemoryConfig {
  hermes_home: string
  memory_enabled: boolean
  user_profile_enabled: boolean
  memory_char_limit: number
  user_char_limit: number
  provider: string
  nudge_interval: number | null
  flush_min_turns: number | null
}

export interface ProviderInfo {
  name: string
  description: string
  available: boolean
  is_active: boolean
  is_builtin: boolean
}

export interface ProviderListResponse {
  providers: ProviderInfo[]
  active_provider: string | null
}

export interface ProviderStatus {
  name: string | null
  available: boolean
  message: string
  tool_schemas: Record<string, unknown>[]
}

export interface HermesLongTermEntry {
  index: number
  content: string
  char_count: number
}

export interface HermesLongTermFileSnapshot {
  file: 'memory' | 'user'
  path: string
  exists: boolean
  enabled: boolean
  char_limit: number
  char_used: number
  last_modified: string | null
  drift_detected: boolean
  entries: HermesLongTermEntry[]
}

export interface HermesLongTermMemoryResponse {
  hermes_home: string
  files: HermesLongTermFileSnapshot[]
}

export interface HermesShortTermSession {
  id: string
  source: string
  title: string | null
  model: string | null
  started_at: number
  ended_at: number | null
  message_count: number | null
  tool_call_count: number | null
  input_tokens: number | null
  output_tokens: number | null
}

export interface HermesShortTermSessionListResponse {
  state_db_path: string
  exists: boolean
  total: number
  sessions: HermesShortTermSession[]
}

export interface HermesShortTermMessage {
  id: number
  role: string
  content: string | null
  tool_name: string | null
  timestamp: number
  token_count: number | null
}

export interface HermesShortTermSessionDetailResponse {
  session: HermesShortTermSession
  messages: HermesShortTermMessage[]
}

export const getMemoryStatsOverview = async (): Promise<MemoryStatsOverview> => {
  const response = await apiClient.get<MemoryStatsOverview>('/v1/hermes-memory/stats/overview')
  return response.data
}

export const getBuiltinMemory = async (file: 'memory' | 'user'): Promise<BuiltinFileSnapshot> => {
  const response = await apiClient.get<HermesLongTermMemoryResponse>('/v1/hermes-memory/long-term')
  const snap = response.data.files.find((f) => f.file === file)
  if (!snap) {
    throw new Error(`Hermes 长期记忆文件 ${file} 不存在`)
  }
  return {
    file: snap.file,
    enabled: snap.enabled,
    char_limit: snap.char_limit,
    char_used: snap.char_used,
    last_modified: snap.last_modified,
    drift_detected: snap.drift_detected,
    entries: snap.entries,
    path: snap.path,
  }
}

export const listProviders = async (): Promise<ProviderListResponse> => {
  const response = await apiClient.get<ProviderListResponse>('/v1/hermes-memory/provider/list')
  return response.data
}

export const getProviderStatus = async (): Promise<ProviderStatus> => {
  const response = await apiClient.get<ProviderStatus>('/v1/hermes-memory/provider/status')
  return response.data
}

export const getMemoryConfig = async (): Promise<MemoryConfig> => {
  const response = await apiClient.get<MemoryConfig>('/v1/hermes-memory/config')
  return response.data
}

export const getHermesLongTermMemory = async (): Promise<HermesLongTermMemoryResponse> => {
  const response = await apiClient.get<HermesLongTermMemoryResponse>('/v1/hermes-memory/long-term')
  return response.data
}

export const listHermesShortTermSessions = async (params: {
  limit?: number
  offset?: number
  source?: string
} = {}): Promise<HermesShortTermSessionListResponse> => {
  const response = await apiClient.get<HermesShortTermSessionListResponse>(
    '/v1/hermes-memory/short-term/sessions',
    { params },
  )
  return response.data
}

export const getHermesShortTermSession = async (
  sessionId: string,
  messageLimit: number = 200,
): Promise<HermesShortTermSessionDetailResponse> => {
  const response = await apiClient.get<HermesShortTermSessionDetailResponse>(
    `/v1/hermes-memory/short-term/sessions/${sessionId}`,
    { params: { message_limit: messageLimit } },
  )
  return response.data
}
