import { apiClient } from './core'

// ---------------------------------------------------------------------------
// 类型定义（对接后端 /v1/mcp-servers 响应）
// ---------------------------------------------------------------------------

export interface McpToolDef {
  name: string
  description: string
  input_schema?: Record<string, unknown> | null
}

export interface McpItem {
  id: string
  name: string
  description: string | null
  service_type: string
  transport: string
  url: string | null
  command: string | null
  args: string[] | null
  env: Record<string, string> | null
  headers: Record<string, string> | null
  auth: string | null
  enabled: boolean
  tools: McpToolDef[] | null
  tool_include: string[] | null
  tool_exclude: string[] | null
  timeout: number
  connect_timeout: number
  supports_parallel_tool_calls: boolean
  plugin_path: string | null
  version: string | null
  config: Record<string, unknown> | null
  sort_order: number
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface McpDetail extends McpItem {
  mcp_json: Record<string, unknown> | null
}

export interface McpListResponse {
  total: number
  items: McpItem[]
}

export interface McpListQuery {
  keyword?: string
  service_type?: string
  enabled?: boolean
  limit?: number
  offset?: number
}

// 创建 / 更新请求
export interface McpPayload {
  name?: string
  description?: string
  transport?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
  auth?: string
  tools?: McpToolDef[]
  tool_include?: string[]
  tool_exclude?: string[]
  timeout?: number
  connect_timeout?: number
  supports_parallel_tool_calls?: boolean
  config?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// 响应类型
// ---------------------------------------------------------------------------

export interface McpDiscoverResponse {
  success: boolean
  count: number
  tools: McpToolDef[]
  message: string
}

export interface McpTestResponse {
  success: boolean
  ok: boolean
  tools_count: number
  message: string
  error: string | null
}

export interface McpSyncAgentResponse {
  success: boolean
  message: string
  synced_count: number
}

export interface McpSyncResponse {
  success: boolean
  message: string
  loaded_count: number
}

export interface McpCreateResponse {
  success: boolean
  message: string
  id: string
}

// ---------------------------------------------------------------------------
// API 调用
// ---------------------------------------------------------------------------

export async function listMcpServers(params?: McpListQuery): Promise<McpListResponse> {
  const response = await apiClient.get<McpListResponse>('/v1/mcp-servers', { params })
  return response.data
}

export async function getMcpServer(mcpId: string): Promise<McpDetail> {
  const response = await apiClient.get<McpDetail>(`/v1/mcp-servers/${mcpId}`)
  return response.data
}

export async function createMcpServer(payload: McpPayload): Promise<McpCreateResponse> {
  const response = await apiClient.post<McpCreateResponse>('/v1/mcp-servers', payload)
  return response.data
}

export async function updateMcpServer(mcpId: string, payload: McpPayload): Promise<void> {
  await apiClient.put(`/v1/mcp-servers/${mcpId}`, payload)
}

export async function deleteMcpServer(mcpId: string): Promise<void> {
  await apiClient.delete(`/v1/mcp-servers/${mcpId}`)
}

export async function toggleMcpServer(mcpId: string, enabled: boolean): Promise<void> {
  await apiClient.patch(`/v1/mcp-servers/${mcpId}/toggle`, { enabled })
}

export async function discoverMcpTools(mcpId: string): Promise<McpDiscoverResponse> {
  const response = await apiClient.get<McpDiscoverResponse>(`/v1/mcp-servers/${mcpId}/discover`)
  return response.data
}

export async function testMcpConnection(mcpId: string): Promise<McpTestResponse> {
  const response = await apiClient.post<McpTestResponse>(`/v1/mcp-servers/${mcpId}/test`)
  return response.data
}

export async function syncMcpToAgent(): Promise<McpSyncAgentResponse> {
  const response = await apiClient.post<McpSyncAgentResponse>('/v1/mcp-servers/sync')
  return response.data
}

export async function syncMcpPresets(): Promise<McpSyncResponse> {
  const response = await apiClient.post<McpSyncResponse>('/v1/mcp-servers/sync-presets')
  return response.data
}
