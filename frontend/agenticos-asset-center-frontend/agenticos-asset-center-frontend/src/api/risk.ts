import { createHttp } from './http'

const http = createHttp({
  baseURL: '/api',
})

// ── 类型定义 ──

/** 单条风险规则（keyword/regex/sql_metric/event_aggregation） */
export interface RiskRule {
  name: string
  rule_type: string
  pattern?: string | null
  severity?: string
  enabled?: boolean
  subject_type?: string | null
  // event_aggregation 专属
  source?: string | null
  event_type?: string | null
  risk_level?: string | null
  group_by?: string
  threshold?: number | null
  window_minutes?: number
  // sql_metric 专属
  dataset_id?: string | null
}

export interface RiskModel {
  id: number
  code: string
  name: string
  domain: string
  description?: string | null
  rule_config: RiskRule[]
  source: string
  scan_interval_minutes: number
  status: string
  version: number
  owner_id?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface RiskAlert {
  id: number
  alert_no: string
  model_id?: number | null
  model_name?: string | null
  rule_name?: string | null
  risk_level: string
  subject_type?: string | null
  subject_id?: string | null
  subject_name?: string | null
  evidence?: unknown
  status: string
  dedup_key?: string | null
  notified: number
  created_at: string
  closed_at?: string | null
}

export interface RiskCaseHistoryEntry {
  action: string
  operator?: string | null
  at: string
  comment?: string | null
}

export interface RiskCase {
  id: number
  case_no: string
  alert_id?: number | null
  title: string
  description?: string | null
  priority: string
  status: string
  assignee_id?: string | null
  assignee_name?: string | null
  handler_comment?: string | null
  reviewer_id?: string | null
  reviewer_name?: string | null
  review_comment?: string | null
  resolution?: string | null
  history?: RiskCaseHistoryEntry[]
  created_by?: string | null
  created_at: string
  updated_at: string
  closed_at?: string | null
}

export interface RiskListResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface RiskAlertStatsResponse {
  by_status: Record<string, number>
  by_level: Record<string, number>
}

export interface RiskCaseStatsResponse {
  total: number
  by_status: Record<string, number>
  by_priority: Record<string, number>
}

export interface RiskModelPayload {
  code: string
  name: string
  domain?: string
  description?: string
  rule_config: RiskRule[]
  scan_interval_minutes?: number
  status?: string
}

export interface RiskModelTestRunResponse {
  model_id: number
  hit_count: number
  hits: Array<{
    rule_name: string
    severity: string
    evidence?: unknown
    subject_type?: string | null
    subject_id?: string | null
    subject_name?: string | null
  }>
}

export interface RiskImportPresetsResponse {
  created: number
  updated: number
  skipped: number
}

// ── 模型 API ──

export async function listRiskModels(params: {
  domain?: string
  status?: string
  keyword?: string
  page?: number
  page_size?: number
}): Promise<RiskListResponse<RiskModel>> {
  const cleanParams: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    cleanParams[key] = value
  }
  const response = await http.get('/risk/models', { params: cleanParams })
  return response.data
}

export async function createRiskModel(body: RiskModelPayload): Promise<RiskModel> {
  const response = await http.post('/risk/models', body)
  return response.data
}

export async function updateRiskModel(id: number, body: Partial<RiskModelPayload>): Promise<RiskModel> {
  const response = await http.put(`/risk/models/${id}`, body)
  return response.data
}

export async function deleteRiskModel(id: number): Promise<{ deleted: boolean }> {
  const response = await http.delete(`/risk/models/${id}`)
  return response.data
}

export async function publishRiskModel(id: number): Promise<RiskModel> {
  const response = await http.post(`/risk/models/${id}/publish`)
  return response.data
}

export async function unpublishRiskModel(id: number): Promise<RiskModel> {
  const response = await http.post(`/risk/models/${id}/unpublish`)
  return response.data
}

export async function testRunRiskModel(id: number, body: { text?: string; run_metric_rules?: boolean }): Promise<RiskModelTestRunResponse> {
  const response = await http.post(`/risk/models/${id}/test-run`, body)
  return response.data
}

export async function importRiskModelPresets(): Promise<RiskImportPresetsResponse> {
  const response = await http.post('/risk/models/import-presets')
  return response.data
}

// ── 预警 API ──

export async function listRiskAlerts(params: {
  status?: string
  risk_level?: string
  model_id?: number
  page?: number
  page_size?: number
}): Promise<RiskListResponse<RiskAlert>> {
  const cleanParams: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    cleanParams[key] = value
  }
  const response = await http.get('/risk/alerts', { params: cleanParams })
  return response.data
}

export async function getRiskAlertStats(): Promise<RiskAlertStatsResponse> {
  const response = await http.get('/risk/alerts/stats')
  return response.data
}

export async function scanRiskAlerts(): Promise<{ scanned_models: number; created: number; skipped: number; errors: number }> {
  const response = await http.post('/risk/alerts/scan')
  return response.data
}

export async function updateRiskAlertStatus(id: number, body: { status: string }): Promise<RiskAlert> {
  const response = await http.patch(`/risk/alerts/${id}/status`, body)
  return response.data
}

// ── 工单 API ──

export async function listRiskCases(params: {
  status?: string
  priority?: string
  assignee_id?: string
  keyword?: string
  page?: number
  page_size?: number
}): Promise<RiskListResponse<RiskCase>> {
  const cleanParams: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    cleanParams[key] = value
  }
  const response = await http.get('/risk/cases', { params: cleanParams })
  return response.data
}

export async function getRiskCaseStats(): Promise<RiskCaseStatsResponse> {
  const response = await http.get('/risk/cases/stats')
  return response.data
}

export async function createRiskCase(body: { title: string; description?: string; priority?: string; alert_id?: number }): Promise<RiskCase> {
  const response = await http.post('/risk/cases', body)
  return response.data
}

export async function assignRiskCase(id: number, body: { assignee_id: string; assignee_name?: string }): Promise<RiskCase> {
  const response = await http.patch(`/risk/cases/${id}/assign`, body)
  return response.data
}

export async function transitionRiskCase(
  id: number,
  body: { target: string; comment?: string; reviewer_id?: string; reviewer_name?: string },
): Promise<RiskCase> {
  const response = await http.patch(`/risk/cases/${id}/status`, body)
  return response.data
}
