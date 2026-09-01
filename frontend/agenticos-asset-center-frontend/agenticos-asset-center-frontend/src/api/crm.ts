import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'
export type CrmSubjectType = 'company' | 'deal' | 'lead'
export type CustomerCategory =
  | 'SOUTHERNDISTRICT'
  | 'NORTHDISTRICT'
  | 'FINANCIALINDUSTRY'
  | 'EASTDISTRICT'
  | 'OTHERS'

// ── 客户 API ─────────────────────────────────────────────
const companiesHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/crm/companies` })

export interface CompanyItem {
  id: string
  customer_id: number | null
  name: string
  short_name: string | null
  english_abbreviation: string | null
  customer_category: CustomerCategory | null
  industry: string | null
  scale: string | null
  url: string | null
  address: string | null
  business_info: Record<string, unknown> | null
  owner_id: string | null
  owner_name: string | null
  created_from_lead_id: string | null
  created_at: string
  updated_at: string
}

export interface CompanyDetail extends CompanyItem {
  is_active: boolean
}

export interface CompanyListResponse {
  total: number
  items: CompanyItem[]
  limit: number
  offset: number
}

export interface CompanyLookupResult {
  name: string
  short_name: string
  english_abbreviation?: string
  legal_person: string
  registered_capital: string
  founding_date: string
  credit_code: string
  registration_number: string
  business_scope: string
  address: string
  industry: string
  url: string
  status: string
  source: string
  candidates?: { id: string; name: string }[]
}

export const CompanyApi = {
  list: (params?: {
    keyword?: string
    industry?: string
    owner_id?: string
    is_active?: boolean
    limit?: number
    offset?: number
  }) => companiesHttp.get<CompanyListResponse>('', { params }).then((r) => r.data),

  get: (id: string) => companiesHttp.get<CompanyDetail>(`/${id}`).then((r) => r.data),

  create: (payload: {
    name: string
    short_name?: string
    english_abbreviation?: string
    customer_category?: CustomerCategory
    industry?: string
    scale?: string
    url?: string
    address?: string
    owner_id?: string
  }) => companiesHttp.post<CompanyDetail>('', payload).then((r) => r.data),

  update: (id: string, payload: Partial<{
    name: string
    short_name: string
    english_abbreviation: string
    customer_category: CustomerCategory
    industry: string
    scale: string
    url: string
    address: string
  }>) => companiesHttp.put<CompanyDetail>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => companiesHttp.delete(`/${id}`).then(() => true),

  getFull: (id: string) =>
    companiesHttp.get<CompanyFullDetail>(`/${id}/full`).then((r) => r.data),

  lookup: (keyword: string) =>
    companiesHttp.get<CompanyLookupResult>('/lookup', { params: { keyword } }).then((r) => r.data),
}

// ── 线索 API ─────────────────────────────────────────────
const leadsHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/crm/leads` })

export interface LeadItem {
  id: string
  company_name: string
  company_id: string | null
  contact_id: string | null
  industry: string | null
  location: string | null
  contact_name: string
  contact_mobile: string | null
  contact_email: string | null
  contact_position: string | null
  source: string
  status: string
  score: number
  ai_score: number | null
  owner_id: string | null
  sales_owner_id: string | null
  sales_owner_name: string | null
  pool_id: string | null
  tags: string[] | null
  recycle_count: number
  created_at: string | null
  updated_at: string | null
  last_contacted_at: string | null
}

export interface LeadDetail extends LeadItem {
  company_profile: Record<string, unknown> | null
  description: string | null
  convert_company_id: string | null
  convert_contact_id: string | null
  invalid_reason: string | null
}

export interface LeadListResponse {
  total: number
  items: LeadItem[]
  limit: number
  offset: number
}

export interface DuplicateMatch {
  lead_id: string
  company_name: string
  contact_name: string | null
  owner_id: string | null
  status: string | null
  created_at: string | null
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean
  matches: DuplicateMatch[]
}

export interface LeadKanbanColumn {
  status: string
  label: string
  count: number
  leads: LeadItem[]
}

