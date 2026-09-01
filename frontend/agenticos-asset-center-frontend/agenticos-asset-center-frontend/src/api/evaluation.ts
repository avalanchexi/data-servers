import { createHttp } from './http'
import { API_BASE, API_TOKEN } from './core'
import { createLogger } from '../utils/logger'

const log = createLogger('API')
const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}`,
})

// ==================== 套件模板 ====================

export interface SuiteTemplateResponse {
  id: string
  name: string
  category: string
  description?: string
  default_config: Record<string, any>
  recommended_case_categories?: Record<string, any>
  sort_order: number
  created_at: string
}

export async function listTemplates(): Promise<SuiteTemplateResponse[]> {
  const response = await http.get('/evaluation/templates')
  return response.data
}

export async function getTemplate(template_id: string): Promise<SuiteTemplateResponse> {
  const response = await http.get(`/evaluation/templates/${template_id}`)
  return response.data
}

// ==================== 评测套件 ====================

export interface SuiteResponse {
  id: string
  name: string
  description?: string
  category: string
  version: string
  status: string
  config: Record<string, any>
  target_agent?: string
  tags?: string[]
  case_count: number
  last_run_at?: string
  last_run_status?: string
  coverage_score: number
  owner_id?: string
  created_at: string
  updated_at: string
}

export interface SuiteListResponse {
  items: SuiteResponse[]
  total: number
  page: number
  page_size: number
}

export interface SuiteCreateRequest {
  name: string
  description?: string
  category?: string
  version?: string
  config?: Record<string, any>
  target_agent?: string
  tags?: string[]
  template_id?: string
}

export interface SuiteUpdateRequest {
  name?: string
  description?: string
  category?: string
  version?: string
  status?: string
  config?: Record<string, any>
  target_agent?: string
  tags?: string[]
}

export async function listSuites(params: {
  status?: string
  category?: string
  name?: string
  page?: number
  page_size?: number
}): Promise<SuiteListResponse> {
  const response = await http.get('/evaluation/suites', { params })
  return response.data
}

export async function getSuite(suite_id: string): Promise<SuiteResponse> {
  const response = await http.get(`/evaluation/suites/${suite_id}`)
  return response.data
}

export async function createSuite(body: SuiteCreateRequest): Promise<SuiteResponse> {
  const response = await http.post('/evaluation/suites', body)
  return response.data
}

export async function updateSuite(suite_id: string, body: SuiteUpdateRequest): Promise<SuiteResponse> {
  const response = await http.put(`/evaluation/suites/${suite_id}`, body)
  return response.data
}

export async function deleteSuite(suite_id: string): Promise<void> {
  await http.delete(`/evaluation/suites/${suite_id}`)
}

// ==================== 评测用例 ====================

export interface EvaluationDimension {
  key: string
  label: string
  weight: number
  type: string
  description: string
  rubric?: Record<string, string>
}

export interface EvaluationCriteria {
  mode?: string
  pass_threshold?: number
  dimensions?: EvaluationDimension[]
  segments?: Record<string, any>[]
}

export interface CaseResponse {
  id: string
  suite_id?: string
  name: string
  description?: string
  category: string
  source: string
  source_feedback_id?: string
  review_status: string
  reviewed_by?: string
  reviewed_at?: string
  confidence?: number
  input_data: Record<string, any>
  expected_output?: Record<string, any>
  evaluation_criteria: EvaluationCriteria
  sort_order: number
  enabled: number
  created_at: string
  updated_at: string
}

export interface CaseListResponse {
  items: CaseResponse[]
  total: number
  page: number
  page_size: number
}

export interface CaseCreateRequest {
  suite_id?: string
  name: string
  description?: string
  category?: string
  source?: string
  source_feedback_id?: string
  input_data: Record<string, any>
  expected_output?: Record<string, any>
  evaluation_criteria?: EvaluationCriteria
  sort_order?: number
  enabled?: number
}

export interface CaseUpdateRequest {
  name?: string
  description?: string
  category?: string
  source?: string
  review_status?: string
  reviewed_by?: string
  confidence?: number
  input_data?: Record<string, any>
  expected_output?: Record<string, any>
  evaluation_criteria?: EvaluationCriteria
  sort_order?: number
  enabled?: number
}

export async function listCases(params: {
  suite_id?: string
  category?: string
  source?: string
  review_status?: string
  enabled?: number
  name?: string
  page?: number
  page_size?: number
}): Promise<CaseListResponse> {
  const response = await http.get('/evaluation/cases', { params })
  return response.data
}

export async function getCase(case_id: string): Promise<CaseResponse> {
  const response = await http.get(`/evaluation/cases/${case_id}`)
  return response.data
}

export async function createCase(body: CaseCreateRequest): Promise<CaseResponse> {
  const response = await http.post('/evaluation/cases', body)
  return response.data
}

export async function updateCase(case_id: string, body: CaseUpdateRequest): Promise<CaseResponse> {
  const response = await http.put(`/evaluation/cases/${case_id}`, body)
  return response.data
}

export async function deleteCase(case_id: string): Promise<void> {
  await http.delete(`/evaluation/cases/${case_id}`)
}

// ==================== AI 辅助生成 ====================

export interface GenerateExpectedResponse {
  expected_output: Record<string, any>
  confidence: number
  reasoning: string
}

export interface GenerateCriteriaResponse {
  evaluation_criteria: EvaluationCriteria
}

export async function generateExpectedOutput(case_id: string): Promise<GenerateExpectedResponse> {
  const response = await http.post(`/evaluation/cases/${case_id}/generate-expected`)
  return response.data
}

export async function generateCriteria(case_id: string): Promise<GenerateCriteriaResponse> {
  const response = await http.post(`/evaluation/cases/${case_id}/generate-criteria`)
  return response.data
}

export interface GenerateExpectedFromDataRequest {
  category: string
  input_data: Record<string, any>
}

export interface GenerateCriteriaFromDataRequest {
  category: string
  input_data: Record<string, any>
  expected_output?: Record<string, any>
}

export async function generateExpectedFromData(body: GenerateExpectedFromDataRequest): Promise<GenerateExpectedResponse> {
  const response = await http.post('/evaluation/cases/generate-expected', body)
  return response.data
}

export async function generateCriteriaFromData(body: GenerateCriteriaFromDataRequest): Promise<GenerateCriteriaResponse> {
  const response = await http.post('/evaluation/cases/generate-criteria', body)
  return response.data
}

// ==================== 用例推荐 ====================

export interface CaseRecommendationItem {
  case_id: string
  case_name: string
  category: string
  score: number
  reasons: string[]
}

export interface CaseRecommendationResponse {
  core: CaseRecommendationItem[]
  suggested: CaseRecommendationItem[]
  optional: CaseRecommendationItem[]
  coverage?: Record<string, any>
}

export interface CaseRecommendationRequest {
  suite_category?: string
  target_agent?: string
  suite_id?: string
}

export async function recommendCases(body: CaseRecommendationRequest): Promise<CaseRecommendationResponse> {
  const response = await http.post('/evaluation/cases/recommend', body)
  return response.data
}

// ==================== 回测任务 ====================

export interface TaskResponse {
  id: string
  suite_id?: string
  suite_name?: string
  name: string
  status: string
  trigger_type: string
  config: Record<string, any>
  started_at?: string
  completed_at?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface TaskListResponse {
  items: TaskResponse[]
  total: number
  page: number
  page_size: number
}

export interface TaskCreateRequest {
  suite_id: string
  name: string
  trigger_type?: string
  config?: Record<string, any>
}

export async function listTasks(params: {
  suite_id?: string
  status?: string
  trigger_type?: string
  page?: number
  page_size?: number
}): Promise<TaskListResponse> {
  const response = await http.get('/evaluation/tasks', { params })
  return response.data
}

export async function getTask(task_id: string): Promise<TaskResponse> {
  const response = await http.get(`/evaluation/tasks/${task_id}`)
  return response.data
}

export async function createTask(body: TaskCreateRequest): Promise<TaskResponse> {
  const response = await http.post('/evaluation/tasks', body)
  return response.data
}

export async function runTask(task_id: string): Promise<any> {
  const response = await http.post(`/evaluation/tasks/${task_id}/run`)
  return response.data
}

export async function cancelTask(task_id: string): Promise<TaskResponse> {
  const response = await http.post(`/evaluation/tasks/${task_id}/cancel`)
  return response.data
}

// ==================== 回测报告 ====================

export interface DimensionResult {
  key: string
  label: string
  score: number
  weight: number
  weighted_contribution: number
  reasoning: string
  evidence?: Record<string, any>
  issues: string[]
}

export interface EvaluationResult {
  overall_score: number
  overall_pass: boolean
  dimensions: DimensionResult[]
  summary: string
  suggestions: string[]
}

export interface ReportResultItem {
  id: string
  case_id: string
  case_name?: string
  category?: string
  status: string
  score?: number
  execution_time_ms?: number
  actual_output?: Record<string, any>
  details?: EvaluationResult
}

export interface RegressionDetail {
  metric: string
  current: number
  baseline: number
  decline: number
  threshold: number
}

export interface TaskReportResponse {
  task_id: string
  task_name: string
  suite_id: string
  suite_name: string
  status: string
  started_at?: string
  completed_at?: string
  summary: Record<string, any>
  metrics: Record<string, number>
  results: ReportResultItem[]
  regression_info?: RegressionDetail[]
}

export async function getTaskReport(task_id: string): Promise<TaskReportResponse> {
  const response = await http.get(`/evaluation/tasks/${task_id}/report`)
  return response.data
}

export function getTaskReportExportUrl(task_id: string): string {
  return `/evaluation/tasks/${task_id}/report/export`
}

// ==================== 定时回测管理 ====================

export interface BacktestScheduleItem {
  id: string
  name: string
  schedule_display: string
  state: string
  enabled: boolean
  next_run_at?: string
  last_run_at?: string
  last_status?: string
  tags?: string[]
  created_at: string
}

export interface BacktestScheduleListResponse {
  items: BacktestScheduleItem[]
  total: number
}

export interface CreateScheduleRequest {
  suite_id: string
  name: string
  schedule: string
}

export async function listBacktestSchedules(): Promise<BacktestScheduleListResponse> {
  const response = await http.get('/evaluation/schedules')
  return response.data
}

export async function createBacktestSchedule(body: CreateScheduleRequest): Promise<{ job_id: string; name: string; schedule: string }> {
  const response = await http.post('/evaluation/schedules', body)
  return response.data
}

export async function deleteBacktestSchedule(job_id: string): Promise<void> {
  await http.delete(`/evaluation/schedules/${job_id}`)
}

export async function pauseBacktestSchedule(job_id: string): Promise<void> {
  await http.post(`/evaluation/schedules/${job_id}/pause`)
}

export async function resumeBacktestSchedule(job_id: string): Promise<void> {
  await http.post(`/evaluation/schedules/${job_id}/resume`)
}

// ==================== 回归测试 (SSE) ====================

export interface RegressionParams {
  days?: number
  top_n?: number
  max_iterations?: number
  pass_threshold?: number
  concurrency?: number
}

export interface RegressionStartEvent {
  total_questions: number
  iteration: number
  max_iterations: number
  questions: Array<{ query: string; frequency: number }>
}

export interface RegressionQuestionStartEvent {
  index: number
  total: number
  query: string
  frequency: number
}

export interface RegressionPhaseEvent {
  query_index: number
  phase_type?: string
  phase?: string
  status?: string
  detail?: string
  duration_ms?: number
  label?: string
  icon?: string
}

export interface RegressionDegradationEvent {
  query_index: number
  degradation_type: string
  severity: string
  details: string[]
}

export interface RegressionLogAlertEvent {
  query_index: number
  file: string
  type: string
  content: string
}

export interface RegressionQuestionResultEvent {
  query: string
  index: number
  frequency: number
  passed: boolean
  elapsed_s: number
  status_code: number
  error_type: string
  error_message: string
  full_response_preview: string
  think_tree_failed_phases: number
  think_tree_anomalies: string[]
  log_alerts_count: number
  degradation_detected: boolean
  degradation_type: string
  degradation_severity: string
  pass_dimensions?: {
    infra: boolean
    pipeline: boolean
    content: boolean
    perf: boolean
  }
  semantic_score?: number | null
  flow_analysis?: Record<string, unknown>
}

export interface RegressionTaskIdEvent {
  task_id: string
}

export interface RegressionBaselineComparisonEvent {
  has_regression: boolean
  regression_details: Array<{
    metric: string
    current: number
    baseline: number
    decline: number
    threshold: number
  }>
  baseline_task_id: string | null
  current_metrics: Record<string, number>
  baseline_metrics: Record<string, number>
}

export interface RegressionLogScanEvent {
  iteration: number
  errors: number
  warnings: number
  alerts: Array<{ file: string; type: string; content: string }>
}

export interface RegressionIterationSummaryEvent {
  iteration: number
  passed: number
  failed: number
  degraded: number
  pass_rate: number
  total: number
}

export interface RegressionReport {
  total_questions: number
  passed: number
  failed: number
  degraded: number
  pass_rate: number
  elapsed_s: number
  threshold: number
  ci_pass: boolean
  results: RegressionQuestionResultEvent[]
}

export interface RegressionCompleteEvent {
  report: RegressionReport
}

export interface RegressionCallbacks {
  signal?: AbortSignal
  onStart?: (data: RegressionStartEvent) => void
  onTaskId?: (data: RegressionTaskIdEvent) => void
  onQuestionStart?: (data: RegressionQuestionStartEvent) => void
  onPhase?: (data: RegressionPhaseEvent) => void
  onDegradation?: (data: RegressionDegradationEvent) => void
  onLogAlert?: (data: RegressionLogAlertEvent) => void
  onLogScan?: (data: RegressionLogScanEvent) => void
  onQuestionResult?: (data: RegressionQuestionResultEvent) => void
  onIterationSummary?: (data: RegressionIterationSummaryEvent) => void
  onBaselineComparison?: (data: RegressionBaselineComparisonEvent) => void
  onComplete?: (data: RegressionCompleteEvent) => void
  onError?: (message: string) => void
}

/**
 * 启动回归测试，通过 SSE 接收实时事件。
 *
 * 重要：返回的 AbortController 可用于终止测试（同时中止 HTTP 连接并调用 /cancel）。
 */
export function runRegression(
  params: RegressionParams,
  callbacks: RegressionCallbacks,
): AbortController {
  const abortController = new AbortController()

  void (async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (API_TOKEN) {
        headers['Authorization'] = `Bearer ${API_TOKEN}`
      }

      const response = await fetch(`${API_BASE}/regression/run`, {
        method: 'POST',
        headers,
        signal: abortController.signal,
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        callbacks.onError?.(
          errorData?.detail || `HTTP ${response.status} ${response.statusText}`,
        )
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError?.('Response body is not readable')
        return
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
          const trimmedLine = line.trim()

          if (trimmedLine.startsWith('event: ')) {
            currentEvent = trimmedLine.slice(7).trim()
            continue
          }

          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6).trim()
            if (!dataStr) {
              currentEvent = ''
              continue
            }

            try {
              const data = JSON.parse(dataStr)

              switch (currentEvent) {
                case 'regression.start':
                  callbacks.onStart?.(data as RegressionStartEvent)
                  break
                case 'regression.task_id':
                  callbacks.onTaskId?.(data as RegressionTaskIdEvent)
                  break
                case 'regression.question_start':
                  callbacks.onQuestionStart?.(data as RegressionQuestionStartEvent)
                  break
                case 'regression.phase':
                  callbacks.onPhase?.(data as RegressionPhaseEvent)
                  break
                case 'regression.degradation':
                  callbacks.onDegradation?.(data as RegressionDegradationEvent)
                  break
                case 'regression.log_alert':
                  callbacks.onLogAlert?.(data as RegressionLogAlertEvent)
                  break
                case 'regression.log_scan':
                  callbacks.onLogScan?.(data as RegressionLogScanEvent)
                  break
                case 'regression.question_result':
                  callbacks.onQuestionResult?.(data as RegressionQuestionResultEvent)
                  break
                case 'regression.iteration_summary':
                  callbacks.onIterationSummary?.(data as RegressionIterationSummaryEvent)
                  break
                case 'regression.baseline_comparison':
                  callbacks.onBaselineComparison?.(data as RegressionBaselineComparisonEvent)
                  break
                case 'regression.error':
                  callbacks.onError?.(data.message || 'Unknown error')
                  break
                case 'regression.complete':
                  callbacks.onComplete?.(data as RegressionCompleteEvent)
                  break
              }
            } catch {
              // 跳过无法解析的行
            }
            currentEvent = ''
          } else if (trimmedLine === '' || trimmedLine.startsWith(':')) {
            currentEvent = ''
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      log.error('[API] Regression streaming failed: ' + String(error))
      const message = error instanceof Error ? error.message : 'Unknown error'
      callbacks.onError?.(message)
    }
  })()

  return abortController
}

/**
 * 取消正在运行的回归测试（服务端通知 + 前端 AbortController）。
 */
export async function cancelRegression(abortController: AbortController): Promise<void> {
  abortController.abort()
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`
    }
    await fetch(`${API_BASE}/regression/cancel`, {
      method: 'POST',
      headers,
    })
  } catch {
    // ignore
  }
}

export interface RegressionHistoryItem {
  task_id: string
  name: string
  status: string
  config: Record<string, unknown>
  pass_rate: number
  total_questions: number
  degradation_rate: number
  elapsed_s: number
  avg_elapsed_s: number
  semantic_avg_score: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string | null
}

export async function fetchRegressionHistory(
  page = 1,
  pageSize = 10,
): Promise<{ items: RegressionHistoryItem[]; total: number; page: number; page_size: number }> {
  const response = await http.get(`/regression/history`, {
    params: { page, page_size: pageSize },
  })
  return response.data
}
