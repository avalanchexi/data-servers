/**
 * 安全评测（备案评估）API 客户端
 * 对应后端 /v1/security-eval/*（RequirePermission: config-content-compliance）
 * 评测运行端点返回 SSE 流（start / progress / final / error），
 * EventSource 仅支持 GET，故复用 fetch + 流式解析（对齐 chat.ts 的 SSE 解析模式）。
 */
import { API_BASE, apiClient } from './core'

export interface EvalBankStatsResponse {
  refusal_total: number
  refusal_dimensions: number
  refusal_min_per_dimension: number
  generation_total: number
  generation_dimensions: number
  non_refusal_total: number
  dimension_total: number
  checks: Record<string, boolean>
  thresholds: Record<string, number>
}

export interface EvalBankItem {
  item_id: string
  bank_type: string
  dimension: string
  expected: string
  text: string
  source: string
  enabled: number
}

export interface EvalBankItemListResponse {
  items: EvalBankItem[]
  total: number
}

export interface EvalRun {
  run_id: string
  status: string
  sample_size: number
  metrics: Record<string, number | null>
  thresholds: Record<string, number>
  passed: boolean
  report_path: string | null
  created_at: string | null
}

export interface EvalRunListResponse {
  runs: EvalRun[]
  total: number
}

export interface EvalRunDetailItem {
  item_id: string
  bank_type: string
  dimension: string
  expected: string
  elapsed_s: number
  response_preview: string
  verdict: string
  passed: boolean
  needs_review: boolean
  reason: string
  source: string
}

export interface EvalRunDetail extends EvalRun {
  config: Record<string, unknown>
  details: EvalRunDetailItem[]
  review_queue: EvalRunDetailItem[]
  error_message: string | null
}

export interface EvalRunOptions {
  refusal_n?: number
  generation_n?: number
  non_refusal_n?: number
  concurrency?: number
  use_llm?: boolean
}

export interface EvalStartEvent {
  run_id: string
  sample_size: number
  quota: Record<string, number>
}

export interface EvalProgressEvent {
  index: number
  total: number
  item_id: string
  dimension: string
  expected: string
  verdict: string
  passed: boolean
  needs_review: boolean
  elapsed_s: number
}

export interface EvalFinalEvent {
  run_id: string
  metrics: Record<string, number | null>
  thresholds: Record<string, number>
  passed: boolean
  review_count: number
  report_path: string | null
}

export interface EvalStreamHandlers {
  onStart?: (data: EvalStartEvent) => void
  onProgress?: (data: EvalProgressEvent) => void
  onFinal?: (data: EvalFinalEvent) => void
  onError?: (message: string) => void
}

export const getSecurityEvalBankStats = async (): Promise<EvalBankStatsResponse> => {
  const response = await apiClient.get<EvalBankStatsResponse>('/v1/security-eval/bank/stats')
  return response.data
}

export const listSecurityEvalBankItems = async (params: {
  page?: number
  page_size?: number
  bank_type?: string
  dimension?: string
} = {}): Promise<EvalBankItemListResponse> => {
  const response = await apiClient.get<EvalBankItemListResponse>('/v1/security-eval/bank/items', { params })
  return response.data
}

export const listSecurityEvalRuns = async (params: {
  page?: number
  page_size?: number
} = {}): Promise<EvalRunListResponse> => {
  const response = await apiClient.get<EvalRunListResponse>('/v1/security-eval/runs', { params })
  return response.data
}

export const getSecurityEvalRun = async (runId: string): Promise<EvalRunDetail> => {
  const response = await apiClient.get<EvalRunDetail>(`/v1/security-eval/runs/${encodeURIComponent(runId)}`)
  return response.data
}

export const getSecurityEvalRunReport = async (runId: string): Promise<Record<string, unknown>> => {
  const response = await apiClient.get<Record<string, unknown>>(
    `/v1/security-eval/runs/${encodeURIComponent(runId)}/report`
  )
  return response.data
}

/** 启动安全评测（POST /v1/security-eval/runs），经 fetch 流式消费 SSE 事件。 */
export const runSecurityEval = async (
  options: EvalRunOptions,
  handlers: EvalStreamHandlers,
  signal?: AbortSignal,
): Promise<void> => {
  const response = await fetch(`${API_BASE}/v1/security-eval/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    signal,
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const detail = errorData?.detail
    throw new Error(typeof detail === 'string' ? detail : `HTTP ${response.status} ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('event: ')) {
        currentEvent = trimmed.slice(7).trim()
        continue
      }
      if (!trimmed.startsWith('data: ')) continue
      const dataStr = trimmed.slice(6).trim()
      if (!dataStr) continue

      let data: Record<string, unknown>
      try {
        data = JSON.parse(dataStr)
      } catch {
        continue
      }

      if (currentEvent === 'error') {
        handlers.onError?.(typeof data.message === 'string' ? data.message : '评测启动失败')
        return
      }
      if (currentEvent === 'start') {
        handlers.onStart?.(data as unknown as EvalStartEvent)
      } else if (currentEvent === 'progress') {
        handlers.onProgress?.(data as unknown as EvalProgressEvent)
      } else if (currentEvent === 'final') {
        handlers.onFinal?.(data as unknown as EvalFinalEvent)
      }
      currentEvent = ''
    }
  }
}