export interface LeadKanbanResponse {
  columns: LeadKanbanColumn[]
}

export interface LeadSourceItem {
  code: string
  label: string
  score: number
  enabled: boolean
}

export interface LeadScoringRule {
  source_scores: Record<string, number>
  scale_scores: Record<string, number>
  industry_match_score: number
  position_scores: Record<string, number>
  invalid_penalty: number
}

export interface LeadImportResult {
  success_count: number
  skip_count: number
  duplicate_count: number
  errors: string[]
  duplicate_leads: DuplicateMatch[]
}

export interface LeadRoleResponse {
  role: string | null
  can_assign: boolean
  can_claim: boolean
  assignable_sales_owner_ids: string[] | null
  sales_owner_options: Array<{ value: string; label: string }>
}

export const LeadApi = {
  getMyRole: () => leadsHttp.get<LeadRoleResponse>('/me/role').then((r) => r.data),

  list: (params?: {
    keyword?: string
    status?: string
    statuses?: string
    source?: string
    owner_id?: string
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
    pool_id?: string
    min_score?: number
    limit?: number
    offset?: number
  }) => leadsHttp.get<LeadListResponse>('', { params }).then((r) => r.data),

  kanban: (params?: {
    keyword?: string
    status?: string
    statuses?: string
    source?: string
    owner_id?: string
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
    min_score?: number
    limit?: number
  }) =>
    leadsHttp.get<LeadKanbanResponse>('/kanban', { params }).then((r) => r.data),

  get: (id: string, params?: {
    owner_id?: string
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
  }) => leadsHttp.get<LeadDetail>(`/${id}`, { params }).then((r) => r.data),

  create: (payload: {
    company_name: string
    company_id?: string
    contact_id?: string | null
    contact_name?: string
    source: string
    contact_mobile?: string
    contact_email?: string
    contact_position?: string
    industry?: string
    location?: string
    tags?: string[]
    description?: string
    pool_id?: string
    sales_owner_id?: string
  }) => leadsHttp.post<LeadDetail>('', payload).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>) =>
    leadsHttp.put<LeadDetail>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => leadsHttp.delete(`/${id}`).then(() => true),

  duplicateCheck: (payload: {
    company_name?: string
    contact_mobile?: string
    contact_name?: string
  }) => leadsHttp.post<DuplicateCheckResponse>('/duplicate-check', payload).then((r) => r.data),

  updateStatus: (id: string, payload: {
    status: string
    reason?: string
    first_contact_content?: string
    next_contact_time?: string
  }) => leadsHttp.post<LeadDetail>(`/${id}/status`, payload).then((r) => r.data),

  assign: (id: string, payload: { sales_owner_id: string; assignment_rule?: string }) =>
    leadsHttp.post<LeadDetail>(`/${id}/assign`, payload).then((r) => r.data),

  claim: (id: string) => leadsHttp.post<LeadDetail>(`/${id}/claim`).then((r) => r.data),

  reclaim: (hours?: number) => leadsHttp.post<{ reclaimed_count: number }>('/reclaim', null, { params: { hours } }).then((r) => r.data),

  pendingReclaim: (days?: number) =>
    leadsHttp.get<LeadListResponse>('/pending-reclaim', { params: { days } }).then((r) => r.data),

  needWarning: (days?: number) =>
    leadsHttp.get<LeadListResponse>('/need-warning', { params: { days } }).then((r) => r.data),

  batchReclaim: (leadIds: string[]) =>
    leadsHttp.post<{ reclaimed_count: number }>('/batch-reclaim', leadIds).then((r) => r.data),

  convert: (id: string, payload: {
    create_company?: boolean
    company_id?: string
    company_name?: string
    contact_name?: string
    contact_mobile?: string
    deal_name?: string
    deal_amount?: number
    project_director?: string
    project_manager?: string
  }) => leadsHttp.post<{
    lead_id: string
    company_id: string | null
    contact_id: string | null
    deal_id: string | null
    message: string
  }>(`/${id}/convert`, payload).then((r) => r.data),

  importTemplate: () => leadsHttp.get<{
    fields: Array<{ name: string; type: string; required: boolean }>
    format: string
    instruction: string
  }>('/import-template').then((r) => r.data),

  importBatch: (rows: Record<string, unknown>[]) =>
    leadsHttp.post<LeadImportResult>('/import', rows).then((r) => r.data),

  companySearch: (keyword: string, limit?: number) =>
    leadsHttp.get<Array<{ id: string; name: string; short_name: string | null; industry: string | null; scale: string | null; url: string | null }>>('/company-search', { params: { keyword, limit } }).then((r) => r.data),

  refreshProfile: (id: string) =>
    leadsHttp.post<LeadDetail>(`/${id}/refresh-profile`).then((r) => r.data),

  listSources: () => leadsHttp.get<LeadSourceItem[]>('/sources').then((r) => r.data),

  createSource: (payload: { code: string; label: string; score?: number; enabled?: boolean }) =>
    leadsHttp.post<LeadSourceItem>('/sources', payload).then((r) => r.data),

  updateSource: (code: string, payload: { label?: string; score?: number; enabled?: boolean }) =>
    leadsHttp.put<LeadSourceItem>(`/sources/${code}`, payload).then((r) => r.data),

  deleteSource: (code: string) => leadsHttp.delete(`/sources/${code}`).then(() => true),

  getScoringRules: () => leadsHttp.get<LeadScoringRule>('/scoring-rules').then((r) => r.data),

  updateScoringRules: (payload: LeadScoringRule) =>
    leadsHttp.put<LeadScoringRule>('/scoring-rules', payload).then((r) => r.data),
}

