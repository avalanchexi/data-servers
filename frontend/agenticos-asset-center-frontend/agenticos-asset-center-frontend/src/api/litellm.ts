import { createHttp } from './http'

const litellmHttp = createHttp({ baseURL: '/api/v1/oa/litellm' })

export interface LiteLLMToken {
  id: string
  token_name: string | null
  key_alias: string | null
  user_id: string | null
  models: string[]
  status: string
  expires_at: string | null
  rpm_limit: number | null
  tpm_limit: number | null
  max_budget: number | null
  spend: number | null
  last_used_at: string | null
}

export interface LiteLLMTokenCreateResult extends LiteLLMToken {
  token_key: string
}

export interface LiteLLMTokenListResponse {
  items: LiteLLMToken[]
  max_tokens_per_user: number
}

export interface LiteLLMUsageItem {
  data_date: string
  token_id: string | null
  model_id: string | null
  spend: number
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  total_requests: number
}

export interface LiteLLMUsageResponse {
  summary: Record<string, number>
  trend: LiteLLMUsageItem[]
  items: LiteLLMUsageItem[]
  total: number
  page: number
  page_size: number
  token_options: LiteLLMUsageFilterOption[]
  model_options: LiteLLMUsageFilterOption[]
  request_count_available: boolean
}

export interface LiteLLMUsageFilterOption {
  value: string
  label: string
}

export interface LiteLLMModel {
  model_id: string
  model_name: string
  provider: string | null
  status: string
  model_info: Record<string, unknown>
}

export interface LiteLLMHealth {
  available: boolean
  message: string
  display_base_url: string
}

export const LiteLLMApi = {
  listTokens: () => litellmHttp.get<LiteLLMTokenListResponse>('/tokens').then(r => r.data),
  createToken: (payload: { token_name: string; key_alias?: string }) =>
    litellmHttp.post<LiteLLMTokenCreateResult>('/tokens', payload).then(r => r.data),
  updateToken: (tokenId: string, payload: { token_name?: string; key_alias?: string }) =>
    litellmHttp.patch<LiteLLMToken>(`/tokens/${encodeURIComponent(tokenId)}`, payload).then(r => r.data),
  revokeToken: (tokenId: string) =>
    litellmHttp.patch<LiteLLMToken>(`/tokens/${encodeURIComponent(tokenId)}/revoke`).then(r => r.data),
  deleteToken: (tokenId: string) =>
    litellmHttp.delete(`/tokens/${encodeURIComponent(tokenId)}`),
  getUsage: (params: {
    startDate: string
    endDate: string
    tokenId?: string
    modelId?: string
    timezone: number
    page?: number
    pageSize?: number
  }) => litellmHttp.get<LiteLLMUsageResponse>('/usage', {
    params: {
      start_date: params.startDate,
      end_date: params.endDate,
      token_id: params.tokenId || undefined,
      model_id: params.modelId || undefined,
      timezone: params.timezone,
      page: params.page || 1,
      page_size: params.pageSize || 20,
    },
  }).then(r => r.data),
  listModels: () => litellmHttp.get<{ items: LiteLLMModel[] }>('/models').then(r => r.data),
  getHealth: () => litellmHttp.get<LiteLLMHealth>('/health').then(r => r.data),
}
