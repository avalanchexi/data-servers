import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}`,
})

export interface FeedbackContextData {
  user_question: string
  assistant_response: string
  agent_id?: string
  agent_name?: string
  model_version?: string
  tools_used?: string[]
  thinking_steps?: any[]
  datasource_id?: string
  knowledge_base_id?: string
  session_id?: string
  qa_task_id?: string
}

export interface FeedbackSubmitRequest {
  message_id: string
  feedback_type: 'like' | 'dislike' | string
  category?: string
  content?: string
  context_data?: FeedbackContextData
}

export interface FeedbackResponse {
  id: string
  user_id: string
  username?: string
  message_id: string
  qa_task_id?: string
  feedback_type: string
  category?: string
  priority: string
  status: string
  content?: string
  context_data?: FeedbackContextData
  assigned_to?: string
  assignee_name?: string
  resolution?: string
  created_at: string
  updated_at: string
  history?: Array<{
    timestamp: string
    operator: string
    action: string
    from?: string
    to?: string
    comment: string
  }>
}

export interface FeedbackListResponse {
  items: FeedbackResponse[]
  total: number
  page: number
  page_size: number
}

export interface FeedbackStatsResponse {
  today_count: number
  unprocessed_count: number
  by_type: Record<string, number>
  by_category: Record<string, number>
  trend: Array<{ date: string; count: number }>
}

export interface FeedbackStatusUpdateRequest {
  status: string
  comment?: string
}

export interface FeedbackAssignRequest {
  user_id: string
}

export interface FeedbackToCaseRequest {
  suite_id?: string
  name?: string
  category?: string
  expected_output?: Record<string, any>
}

export interface FeedbackToCaseResponse {
  case_id: string
  feedback_id: string
  name: string
  category: string
  created_at: string
}

export async function submitFeedback(body: FeedbackSubmitRequest): Promise<FeedbackResponse> {
  const response = await http.post('/feedback', body)
  return response.data
}

export async function listFeedbacks(params: {
  feedback_type?: string
  feedback_types?: string[]
  category?: string
  status?: string
  priority?: string
  user_id?: string
  start_time?: string
  end_time?: string
  keyword?: string
  page?: number
  page_size?: number
}): Promise<FeedbackListResponse> {
  // 过滤空值参数，避免发送无意义的查询参数
  const cleanParams: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value) && value.length === 0) continue
    if (value === '') continue
    cleanParams[key] = value
  }
  const response = await http.get('/feedback', { params: cleanParams })
  return response.data
}

export async function getFeedback(feedback_id: string): Promise<FeedbackResponse> {
  const response = await http.get(`/feedback/${feedback_id}`)
  return response.data
}

export async function updateFeedback(feedback_id: string, body: Record<string, any>): Promise<FeedbackResponse> {
  const response = await http.put(`/feedback/${feedback_id}`, body)
  return response.data
}

export async function updateFeedbackStatus(feedback_id: string, body: FeedbackStatusUpdateRequest): Promise<FeedbackResponse> {
  const response = await http.patch(`/feedback/${feedback_id}/status`, body)
  return response.data
}

export async function assignFeedback(feedback_id: string, body: FeedbackAssignRequest): Promise<FeedbackResponse> {
  const response = await http.patch(`/feedback/${feedback_id}/assign`, body)
  return response.data
}

export async function convertToCase(feedback_id: string, body: FeedbackToCaseRequest): Promise<FeedbackToCaseResponse> {
  const response = await http.post(`/feedback/${feedback_id}/to-case`, body)
  return response.data
}

export async function getFeedbackStats(): Promise<FeedbackStatsResponse> {
  const response = await http.get('/feedback/stats')
  return response.data
}