// ── 商机 API ─────────────────────────────────────────────
const dealsHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/crm/deals` })

export interface CrmRoleResponse {
  role: string | null
  assignable_sales_owner_ids: string[] | null
  sales_owner_options: Array<{ value: string; label: string }>
}

export const getMyCrmRole = () =>
  dealsHttp.get<CrmRoleResponse>('/me/role').then((r) => r.data)

export interface DealItem {
  id: string
  name: string
  number: string | null
  project_id: number | null
  customer_id: number | null
  company_id: string | null
  company_name: string | null
  contact_id: string | null
  amount: number | null
  final_amount: number | null
  level: string | null
  stage: string
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null
  product_lines: string[] | null
  project_director: string | null
  project_director_name: string | null
  project_manager: string | null
  project_manager_name: string | null
  description: string | null
  is_key_project: boolean
  key_project_reason: string | null
  key_project_marked_by: string | null
  needs_leader_support: boolean
  leader_support_reason: string | null
  owner_id: string | null
  owner_name: string | null
  sales_owner_id: string | null
  sales_owner_name: string | null
  status: string
  created_at: string | null
  updated_at: string | null
}

export interface DealDetail extends DealItem {
  lose_reason: string | null
  created_from_lead_id: string | null
}

export interface DealListResponse {
  total: number
  total_amount: number
  won_count: number
  won_amount: number
  items: DealItem[]
  limit: number
  offset: number
}

export interface DealImportIssue {
  row: number
  field: string | null
  message: string
  severity: 'warning' | 'error'
}

export interface DealImportResult {
  sheet_name: string
  total_rows: number
  imported_count: number
  skipped_count: number
  created_companies: number
  reused_companies: number
  warning_count: number
  error_count: number
  issues: DealImportIssue[]
}

export interface PipelineStageSummary {
  stage: string
  count: number
  total_amount: number
  deals: DealItem[]
}

export interface PipelineResponse {
  stages: PipelineStageSummary[]
}

export interface StageHistoryItem {
  id: string
  subject_type: string
  subject_id: string
  from_stage: string | null
  to_stage: string
  duration_seconds: number | null
  operator_id: string | null
  summary: string | null
  created_at: string | null
}

export interface StageHistoryListResponse {
  total: number
  items: StageHistoryItem[]
}

export interface DealWeeklyReportItem {
  id: string
  deal_id: string
  weekly_progress: string | null
  next_week_plan: string | null
  created_by: string | null
  created_by_name: string | null
  deal_name: string | null
  created_at: string | null
}

export interface DealWeeklyReportListResponse {
  total: number
  items: DealWeeklyReportItem[]
  limit: number
  offset: number
}

// ── 赢单前置校验 / 归档邮件 ──────────────────────────────
export interface UnarchivedContractInfo {
  contract_number: string
  contract_name: string
}

export interface DealWinPrecheckResponse {
  status: 'OK' | 'NO_PROJECT' | 'NO_CONTRACT' | 'NOT_ARCHIVED'
  message: string
  unarchived_contracts: UnarchivedContractInfo[]
}

export interface DealArchiveMailResponse {
  success: boolean
  message: string
  to: string[]
  cc: string[]
}

export interface DealArchiveConfirmMailRequest {
  to?: string[]
  cc?: string[]
}

export interface DealArchiveConfirmMailResponse {
  success: boolean
  message: string
  to: string[]
  cc: string[]
}

export interface DealExportParams {
  company_id?: string
  owner_id?: string
  sales_owner_id?: string
  sales_owner_ids?: string
  dashboard_scope?: 'all' | 'mine'
  stage?: string
  status?: string
  keyword?: string
  start_date?: string
  end_date?: string
  expected_close_start_date?: string
  expected_close_end_date?: string
}

export const DealApi = {
  list: (params?: {
    company_id?: string
    owner_id?: string
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
    stage?: string
    status?: string
    keyword?: string
    start_date?: string
    end_date?: string
    expected_close_start_date?: string
    expected_close_end_date?: string
    limit?: number
    offset?: number
  }) => dealsHttp.get<DealListResponse>('', { params }).then((r) => r.data),

  pipeline: (params?: {
    owner_id?: string
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
    start_date?: string
    end_date?: string
    limit?: number
  }) => dealsHttp.get<PipelineResponse>('/pipeline', { params }).then((r) => r.data),

  get: (id: string, params?: {
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
  }) => dealsHttp.get<DealDetail>(`/${id}`, { params }).then((r) => r.data),

  create: (payload: {
    name: string
    number?: string
    company_id?: string
    contact_id?: string
    amount?: number
    expected_close_date?: string
    level?: string
    stage?: string
    probability?: number
    product_lines?: string[]
    project_director?: string
    project_manager?: string
    description?: string
    is_key_project?: boolean
    key_project_reason?: string
    needs_leader_support?: boolean
    leader_support_reason?: string
    owner_id?: string
    sales_owner_id?: string
  }) => dealsHttp.post<DealDetail>('', payload).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>) =>
    dealsHttp.put<DealDetail>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => dealsHttp.delete(`/${id}`).then(() => true),

  advanceStage: (id: string, payload: {
    stage: string
    summary?: string
    next_contact_time?: string
    attachment_urls?: string[]
  }) => dealsHttp.post<DealDetail>(`/${id}/advance`, payload).then((r) => r.data),

  markWon: (id: string, payload: { final_amount?: number; actual_close_date?: string }) =>
    dealsHttp.post<DealDetail>(`/${id}/win`, payload).then((r) => r.data),

  /** 赢单前置校验：项目存在性 → 合同存在性 → 合同归档状态（顺序执行） */
  winPrecheck: (id: string) =>
    dealsHttp.get<DealWinPrecheckResponse>(`/${id}/win-precheck`).then((r) => r.data),

  /** 发送合同归档申请邮件（发件人=当前登录用户，收件人按环境配置解析） */
  sendArchiveMail: (id: string) =>
    dealsHttp.post<DealArchiveMailResponse>(`/${id}/archive-mail/send`).then((r) => r.data),

  /** 发送合同归档核对邮件（赢单成功后自动触发；to/cc 可手动覆盖收件人） */
  sendArchiveConfirmMail: (id: string, payload?: DealArchiveConfirmMailRequest) =>
    dealsHttp.post<DealArchiveConfirmMailResponse>(`/${id}/archive-confirm-mail/send`, payload || {}).then((r) => r.data),

  markLost: (id: string, payload: { lose_reason: string }) =>
    dealsHttp.post<DealDetail>(`/${id}/lose`, payload).then((r) => r.data),

  getStageHistory: (id: string, params?: {
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
  }) =>
    dealsHttp.get<StageHistoryListResponse>(`/${id}/stage-history`, { params }).then((r) => r.data),

  listWeeklyReports: (id: string, params?: {
    limit?: number
    offset?: number
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
  }) =>
    dealsHttp
      .get<DealWeeklyReportListResponse>(`/${id}/weekly-reports`, { params })
      .then((r) => r.data),

  createWeeklyReport: (id: string, payload: {
    weekly_progress?: string
    next_week_plan?: string
  }) => dealsHttp.post<DealWeeklyReportItem>(`/${id}/weekly-reports`, payload).then((r) => r.data),

  updateWeeklyReport: (id: string, reportId: string, payload: {
    deal_id?: string
    weekly_progress?: string
    next_week_plan?: string
  }) => dealsHttp.put<DealWeeklyReportItem>(`/${id}/weekly-reports/${reportId}`, payload).then((r) => r.data),

  importExcel: (file: File) => {
    const form = new FormData()
    form.append('file', file, file.name)
    return dealsHttp
      .post<DealImportResult>('/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      })
      .then((r) => r.data)
  },

  exportExcel: (params?: DealExportParams) =>
    dealsHttp
      .get<Blob>('/export', {
        params,
        responseType: 'blob',
        timeout: 600000,
      })
      .then((r) => r.data),
}

// ── 联系人 API ────────────────────────────────────────────
const contactsHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/crm/contacts` })

