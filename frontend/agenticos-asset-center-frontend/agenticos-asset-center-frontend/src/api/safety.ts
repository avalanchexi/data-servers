import { apiClient } from './core'

export interface SafetyStatsResponse {
  total_requests: number
  input_safe_responses: number
  input_masks: number
  output_safe_responses: number
  output_masks: number
  tool_blocks: number
}

export interface SafetyEventItem {
  id: number
  user_id: string | null
  username: string | null
  qa_task_id: string | null
  platform: string
  direction: string
  risk_level: string
  categories: string[] | null
  action: string
  content_summary: string | null
  rule_hits: string[] | null
  created_at: string | null
}

export interface SafetyEventListResponse {
  events: SafetyEventItem[]
  total: number
}

export interface SafetyPolicyItem {
  id: number
  name: string
  category: string
  scope: string
  match_type: string
  pattern: string
  action: string
  safe_response_key: string | null
  severity: string
  enabled: boolean
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export interface SafetyPolicyPayload {
  name: string
  category: string
  scope: string
  match_type: string
  pattern: string
  action: string
  safe_response_key?: string | null
  severity: string
  enabled: boolean
  sort_order: number
}

export interface SafetyTemplateItem {
  key: string
  label: string
  content: string
  description: string | null
  enabled: boolean
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
}

export interface SafetyLLMConfigItem {
  id: number
  name: string
  enabled: boolean
  prompt_template: string
  confidence_threshold: number
  temperature: number
  max_tokens: number
  timeout_seconds: number
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
}

export interface SafetyLLMConfigPayload {
  name?: string
  enabled?: boolean
  prompt_template?: string
  confidence_threshold?: number
  temperature?: number
  max_tokens?: number
  timeout_seconds?: number
}

// LLM 安全专项统计
export interface LLMSecurityStatsResponse {
  total_events: number
  input_events: number
  input_blocked: number
  output_events: number
  output_blocked: number
  tool_events: number
  tool_blocked: number
  rag_blocked: number
  risk_distribution: Record<string, number>
  platform_stats: Record<string, number>
  daily_trend: { date: string; count: number }[]
}

export const getSafetyStats = async (days: number = 1): Promise<SafetyStatsResponse> => {
  const response = await apiClient.get<SafetyStatsResponse>('/v1/safety/stats', { params: { days } })
  return response.data
}

export const listSafetyEvents = async (params: {
  limit?: number
  offset?: number
  risk_level?: string
  direction?: string
  action?: string
  platform?: string
  username?: string
  keyword?: string
  start_time?: string
  end_time?: string
} = {}): Promise<SafetyEventListResponse> => {
  const response = await apiClient.get<SafetyEventListResponse>('/v1/safety/events', { params })
  return response.data
}

export const listSafetyPolicies = async (): Promise<SafetyPolicyItem[]> => {
  const response = await apiClient.get<SafetyPolicyItem[]>('/v1/safety/policies')
  return response.data
}

export const createSafetyPolicy = async (data: SafetyPolicyPayload): Promise<SafetyPolicyItem> => {
  const response = await apiClient.post<SafetyPolicyItem>('/v1/safety/policies', data)
  return response.data
}

export const updateSafetyPolicy = async (
  policyId: number,
  data: Partial<SafetyPolicyPayload>
): Promise<SafetyPolicyItem> => {
  const response = await apiClient.patch<SafetyPolicyItem>(`/v1/safety/policies/${policyId}`, data)
  return response.data
}

export const toggleSafetyPolicy = async (policyId: number): Promise<SafetyPolicyItem> => {
  const response = await apiClient.post<SafetyPolicyItem>(`/v1/safety/policies/${policyId}/toggle`)
  return response.data
}

export const listSafetyTemplates = async (): Promise<SafetyTemplateItem[]> => {
  const response = await apiClient.get<SafetyTemplateItem[]>('/v1/safety/templates')
  return response.data
}

export const updateSafetyTemplate = async (
  templateKey: string,
  data: Partial<Pick<SafetyTemplateItem, 'label' | 'content' | 'description' | 'enabled'>>
): Promise<SafetyTemplateItem> => {
  const response = await apiClient.patch<SafetyTemplateItem>(`/v1/safety/templates/${templateKey}`, data)
  return response.data
}

export const getSafetyLLMConfig = async (): Promise<SafetyLLMConfigItem> => {
  const response = await apiClient.get<SafetyLLMConfigItem>('/v1/safety/llm-config')
  return response.data
}

export const updateSafetyLLMConfig = async (data: SafetyLLMConfigPayload): Promise<SafetyLLMConfigItem> => {
  const response = await apiClient.patch<SafetyLLMConfigItem>('/v1/safety/llm-config', data)
  return response.data
}

export const getLLMSecurityStats = async (days: number = 7): Promise<LLMSecurityStatsResponse> => {
  const response = await apiClient.get<LLMSecurityStatsResponse>('/v1/safety/llm/stats', { params: { days } })
  return response.data
}
