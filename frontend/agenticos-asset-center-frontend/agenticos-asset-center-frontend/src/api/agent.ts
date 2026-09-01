import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/agents`,
})

export interface AgentResourceItem {
  resource_type: string
  resource_id: string
}

export interface AgentCreateRequest {
  name: string
  description?: string
  capabilities: string[]
  prompt?: string
  persona?: string
  domain_vocabulary?: string[] | null
  enabled?: boolean
  resources: AgentResourceItem[]
  role_ids: string[]
  mcp_servers?: string[] | null
}

export interface AgentUpdateRequest {
  name?: string
  description?: string
  capabilities?: string[]
  prompt?: string
  persona?: string
  domain_vocabulary?: string[] | null
  enabled?: boolean
  resources?: AgentResourceItem[]
  role_ids?: string[]
  mcp_servers?: string[] | null
}

export interface AgentResourceResponse {
  resource_type: string
  resource_id: string
  resource_name?: string
}

export interface AgentRoleResponse {
  role_id: string
  role_name?: string
}

export interface AgentItem {
  id: string
  name: string
  description: string | null
  capabilities: string[]
  enabled: boolean
  owner_id: string | null
  owner_name: string | null
  created_at: string
  updated_at: string
  role_count: number
  role_names: string[]
}

export interface AgentDetail extends AgentItem {
  prompt: string | null
  persona: string | null
  domain_vocabulary: string[] | null
  resources: AgentResourceResponse[]
  roles: AgentRoleResponse[]
  mcp_servers: string[] | null
}

export interface AgentListResponse {
  total: number
  items: AgentItem[]
  limit: number
  offset: number
}

export interface AgentRuntimeContext {
  agent_id: string
  agent_name: string
  model: string
  system_prompt: string
  capabilities: string[]
  domain_vocabulary: string[]
  kb_ids: string[]
  kb_names: string[]
  dataset_ids: string[]
  dataset_names: string[]
  mcp_servers: string[]
}

export const AgentApi = {
  list: (params?: { keyword?: string; enabled?: boolean; limit?: number; offset?: number }) =>
    http.get<AgentListResponse>('', { params }).then((r) => r.data),

  listAll: (params?: { keyword?: string; owner_id?: string; enabled?: boolean; limit?: number; offset?: number }) =>
    http.get<AgentListResponse>('/all', { params }).then((r) => r.data),

  create: (payload: AgentCreateRequest) =>
    http.post<AgentDetail>('', payload).then((r) => r.data),

  get: (id: string) => http.get<AgentDetail>(`/${id}`).then((r) => r.data),

  update: (id: string, payload: AgentUpdateRequest) =>
    http.put<AgentDetail>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => http.delete(`/${id}`).then(() => true),

  enable: (id: string) => http.post<AgentItem>(`/${id}/enable`).then((r) => r.data),

  disable: (id: string) => http.post<AgentItem>(`/${id}/disable`).then((r) => r.data),

  getRuntime: (id: string) =>
    http.get<AgentRuntimeContext>(`/${id}/runtime`).then((r) => r.data),
}