export interface ContactItem {
  id: string
  company_id: string | null
  deal_id: string | null
  name: string
  mobile: string | null
  email: string | null
  position: string | null
  is_decision_maker: boolean
  qq_wechat: string | null
  birthday: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface ContactListResponse {
  total: number
  items: ContactItem[]
  limit: number
  offset: number
}

export const ContactApi = {
  list: (params?: {
    company_id?: string
    deal_id?: string
    keyword?: string
    limit?: number
    offset?: number
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
  }) =>
    contactsHttp.get<ContactListResponse>('', { params }).then((r) => r.data),

  get: (id: string) => contactsHttp.get<ContactItem>(`/${id}`).then((r) => r.data),

  create: (payload: {
    company_id?: string
    deal_id?: string
    name: string
    mobile?: string
    email?: string
    position?: string
    is_decision_maker?: boolean
    qq_wechat?: string
    birthday?: string
    note?: string
  }) => contactsHttp.post<ContactItem>('', payload).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>) =>
    contactsHttp.put<ContactItem>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => contactsHttp.delete(`/${id}`).then(() => true),
}

// ── 活动 / 附件共用类型 ────────────────────────────────────
export interface ActivityItem {
  id: string
  subject_type: CrmSubjectType
  subject_id: string
  subject_name: string | null
  type: string
  content: string | null
  content_display: string | null
  created_by: string | null
  created_by_name: string | null
  attachment_urls: string[] | null
  next_remind_at: string | null
  created_at: string
}

