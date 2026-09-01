import { apiClient } from './core'

export interface Workflow {
  id: string
  name: string
  description: string | null
  node_count: number
  edge_count: number
  status: string
  created_at: string
  updated_at: string
}

export interface WorkflowDetail {
  id: string
  name: string
  description: string | null
  nodes: unknown[]
  edges: unknown[]
  status: string
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowCreateRequest {
  name: string
  description?: string
  nodes: unknown[]
  edges: unknown[]
}

export interface WorkflowUpdateRequest {
  name?: string
  description?: string
  nodes?: unknown[]
  edges?: unknown[]
  status?: string
}

export interface WorkflowExecuteResponse {
  success: boolean
  logs?: string[]
  status?: string
  error?: string
  [key: string]: unknown
}

export const listWorkflows = async (): Promise<Workflow[]> => {
  const response = await apiClient.get<Workflow[]>('/v1/workflows')
  return response.data
}

export const getWorkflow = async (workflowId: string): Promise<WorkflowDetail> => {
  const response = await apiClient.get<WorkflowDetail>(`/v1/workflows/${workflowId}`)
  return response.data
}

export const createWorkflow = async (data: WorkflowCreateRequest): Promise<WorkflowDetail> => {
  const response = await apiClient.post<WorkflowDetail>('/v1/workflows', data)
  return response.data
}

export const updateWorkflow = async (workflowId: string, data: WorkflowUpdateRequest): Promise<WorkflowDetail> => {
  const response = await apiClient.put<WorkflowDetail>(`/v1/workflows/${workflowId}`, data)
  return response.data
}

export const deleteWorkflow = async (workflowId: string): Promise<void> => {
  await apiClient.delete(`/v1/workflows/${workflowId}`)
}

export const executeWorkflow = async (workflowId: string, useLanggraph: boolean = true): Promise<WorkflowExecuteResponse> => {
  const response = await apiClient.post<WorkflowExecuteResponse>(`/v1/workflows/${workflowId}/execute`, null, {
    params: { use_langgraph: useLanggraph },
    timeout: 180000,
  })
  return response.data
}

export const getWorkflowExecutions = async (workflowId: string): Promise<unknown[]> => {
  const response = await apiClient.get<unknown[]>(`/v1/workflows/${workflowId}/executions`)
  return response.data
}

export const getAvailableAgents = async (): Promise<{ success: boolean; skills: unknown[] }> => {
  const response = await apiClient.get<{ success: boolean; skills: unknown[] }>('/v1/workflows/agents/list')
  return response.data
}

export const executeMultiAgentWorkflow = async (
  task: string,
  agentSequence?: string[]
): Promise<{ success: boolean;[key: string]: unknown }> => {
  const response = await apiClient.post('/v1/workflows/agents/execute', {
    task,
    agent_sequence: agentSequence,
  })
  return response.data
}

export const executeWorkflowWithMultiAgent = async (
  workflowId: string,
  task: string
): Promise<{ success: boolean;[key: string]: unknown }> => {
  const response = await apiClient.post(`/v1/workflows/${workflowId}/execute-multi-agent`, { task })
  return response.data
}

export const getAvailableSkills = async (): Promise<{ success: boolean; skills: unknown[] }> => {
  const response = await apiClient.get<{ success: boolean; skills: unknown[] }>('/v1/workflows/skills/list')
  return response.data
}

// ─── Streaming execution ────────────────────────────────────────────

export interface SkillItem {
  id: string
  skill_id: string
  skill_name: string
  display_name?: string
  description: string | null
  category: string | null
  source?: string
  path?: string | null
  enabled: boolean
  version?: string
  sort_order?: number
}

export interface SkillListResponse {
  items: SkillItem[]
  total?: number
}

export interface CategoryItem {
  category: string
  display_name: string
  count: number
}

export interface CategoryListResponse {
  items: CategoryItem[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StreamHandler = (data: any) => void

export interface StreamHandlers {
  onWorkflowStart?: StreamHandler
  onNodeStart?: StreamHandler
  onNodeUpdate?: StreamHandler
  onNodeComplete?: StreamHandler
  onError?: StreamHandler
  onCancelled?: StreamHandler
  onWorkflowPaused?: StreamHandler
  onWaiting?: StreamHandler
  onWorkflowComplete?: StreamHandler
  onOpen?: () => void
  onMessage?: StreamHandler
  onClose?: () => void
}

export function executeWorkflowStreaming(
  workflowId: string,
  handlers: StreamHandlers,
  _useLanggraph: boolean = true,
  eventSourceRef: { current: globalThis.EventSource | null },
): { cancel: () => Promise<void> } {
  const url = `/api/v1/workflows/${encodeURIComponent(workflowId)}/execute/stream`
  const eventSource = new EventSource(url, { withCredentials: true })
  eventSourceRef.current = eventSource

  const EVENT_MAP: Record<string, keyof StreamHandlers> = {
    workflow_start: 'onWorkflowStart',
    node_start: 'onNodeStart',
    node_update: 'onNodeUpdate',
    node_complete: 'onNodeComplete',
    error: 'onError',
    cancelled: 'onCancelled',
    workflow_paused: 'onWorkflowPaused',
    waiting: 'onWaiting',
    workflow_complete: 'onWorkflowComplete',
  }

  eventSource.addEventListener('open', () => {
    handlers.onOpen?.()
  })

  // 注册命名事件监听器 — 后端使用 event: <type> 发送命名事件，不能通过 message 接收
  Object.entries(EVENT_MAP).forEach(([eventName, handlerKey]) => {
    eventSource.addEventListener(eventName, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>
        const handler = handlers[handlerKey]
        if (typeof handler === 'function') {
          ;(handler as (data: Record<string, unknown>) => void)(data)
        }
      } catch {
        // 忽略解析错误
      }
    })
  })

  eventSource.addEventListener('error', () => {
    handlers.onClose?.()
    eventSource.close()
    eventSourceRef.current = null
  })

  return {
    cancel: async () => {
      eventSource.close()
      eventSourceRef.current = null
    },
  }
}

export async function fetchSkills(category?: string): Promise<SkillListResponse> {
  const params = new URLSearchParams()
  if (category && category !== '全部') params.set('category', category)
  const response = await apiClient.get<SkillListResponse>(`/v1/skills?${params}`)
  return response.data
}

export async function fetchCategories(): Promise<CategoryListResponse> {
  const response = await apiClient.get<CategoryListResponse>('/v1/skills/categories')
  return response.data
}
