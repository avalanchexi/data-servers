import { apiClient } from './core'

export interface HolographicStats {
  fact_count: number
  entity_count: number
  bank_count: number
  category_distribution: { category: string; count: number }[]
  avg_trust_score: number
  trust_distribution: { high: number; medium: number; low: number }
  db_size_bytes: number
  hrr_dim: number
  available: boolean
}

export interface HolographicFact {
  fact_id: number
  content: string
  category: string
  tags: string
  trust_score: number
  retrieval_count: number
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface HolographicFactListResponse {
  items: HolographicFact[]
  total: number
}

export interface HolographicFactFeedbackResponse {
  fact_id: number
  trust_score: number
  helpful_count: number
}

export interface HolographicEntity {
  entity_id: number
  name: string
  entity_type: string
  aliases: string
  created_at: string
  fact_count: number
}

export interface HolographicEntityListResponse {
  items: HolographicEntity[]
  total: number
}

export interface HolographicContradiction {
  fact_a_id: number
  fact_a: string
  fact_b_id: number
  fact_b: string
  shared_entity: string
  jaccard_similarity: number
  contradiction_score: number
}

export interface HolographicContradictionResponse {
  items: HolographicContradiction[]
}

export interface HolographicConfig {
  db_path: string
  db_exists: boolean
  auto_extract: boolean
  default_trust: number
  min_trust_threshold: number
  hrr_dim: number
  temporal_decay_half_life: number
}

export interface HolographicConfigUpdate {
  key: string
  value: string | boolean | number
}

export interface UserMemorySummary {
  user_id: string
  user_name: string
  fact_count: number
  entity_count: number
}

export interface UserMemoryListResponse {
  items: UserMemorySummary[]
}

export const getHolographicUsers = async (): Promise<UserMemorySummary[]> => {
  const response = await apiClient.get<UserMemoryListResponse>('/v1/holographic/users')
  return response.data.items
}

export const getHolographicStats = async (targetUserId?: string): Promise<HolographicStats> => {
  const response = await apiClient.get<HolographicStats>('/v1/holographic/stats', {
    params: targetUserId ? { target_user_id: targetUserId } : undefined,
  })
  return response.data
}

export const listHolographicFacts = async (params: {
  category?: string
  min_trust?: number
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: string
  target_user_id?: string
} = {}): Promise<HolographicFactListResponse> => {
  const { target_user_id, ...rest } = params
  const queryParams: Record<string, unknown> = { ...rest }
  if (target_user_id) queryParams.target_user_id = target_user_id
  const response = await apiClient.get<HolographicFactListResponse>('/v1/holographic/facts', { params: queryParams })
  return response.data
}

export const searchHolographicFacts = async (params: {
  query: string
  category?: string
  min_trust?: number
  limit?: number
  target_user_id?: string
}): Promise<HolographicFactListResponse> => {
  const { target_user_id, ...rest } = params
  const queryParams: Record<string, unknown> = { ...rest }
  if (target_user_id) queryParams.target_user_id = target_user_id
  const response = await apiClient.get<HolographicFactListResponse>('/v1/holographic/facts/search', { params: queryParams })
  return response.data
}

export const recordHolographicFactFeedback = async (
  factId: number,
  action: 'helpful' | 'unhelpful',
  targetUserId?: string,
): Promise<HolographicFactFeedbackResponse> => {
  const response = await apiClient.post<HolographicFactFeedbackResponse>(
    `/v1/holographic/facts/${factId}/feedback`,
    { action },
    { params: targetUserId ? { target_user_id: targetUserId } : undefined },
  )
  return response.data
}

export const listHolographicEntities = async (params: {
  limit?: number
  offset?: number
  target_user_id?: string
} = {}): Promise<HolographicEntityListResponse> => {
  const { target_user_id, ...rest } = params
  const queryParams: Record<string, unknown> = { ...rest }
  if (target_user_id) queryParams.target_user_id = target_user_id
  const response = await apiClient.get<HolographicEntityListResponse>('/v1/holographic/entities', { params: queryParams })
  return response.data
}

export const getHolographicEntityFacts = async (
  entityName: string,
  limit: number = 50,
  targetUserId?: string,
): Promise<HolographicFact[]> => {
  const response = await apiClient.get<HolographicFact[]>(
    `/v1/holographic/entities/${encodeURIComponent(entityName)}/facts`,
    { params: { limit, ...(targetUserId ? { target_user_id: targetUserId } : {}) } },
  )
  return response.data
}

export const getHolographicContradictions = async (
  category?: string,
  limit: number = 20,
  targetUserId?: string,
): Promise<HolographicContradictionResponse> => {
  const response = await apiClient.get<HolographicContradictionResponse>(
    '/v1/holographic/contradictions',
    { params: { category, limit, ...(targetUserId ? { target_user_id: targetUserId } : {}) } },
  )
  return response.data
}

export const getHolographicConfig = async (): Promise<HolographicConfig> => {
  const response = await apiClient.get<HolographicConfig>('/v1/holographic/config')
  return response.data
}

export const updateHolographicConfig = async (body: HolographicConfigUpdate) => {
  const response = await apiClient.put('/v1/holographic/config', body)
  return response.data
}