export interface ActivityListResponse {
  total: number
  items: ActivityItem[]
  limit: number
  offset: number
}

export interface CompanyFullDetail extends CompanyDetail {
  contacts: ContactItem[]
  leads: LeadItem[]
  deals: DealItem[]
  activities: ActivityItem[]
}

// ── 销售看板 API ─────────────────────────────────────────
const activitiesHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/crm/activities` })
const crmUsersHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/crm/users` })

export const ActivityApi = {
  list: (params?: {
    subject_type?: CrmSubjectType
    subject_id?: string
    limit?: number
    offset?: number
  }) => activitiesHttp.get<ActivityListResponse>('', { params }).then((r) => r.data),

  create: (payload: {
    subject_type: CrmSubjectType
    subject_id: string
    type?: string
    content?: string
    attachment_urls?: string[]
    next_remind_at?: string
  }) => activitiesHttp.post<ActivityItem>('', payload).then((r) => r.data),

  listWeeklyReports: (params?: { limit?: number; offset?: number }) =>
    activitiesHttp
      .get<DealWeeklyReportListResponse>('/weekly-reports', { params })
      .then((r) => r.data),
}

export interface CrmUserItem {
  id: string
  username: string
  display_name: string | null
  cn_name: string | null
  email: string | null
  label: string
}

