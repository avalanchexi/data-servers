import { apiClient } from './core'
import { READONLY_SELF_SERVICE_HEADER } from './interceptor'

// QA Task 写接口均由后端基于 current_user.id 做归属校验，允许全站只读角色操作本人会话。
const readonlySelfServiceConfig = {
  headers: { [READONLY_SELF_SERVICE_HEADER]: 'true' },
}

export interface QATaskResponse {
  id: string
  user_id: string
  title: string
  status: string
  agent_id: string | null
  message_count: number
  last_message_preview: string | null
  last_activity_at: string | null
  created_at: string | null
  updated_at: string | null
  metadata: Record<string, unknown> | null
}

export interface QATaskListResponse {
  qa_tasks: QATaskResponse[]
  total: number
}

export interface QATaskDetailResponse extends QATaskResponse {
  messages: MessageResponse[]
}

export interface MessageResponse {
  id: string
  qa_task_id: string
  role: string
  content: string
  status: string
  metadata: Record<string, unknown> | null
  created_at: string | null
}

export interface TrendingQuestion {
  text: string
  count: number
  action_type: string
  source: string
}

export interface TrendingQuestionsResponse {
  questions: TrendingQuestion[]
}

export interface PersonalizedQuestionsResponse {
  my_questions: TrendingQuestion[]
  others_questions: TrendingQuestion[]
  trending_questions: TrendingQuestion[]
}

export interface QATaskCreateRequest {
  user_id?: string
  title?: string
  metadata?: Record<string, unknown> | null
  agent_id?: string | null
}

export interface QATaskUpdateRequest {
  title?: string
  status?: string
  metadata?: Record<string, unknown> | null
}

export const createQATask = async (data: QATaskCreateRequest = {}): Promise<QATaskResponse> => {
  const response = await apiClient.post<QATaskResponse>('/v1/qa-tasks', data, readonlySelfServiceConfig)
  return response.data
}

export const listQATasks = async (
  status: string = 'active',
  limit: number = 50,
  offset: number = 0,
  agentId?: string | null,
): Promise<QATaskListResponse> => {
  const response = await apiClient.get<QATaskListResponse>('/v1/qa-tasks', {
    params: {
      status,
      limit,
      offset,
      // 通用智能体（null）不传，后端不过滤展现全部任务
      ...(agentId ? { agent_id: agentId } : {}),
    },
  })
  return response.data
}

export const getQATask = async (taskId: string): Promise<QATaskDetailResponse> => {
  const response = await apiClient.get<QATaskDetailResponse>(`/v1/qa-tasks/${taskId}`)
  return response.data
}

export const updateQATask = async (taskId: string, data: QATaskUpdateRequest): Promise<QATaskResponse> => {
  const response = await apiClient.patch<QATaskResponse>(`/v1/qa-tasks/${taskId}`, data, readonlySelfServiceConfig)
  return response.data
}

export const deleteQATask = async (taskId: string): Promise<void> => {
  await apiClient.delete(`/v1/qa-tasks/${taskId}`, readonlySelfServiceConfig)
}

export const clearAllQATasks = async (): Promise<{ cleared: number }> => {
  const response = await apiClient.delete<{ cleared: number }>('/v1/qa-tasks/clear-all', readonlySelfServiceConfig)
  return response.data
}

export const createMessage = async (taskId: string, role: string, content: string): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>(`/v1/qa-tasks/${taskId}/messages`, null, {
    params: { content, role },
    ...readonlySelfServiceConfig,
  })
  return response.data
}

export const listMessages = async (taskId: string, limit: number = 100, offset: number = 0): Promise<MessageResponse[]> => {
  const response = await apiClient.get<MessageResponse[]>(`/v1/qa-tasks/${taskId}/messages`, {
    params: { limit, offset },
  })
  return response.data
}

export const getTrendingQuestions = async (limit: number = 6): Promise<TrendingQuestionsResponse> => {
  const response = await apiClient.get<TrendingQuestionsResponse>('/v1/qa-tasks/recommendations/trending', {
    params: { limit },
  })
  return response.data
}

export const getPersonalizedQuestions = async (limit: number = 6): Promise<PersonalizedQuestionsResponse> => {
  const response = await apiClient.get<PersonalizedQuestionsResponse>('/v1/qa-tasks/recommendations/personalized', {
    params: { limit },
  })
  return response.data
}
