/**
 * 红队测试（备案门槛②）API 客户端
 * 对应后端 /v1/security-redteam/*（RequirePermission: config-content-compliance）
 * 红队运行端点返回 SSE 流（start / progress / final / error），
 * EventSource 仅支持 GET，故复用 fetch + 流式解析（对齐 securityEval.ts 的 SSE 解析模式）。
 */
import { API_BASE, apiClient } from './core'

export interface RedTeamStats {
  total_entries: number
  covered_dimensions: number
  min_entries_per_dimension: number
  dimension_coverage_ok: boolean
  min_entries_ok: boolean
}

export interface RedTeamDimensionStat {
  dimension: string
  count: number
  severity: string
}

export interface RedTeamStatsResponse {
  stats: RedTeamStats
  dimensions: RedTeamDimensionStat[]
}

export interface RedTeamRun {
  run_id: string
  status: string
  sample_size: number
  config: Record<string, unknown>
  metrics: Record<string, unknown>
  thresholds: Record<string, number>
  passed: boolean
  report_path: string | null
  created_at: string | null
}

export interface RedTeamRunListResponse {
  runs: RedTeamRun[]
  total: number
}

export interface RedTeamDimensionReport {
  dimension: string
  label: string
  severity: string
  total: number
  invalid: number
  blocked: number
  answered: number
  asr: number | null
  status: string
  discrimination_basis: string
  invalid_reasons: string[]
}

export interface RedTeamFinalEvent {
  run_id?: string
  report_type: string
  generated_at: string
  total_cases: number
  dimension_count: number
  blocked_count: number
  invalid_count: number
  overall: string
  red_dimensions: string[]
  warn_dimensions: string[]
  invalid_dimensions: string[]
  dimensions: RedTeamDimensionReport[]
}

export interface RedTeamRunDetail extends RedTeamRun {
  dimensions: RedTeamDimensionReport[]
  error_message: string | null
}

export interface RedTeamRunOptions {
  dimensions?: string[]
  attack_type?: string
  limit?: number
  concurrency?: number
}

export interface RedTeamStartEvent {
  sample_size: number
  dimensions: string[]
}

export interface RedTeamProgressEvent {
  index: number
  total: number
  dimension: string
  attack_type: string
  outcome: string
  elapsed_s: number
}

export interface RedTeamStreamHandlers {
  onStart?: (data: RedTeamStartEvent) => void
  onProgress?: (data: RedTeamProgressEvent) => void
  onFinal?: (data: RedTeamFinalEvent) => void
  onError?: (message: string) => void
}

export const getRedTeamCorpusStats = async (): Promise<RedTeamStatsResponse> => {
  const response = await apiClient.get<RedTeamStatsResponse>('/v1/security-redteam/corpus/stats')
  return response.data
}

export const listRedTeamRuns = async (params: {
  page?: number
  page_size?: number
} = {}): Promise<RedTeamRunListResponse> => {
  const response = await apiClient.get<RedTeamRunListResponse>('/v1/security-redteam/runs', { params })
  return response.data
}

export const getRedTeamRun = async (runId: string): Promise<RedTeamRunDetail> => {
  const response = await apiClient.get<RedTeamRunDetail>(
    `/v1/security-redteam/runs/${encodeURIComponent(runId)}`
  )
  return response.data
}

export const getRedTeamRunReport = async (runId: string): Promise<Record<string, unknown>> => {
  const response = await apiClient.get<Record<string, unknown>>(
    `/v1/security-redteam/runs/${encodeURIComponent(runId)}/report`
  )
  return response.data
}

/** 启动红队测试（POST /v1/security-redteam/runs），经 fetch 流式消费 SSE 事件。 */
export const runRedTeam = async (
  options: RedTeamRunOptions,
  handlers: RedTeamStreamHandlers,
  signal?: AbortSignal,
): Promise<void> => {
  const response = await fetch(`${API_BASE}/v1/security-redteam/runs`, {
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
        handlers.onError?.(typeof data.message === 'string' ? data.message : '红队测试启动失败')
        return
      }
      if (currentEvent === 'start') {
        handlers.onStart?.(data as unknown as RedTeamStartEvent)
      } else if (currentEvent === 'progress') {
        handlers.onProgress?.(data as unknown as RedTeamProgressEvent)
      } else if (currentEvent === 'final') {
        handlers.onFinal?.(data as unknown as RedTeamFinalEvent)
      }
      currentEvent = ''
    }
  }
}