export interface CrmUserListResponse {
  total: number
  items: CrmUserItem[]
  limit: number
  offset: number
}

export const CrmUserApi = {
  list: (params?: {
    search?: string
    limit?: number
    offset?: number
  }) => crmUsersHttp.get<CrmUserListResponse>('', { params }).then((r) => r.data),

  get: (id: string) => crmUsersHttp.get<CrmUserItem>(`/${id}`).then((r) => r.data),
}

const dashboardHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/crm/dashboard` })

export interface FunnelItem {
  stage: string
  count: number
  total_amount: number
  probability: number
}

export interface AmountBucket {
  label: string
  amount_min: number | null
  amount_max: number | null
  count: number
  high_70_count: number
  high_50_count: number
}

export interface AmountDistribution {
  total_count: number
  total_high_70_count: number
  total_high_50_count: number
  buckets: AmountBucket[]
}

export interface PeriodMetric {
  name: string
  current_value: number
  previous_value: number
  change_pct: number
  warning: string | null
}

export interface PeriodComparison {
  period_type: string
  current_label: string
  previous_label: string
  metrics: PeriodMetric[]
}

export interface TopSalesItem {
  sales_owner_id: string
  username: string
  deal_count: number
  total_amount: number
  won_count: number
  won_amount: number
}

export interface SalesPerformanceItem {
  sales_owner_id: string
  username: string
  annual_deal_count: number
  annual_estimated_amount: number
  signed_amount: number
  current_month_expected_amount: number
  next_month_expected_amount: number
  expected_total_by_next_month: number
}

export interface KeyProjectItem {
  deal_id: string
  sales_owner_id: string | null
  username: string | null
  company_name: string | null
  project_name: string
  amount: number
  stage: string
  weekly_progress: string | null
  next_follow_up_at: string | null
  probability: number
  expected_close_date: string | null
  latest_follow_up_at: string | null
  key_project_reason: string | null
  key_project_marked_by: string | null
  key_project_marked_by_name: string | null
  updated_at: string | null
}

export interface LeadershipSupportItem {
  deal_id: string
  sales_owner_id: string | null
  username: string | null
  company_name: string | null
  project_name: string
  amount: number
  stage: string
  probability: number
  expected_close_date: string | null
  leader_support_reason: string | null
  latest_progress: string | null
  next_follow_up_at: string | null
  latest_follow_up_at: string | null
  updated_at: string | null
}

export interface SalesDashboardResponse {
  funnel: FunnelItem[]
  amount_distribution: AmountDistribution
  period_comparison: PeriodComparison
  sales_performance: SalesPerformanceItem[]
  key_projects: KeyProjectItem[]
  leadership_support: LeadershipSupportItem[]
  top_sales: TopSalesItem[]
}

export interface DashboardPermission {
  role_code: string | null
  allowed_org_ids: string[]
  allowed_user_ids: string[]
  can_filter_all_regions: boolean
  can_filter_all_sales: boolean
  org_path: string[]
}

export const DashboardApi = {
  getSalesDashboard: (params?: {
    period_type?: string
    start_date?: string
    end_date?: string
    sales_owner_id?: string
    sales_owner_ids?: string
    funnel_period_type?: string
    amount_period_type?: string
    sales_performance_period_type?: string
    expected_close_start_date?: string
    expected_close_end_date?: string
    dashboard_scope?: 'all' | 'mine'
    sections?: string
  }) => dashboardHttp.get<SalesDashboardResponse>('/sales', { params }).then((r) => r.data),
  getPeriodComparison: (params?: {
    period_type?: string
    start_date?: string
    end_date?: string
    sales_owner_id?: string
    sales_owner_ids?: string
    dashboard_scope?: 'all' | 'mine'
  }) => dashboardHttp.get<PeriodComparison>('/sales/period-comparison', { params }).then((r) => r.data),
  getDashboardPermissions: () =>
    dashboardHttp.get<DashboardPermission>('/permissions').then((r) => r.data),
}
