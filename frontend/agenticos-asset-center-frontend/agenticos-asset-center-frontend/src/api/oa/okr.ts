import { createHttp } from "../http";
import { API_PROXY_PREFIX } from "./constants";
import { READONLY_SELF_SERVICE_HEADER } from "../interceptor";



const okrHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/oa/okr` });

// ── OKR 类型定义 ──────────────────────────────────────────

export interface OkrPeriodItem {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  period_type: string;
  status: string;
  is_current: boolean;
  scoring_enabled: boolean;
  created_at: string | null;
}

export interface OkrPeriodListResponse {
  items: OkrPeriodItem[];
  current_id: string | null;
}

export type OkrPermissionScope =
  | "global"
  | "period"
  | "objective"
  | "key_result";
export type OkrPermissionType = "public" | "superiors" | "custom";

export interface OkrPermissionItem {
  scope_type: OkrPermissionScope;
  scope_id: string | null;
  permission_type: OkrPermissionType;
  include_public: boolean;
  allow_user_ids: string[];
  deny_user_ids: string[];
  inherited: boolean;
  inherited_from: string | null;
}

export interface OkrPermissionOverview {
  owner_id: string;
  period_id: string;
  items: OkrPermissionItem[];
}

export interface OkrPermissionUpdateRequest {
  scope_type: OkrPermissionScope;
  scope_id?: string | null;
  permission_type: OkrPermissionType;
  include_public?: boolean;
  allow_user_ids?: string[];
  deny_user_ids?: string[];
}

export interface OkrDashboardDepartmentItem {
  department_id: string;
  department_name: string;
  people_count: number;
  people_with_okr: number;
  objective_count: number;
  average_progress: number;
  review_rate: number;
  alignment_rate: number;
}

export interface OkrDashboardResponse {
  period: OkrPeriodItem;
  total_people: number;
  people_with_okr: number;
  objective_count: number;
  coverage_rate: number;
  weekly_update_rate: number;
  average_progress: number;
  review_rate: number;
  alignment_rate: number;
  low_quality_rate: number;
  average_score: number;
  risk_objectives: number;
  progress_distribution: Array<{ name: string; value: number }>;
  status_distribution: Array<{ name: string; value: number }>;
  score_distribution: Array<{ name: string; value: number }>;
  update_frequency_distribution: Array<{ name: string; value: number }>;
  departments: OkrDashboardDepartmentItem[];
}

export type OkrReminderType = "fill_okr" | "update_progress" | "review";

export interface OkrReminderCandidateItem {
  user_id: string;
  user_name: string;
  department_id: string | null;
  department_name: string | null;
  reason: string;
  can_remind: boolean;
  last_reminded_at: string | null;
}

export interface OkrReminderCandidatesResponse {
  period_id: string;
  reminder_type: OkrReminderType;
  cooldown_hours: number;
  items: OkrReminderCandidateItem[];
}

export interface OkrReminderResponse {
  sent_count: number;
  skipped_count: number;
  items: Array<{
    user_id: string;
    status: "sent" | "skipped";
    reason: "recently_reminded" | "no_longer_eligible" | null;
  }>;
}

export interface PeriodCreateRequest {
  name: string;
  start_date: string;
  end_date: string;
  period_type: string;
}

export interface PeriodUpdateRequest {
  name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  period_type?: string | null;
  scoring_enabled?: boolean | null;
}

export interface KrItem {
  kr_index: number;
  kr_id: string;
  title: string;
  weight: number;
  kr_type: OkrType;
  progress: number;
  score: number | null;
  status?: ProgressStatus;
  progress_count?: number;
  is_locked: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface KrUpsertRequest {
  kr_id?: string | null;
  title: string;
  weight: number;
  kr_type?: OkrType;
}

export interface OkrRecordSummary {
  id: string;
  owner_id: string;
  period_id: string;
  objective_index: number;
  objective_title: string;
  objective_note: string | null;
  is_published: boolean;
  is_locked: boolean;
  visibility: string;
  key_results: KrItem[];
  progress_summary: {
    overall_progress: number;
    last_updated_at: string;
    progress_count: number;
    status?: ProgressStatus;
    okr_type?: OkrType;
  };
  alignment_summary: {
    upstream_count: number;
    downstream_count: number;
  };
  review_summary: {
    is_scored: boolean;
    objective_score: number | null;
  };
  comment_count: number;
  created_at: string | null;
  updated_at?: string | null;
}

export interface OkrUserViewResponse {
  period: OkrPeriodItem | null;
  owner: { id: string; name: string; avatar: string | null; dept_name: string };
  records: OkrRecordSummary[];
}

export interface OkrSidebarUserItem {
  user_id: string;
  name: string;
  avatar: string | null;
}

export interface OkrSidebarUsersResponse {
  followed: OkrSidebarUserItem[];
  aligned: OkrSidebarUserItem[];
}

export interface OkrAlignmentGraphNode {
  id: string;
  owner_id: string;
  owner_name: string;
  period_id: string;
  objective_index: number;
  objective_title: string;
  key_results: KrItem[];
  overall_progress: number;
  okr_type: OkrType;
  progress_count: number;
  objective_score: number | null;
  upstream_count: number;
  downstream_count: number;
}

export interface OkrAlignmentGraphEdge {
  source_record_id: string;
  target_record_id: string;
  center_record_id: string;
  direction: "upstream" | "downstream";
  source_kr_id: string | null;
  target_kr_id: string | null;
}

export interface OkrAlignmentGraphResponse {
  nodes: OkrAlignmentGraphNode[];
  edges: OkrAlignmentGraphEdge[];
}

export interface OkrRecordCreateRequest {
  period_id?: string;
  objective_title: string;
  objective_note?: string | null;
  key_results?: KrUpsertRequest[];
  visibility?: string;
}

export interface OkrRecordUpdateRequest {
  objective_title?: string | null;
  objective_note?: string | null;
  key_results?: KrUpsertRequest[] | null;
  visibility?: string | null;
}

export interface ProgressUpdateRequest {
  /** null 表示 O，字符串表示具体 KR。 */
  kr_id: string | null;
  progress: number;
  confidence: number;
  content?: string;
  status?: ProgressStatus;
  score?: number | null;
  okr_type?: OkrType;
}

export type ProgressStatus = "none" | "normal" | "risk" | "delayed";
export type OkrType = "commitment" | "challenge";

export interface ProgressUpdateResponse {
  success: boolean;
  progress_id: string;
  kr_progress: number;
  objective_overall_progress: number;
}

export interface OkrRecordDetail extends OkrRecordSummary {
  alignment_json: {
    upstream: AlignmentItem[];
    downstream: AlignmentItem[];
  } | null;
  progress_history: ProgressHistoryItem[];
  review_json: {
    kr_scores: Record<string, number>;
    objective_score: number | null;
    dimensions: Record<string, number>;
    summary: Record<string, string>;
    scored_by: string | null;
    scored_by_name: string | null;
    scored_at: string | null;
  } | null;
  sort_order: number;
  version: number;
}

export interface AlignmentItem {
  record_id: string;
  owner_id: string;
  owner_name: string;
  kr_id: string | null;
  source_kr_id?: string | null;
  target_kr_id?: string | null;
  alignment_type: string;
  created_at: string | null;
}

export interface ProgressHistoryItem {
  progress_id: string;
  kr_id: string | null;
  progress: number;
  confidence: number;
  content: string;
  status?: ProgressStatus;
  score?: number | null;
  okr_type?: OkrType;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at?: string;
  likes: string[];
  comments: ProgressHistoryComment[];
}

export interface ProgressHistoryComment {
  comment_id: string;
  content: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface ProgressHistoryUpdateRequest {
  content?: string;
  progress?: number;
  status?: ProgressStatus;
  score?: number;
  okr_type?: OkrType;
}

export interface AlignmentAddRequest {
  kr_id?: string | null;
  target_record_id: string;
  target_kr_id?: string | null;
  alignment_type: string;
}

export interface AlignmentTargetItem {
  record_id: string;
  objective_title: string;
  objective_index: number;
  owner_id: string;
  owner_name: string;
  dept_name: string;
  key_results: { kr_id: string; title: string }[];
}

export interface ReviewSubmitRequest {
  kr_scores: Record<string, number>;
  dimensions: Record<string, number>;
  summary: Record<string, string>;
}

export interface CommentItem {
  id: string;
  record_id: string;
  kr_id: string | null;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  parent_id: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string | null;
  replies: CommentItem[];
}

export interface CommentListResponse {
  items: CommentItem[];
  total: number;
}

export interface CommentCreateRequest {
  kr_id?: string | null;
  content: string;
  parent_id?: string | null;
}

export interface CommentUpdateRequest {
  is_resolved: boolean;
}

export interface OkrOrgTreeNode {
  id: string;
  name: string;
  type: "org" | "user";
  children: OkrOrgTreeNode[];
  user_count: number;
  avatar: string | null;
  user_id: string | null;
}

// ── @mention 用户搜索 ─────────────────────────────────────

export interface OkrUserBrief {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface OkrUserSearchResponse {
  items: OkrUserBrief[];
}

// ── # 项目搜索（周报快捷引用） ──────────────────────────────

export interface WeeklyReportProjectItem {
  /** internal=研发项目 / deal=在途商机 / won_deal=赢单企业项目 */
  type: "internal" | "deal" | "won_deal";
  id: string;
  name: string;
  number: string | null;
  subtitle: string;
  won: boolean;
}

export interface WeeklyReportProjectSearchResponse {
  items: WeeklyReportProjectItem[];
}

// ── @我的 OKR ────────────────────────────────────────────

export interface MentionItem {
  record_id: string;
  objective_title: string;
  objective_index: number;
  owner_id: string;
  owner_name: string;
  dept_name: string;
  match_type: string; // "o_title" | "kr_title" | "o_note" | "progress" | "review"
  match_detail: string;
  kr_id: string | null;
  kr_index: number | null;
  kr_title: string | null;
}

export interface CommentMentionItem {
  comment_id: string;
  record_id: string;
  objective_title: string;
  objective_index: number;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string | null;
  owner_id: string;
  owner_name: string;
  dept_name: string;
}

export interface AtMeResponse {
  objectives: MentionItem[];
  comments: CommentMentionItem[];
  reviews: MentionItem[];
}

// ── OKR API ───────────────────────────────────────────────

export const OkrApi = {
  // 周期
  listPeriods: () =>
    okrHttp.get<OkrPeriodListResponse>("/periods").then((r) => r.data),

  getCurrentPeriod: () =>
    okrHttp.get<OkrPeriodItem | null>("/periods/current").then((r) => r.data),

  getPermissions: (periodId: string) =>
    okrHttp
      .get<OkrPermissionOverview>("/permissions", {
        params: { period_id: periodId },
      })
      .then((r) => r.data),

  savePermission: (payload: OkrPermissionUpdateRequest) =>
    okrHttp
      .put<OkrPermissionItem>("/permissions", payload)
      .then((r) => r.data),

  restorePermission: (
    scopeType: OkrPermissionScope,
    scopeId?: string | null,
  ) =>
    okrHttp
      .delete("/permissions", {
        params: {
          scope_type: scopeType,
          ...(scopeId ? { scope_id: scopeId } : {}),
        },
      })
      .then((r) => r.data),

  getDashboard: (periodId: string, departmentId?: string) =>
    okrHttp
      .get<OkrDashboardResponse>("/dashboard", {
        params: {
          period_id: periodId,
          ...(departmentId ? { department_id: departmentId } : {}),
        },
      })
      .then((r) => r.data),

  getReminderCandidates: (
    periodId: string,
    reminderType: OkrReminderType,
    departmentId?: string,
  ) =>
    okrHttp
      .get<OkrReminderCandidatesResponse>(
        `/periods/${periodId}/reminder-candidates`,
        {
          params: {
            reminder_type: reminderType,
            ...(departmentId ? { department_id: departmentId } : {}),
          },
        },
      )
      .then((r) => r.data),

  sendReminders: (
    periodId: string,
    reminderType: OkrReminderType,
    userIds: string[],
  ) =>
    okrHttp
      .post<OkrReminderResponse>(`/periods/${periodId}/reminders`, {
        reminder_type: reminderType,
        user_ids: userIds,
      })
      .then((r) => r.data),

  createPeriod: (payload: PeriodCreateRequest) =>
    okrHttp.post<OkrPeriodItem>("/periods", payload).then((r) => r.data),

  updatePeriod: (id: string, payload: PeriodUpdateRequest) =>
    okrHttp.put<OkrPeriodItem>(`/periods/${id}`, payload).then((r) => r.data),

  activatePeriod: (id: string) =>
    okrHttp.post<OkrPeriodItem>(`/periods/${id}/activate`).then((r) => r.data),

  startReview: (id: string) =>
    okrHttp
      .post<OkrPeriodItem>(`/periods/${id}/start-review`)
      .then((r) => r.data),

  closePeriod: (id: string) =>
    okrHttp.post<OkrPeriodItem>(`/periods/${id}/close`).then((r) => r.data),

  // OKR 记录
  getUserView: (params?: { period_id?: string; owner_id?: string }) =>
    okrHttp
      .get<OkrUserViewResponse>("/records", { params })
      .then((r) => r.data),

  getSidebarUsers: (periodId?: string) =>
    okrHttp
      .get<OkrSidebarUsersResponse>("/sidebar/users", {
        params: periodId ? { period_id: periodId } : {},
      })
      .then((r) => r.data),

  getAlignmentGraph: (params?: { period_id?: string; owner_id?: string }) =>
    okrHttp
      .get<OkrAlignmentGraphResponse>("/alignment/graph", { params })
      .then((r) => r.data),

  followUser: (userId: string, periodId?: string) =>
    okrHttp
      .put<OkrSidebarUsersResponse>(`/follows/${userId}`, null, {
        params: periodId ? { period_id: periodId } : {},
      })
      .then((r) => r.data),

  unfollowUser: (userId: string, periodId?: string) =>
    okrHttp
      .delete<OkrSidebarUsersResponse>(`/follows/${userId}`, {
        params: periodId ? { period_id: periodId } : {},
      })
      .then((r) => r.data),

  getRecordDetail: (id: string) =>
    okrHttp.get<OkrRecordDetail>("/records/" + id).then((r) => r.data),

  createRecord: (payload: OkrRecordCreateRequest) =>
    okrHttp.post<OkrRecordDetail>("/records", payload).then((r) => r.data),

  updateRecord: (id: string, payload: OkrRecordUpdateRequest) =>
    okrHttp.put<OkrRecordDetail>("/records/" + id, payload).then((r) => r.data),

  deleteRecord: (id: string) =>
    okrHttp.delete("/records/" + id).then((r) => r.data),

  publishRecord: (id: string) =>
    okrHttp
      .post<OkrRecordDetail>("/records/" + id + "/publish")
      .then((r) => r.data),

  lockRecord: (id: string) =>
    okrHttp
      .post<OkrRecordDetail>("/records/" + id + "/lock")
      .then((r) => r.data),

  unlockRecord: (id: string) =>
    okrHttp
      .post<OkrRecordDetail>("/records/" + id + "/unlock")
      .then((r) => r.data),

  // 进度
  updateProgress: (recordId: string, payload: ProgressUpdateRequest) =>
    okrHttp
      .post<ProgressUpdateResponse>(`/records/${recordId}/progress`, payload)
      .then((r) => r.data),

  updateProgressHistory: (
    recordId: string,
    progressId: string,
    payload: ProgressHistoryUpdateRequest,
  ) =>
    okrHttp
      .put<OkrRecordDetail>(
        `/records/${recordId}/progress/${progressId}`,
        payload,
      )
      .then((r) => r.data),

  deleteProgressHistory: (recordId: string, progressId: string) =>
    okrHttp
      .delete<OkrRecordDetail>(`/records/${recordId}/progress/${progressId}`)
      .then((r) => r.data),

  toggleProgressLike: (recordId: string, progressId: string) =>
    okrHttp
      .post<OkrRecordDetail>(`/records/${recordId}/progress/${progressId}/like`)
      .then((r) => r.data),

  createProgressComment: (
    recordId: string,
    progressId: string,
    content: string,
  ) =>
    okrHttp
      .post<OkrRecordDetail>(
        `/records/${recordId}/progress/${progressId}/comments`,
        { content },
      )
      .then((r) => r.data),

  // 对齐
  addAlignment: (recordId: string, payload: AlignmentAddRequest) =>
    okrHttp.post(`/records/${recordId}/align`, payload).then((r) => r.data),

  removeAlignment: (recordId: string, targetId: string) =>
    okrHttp
      .delete(`/records/${recordId}/align/${targetId}`)
      .then((r) => r.data),

  searchAlignmentTargets: (params?: { period_id?: string; keyword?: string }) =>
    okrHttp
      .get<AlignmentTargetItem[]>("/alignment/search", { params })
      .then((r) => r.data),

  // 复盘
  submitReview: (recordId: string, payload: ReviewSubmitRequest) =>
    okrHttp.post(`/records/${recordId}/review`, payload).then((r) => r.data),

  // 评论
  listComments: (recordId: string, krId?: string) =>
    okrHttp
      .get<CommentListResponse>(`/records/${recordId}/comments`, {
        params: krId ? { kr_id: krId } : {},
      })
      .then((r) => r.data),

  createComment: (recordId: string, payload: CommentCreateRequest) =>
    okrHttp
      .post<CommentItem>(`/records/${recordId}/comments`, payload)
      .then((r) => r.data),

  updateComment: (commentId: string, payload: CommentUpdateRequest) =>
    okrHttp
      .put<CommentItem>(`/comments/${commentId}`, payload)
      .then((r) => r.data),

  deleteComment: (commentId: string) =>
    okrHttp.delete(`/comments/${commentId}`).then((r) => r.data),

  // 组织树
  getOrgTree: () =>
    okrHttp.get<OkrOrgTreeNode[]>("/org-tree").then((r) => r.data),

  // 用户搜索（用于 @mention）
  searchUsers: (q: string) =>
    okrHttp
      .get<OkrUserSearchResponse>("/users/search", { params: { q } })
      .then((r) => r.data.items),

  // @我的 OKR
  getAtMe: () => okrHttp.get<AtMeResponse>("/mentions/me").then((r) => r.data),
};

// ═══════════════════════════════════════════════════════════
// 周报管理 API
// ═══════════════════════════════════════════════════════════

const weeklyReportHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/weekly-report`,
});

// ── 周报类型定义 ──────────────────────────────────────────

export interface WeekPeriodOption {
  year: number;
  week_number: number;
  label: string;
  start_date: string;
  end_date: string;
}

export interface WeeklyReportItem {
  id: string;
  rule_id: string;
  rule_name: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  dept_name: string;
  year: number;
  week_number: number;
  week_start: string;
  week_end: string;
  status: "draft" | "submitted";
  summary_preview: string;
  content_sections?: Array<{ id: string; label: string; content: string }>;
  coordination_help: boolean;
  mention_count: number;
  submitted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_following_author?: boolean;
}

export interface WeeklyReportDetail extends WeeklyReportItem {
  rule_version: number;
  fields: WeeklyReportField[];
  content: Record<string, string>;
  mentions: string[];
  okr_links: WeeklyReportOkrLink[];
  created_by: string | null;
  updated_by: string | null;
  version: number;
  can_edit: boolean;
  edit_deadline: string | null;
  lock_reason: "period_ended" | null;
  can_delete: boolean;
  can_annotate: boolean;
  can_reply_annotations: boolean;
  can_resolve_annotations: boolean;
}

export interface WeeklyReportAiComparisonResponse {
  current_period: string;
  previous_period: string | null;
  has_previous: boolean;
  summary: {
    technical_achievements: string[];
    ongoing_work: string[];
    risks_and_blockers: string[];
    next_week_focus: string[];
  };
  comparison: {
    completed_from_last_plan: string[];
    continued: string[];
    new_items: string[];
    not_mentioned: string[];
    risk_changes: string[];
  };
  overall_assessment: string;
}

export interface WeeklyReportListResponse {
  items: WeeklyReportItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface WeeklyReportField {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
  semantic_key?: string | null;
}

export interface WeeklyReportRule {
  id: string;
  name: string;
  preset_code: string | null;
  field_config: WeeklyReportField[];
  scope_type: string;
  scope_config: { org_ids?: string[]; user_ids?: string[]; department_ids?: string[] };
  is_enabled: boolean;
  applicable_to_current_user: boolean;
  version: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface WeeklyReportRulePayload {
  name: string;
  preset_code?: "work_weekly" | null;
  field_config: WeeklyReportField[];
  scope_type: string;
  scope_config: { org_ids?: string[]; user_ids?: string[] };
  is_enabled: boolean;
}

export interface WeeklyReportTeamMember {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  dept_id: string | null;
  dept_name: string;
  is_following?: boolean;
}

export interface WeeklyReportTeamGroup {
  id: string;
  name: string;
  sort_order: number;
  members: WeeklyReportTeamMember[];
  member_count: number;
  created_at: string | null;
  updated_at: string | null;
  is_shared: boolean;
  can_manage: boolean;
}

export interface WeeklyReportSystemTeamGroup {
  key: "peer_team";
  name: "我的团队";
  members: WeeklyReportTeamMember[];
  member_count: number;
}

export interface WeeklyReportTeamWorkspace {
  can_view_team: boolean;
  default_group_label: "我的团队" | "全部下属";
  members: WeeklyReportTeamMember[];
  peer_group: WeeklyReportSystemTeamGroup | null;
  searchable_members: WeeklyReportTeamMember[];
  following_members: WeeklyReportTeamMember[];
  groups: WeeklyReportTeamGroup[];
}

export interface WeeklyReportTeamStatisticsMember extends WeeklyReportTeamMember {
  status: "submitted" | "draft" | "not_submitted";
  requirement_status?: "required" | "holiday_exempt" | "leave_exempt" | "pending_verification";
  requirement_reason?: string;
  report_id: string | null;
  submitted_at: string | null;
  updated_at: string | null;
}

export interface WeeklyReportTeamStatistics {
  rule_id: string;
  year: number;
  week_number: number;
  can_remind: boolean;
  expected_count: number;
  submitted_count: number;
  draft_count: number;
  not_submitted_count: number;
  exempt_count: number;
  pending_verification_count: number;
  submission_rate: number;
  members: WeeklyReportTeamStatisticsMember[];
}

export interface WeeklyReportAnnotation {
  id: string;
  weekly_report_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  parent_id: string | null;
  field_id: string | null;
  anchor_text: string | null;
  anchor_start: number | null;
  anchor_end: number | null;
  report_version: number | null;
  is_resolved: boolean;
  resolved_reason: "manual" | "content_changed" | null;
  resolved_by: string | null;
  resolved_at: string | null;
  mentions: string[];
  created_at: string | null;
  updated_at: string | null;
  replies: WeeklyReportAnnotation[];
}

export interface WeeklyReportOkrLinkRequest {
  okr_record_id: string;
  kr_id?: string | null;
}

export interface WeeklyReportOkrLink extends WeeklyReportOkrLinkRequest {
  id: string | null;
  snapshot: Record<string, unknown>;
  sort_order: number;
}

export interface WeeklyReportOkrOption {
  okr_record_id: string;
  kr_id: string | null;
  label: string;
  objective_title: string;
  progress: number;
  status: string;
  latest_progress: string;
}

export interface WeeklyReportCreateRequest {
  rule_id: string;
  year: number;
  week_number: number;
  content: Record<string, string>;
  okr_links: WeeklyReportOkrLinkRequest[];
}

export interface WeeklyReportUpdateRequest {
  content: Record<string, string>;
  okr_links: WeeklyReportOkrLinkRequest[];
}

// ── 周报 API ───────────────────────────────────────────────

export const WeeklyReportApi = {
  listReports: (params?: {
    rule_id?: string;
    owner_id?: string;
    year?: number;
    week_number?: number;
    keyword?: string;
    page?: number;
    page_size?: number;
  }) =>
    weeklyReportHttp
      .get<WeeklyReportListResponse>("/reports", { params })
      .then((r) => r.data),

  getReport: (id: string) =>
    weeklyReportHttp
      .get<WeeklyReportDetail>(`/reports/${id}`)
      .then((r) => r.data),

  generateAiComparison: (id: string) =>
    weeklyReportHttp
      .post<WeeklyReportAiComparisonResponse>(`/reports/${id}/ai-comparison`, undefined, {
        headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
      })
      .then((r) => r.data),

  getMyReportByWeek: (ruleId: string, year: number, weekNumber: number) =>
    weeklyReportHttp
      .get<WeeklyReportDetail | null>("/reports/mine-by-week", {
        params: { rule_id: ruleId, year, week_number: weekNumber },
      })
      .then((r) => r.data),

  getMyReportByPeriod: (ruleId: string, year: number, periodNumber: number) =>
    weeklyReportHttp
      .get<WeeklyReportDetail | null>("/reports/mine-by-period", {
        params: { rule_id: ruleId, year, week_number: periodNumber },
      })
      .then((r) => r.data),

  createReport: (body: WeeklyReportCreateRequest) =>
    weeklyReportHttp
      .post<WeeklyReportDetail>("/reports", body, { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } })
      .then((r) => r.data),

  autoSaveReport: (body: WeeklyReportCreateRequest) =>
    weeklyReportHttp
      .post<WeeklyReportDetail>("/reports/auto-save", body, { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } })
      .then((r) => r.data),

  updateReport: (id: string, body: WeeklyReportUpdateRequest) =>
    weeklyReportHttp
      .put<WeeklyReportDetail>(`/reports/${id}`, body, { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } })
      .then((r) => r.data),

  submitReport: (id: string) =>
    weeklyReportHttp.post<WeeklyReportDetail>(`/reports/${id}/submit`, undefined, { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } }).then((r) => r.data),

  deleteReport: (id: string) =>
    weeklyReportHttp.delete(`/reports/${id}`, { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } }).then((r) => r.data),

  getWeekPeriods: (before = 104, after = 12) =>
    weeklyReportHttp
      .get<WeekPeriodOption[]>("/week-periods", { params: { before, after } })
      .then((r) => r.data),

  getOrgTree: () =>
    weeklyReportHttp.get<OkrOrgTreeNode[]>("/org-tree").then((r) => r.data),

  getSearchOrgTree: () =>
    weeklyReportHttp.get<OkrOrgTreeNode[]>("/search-org-tree").then((r) => r.data),

  getRuleScopeOrgTree: () =>
    weeklyReportHttp.get<OkrOrgTreeNode[]>("/rule-scope-org-tree").then((r) => r.data),

  getAtMe: (params?: { rule_id?: string; page?: number; page_size?: number }) =>
    weeklyReportHttp
      .get<WeeklyReportListResponse>("/reports/at-me", { params })
      .then((r) => r.data),

  getFollowing: (params?: { rule_id?: string; year?: number; week_number?: number; keyword?: string; page?: number; page_size?: number }) =>
    weeklyReportHttp.get<WeeklyReportListResponse>("/reports/following", { params }).then((r) => r.data),
  followUser: (userId: string) => weeklyReportHttp
    .put(`/follows/${userId}`, undefined, {
      headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
    })
    .then((r) => r.data),
  unfollowUser: (userId: string) => weeklyReportHttp
    .delete(`/follows/${userId}`, {
      headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
    })
    .then((r) => r.data),

  listRules: () =>
    weeklyReportHttp
      .get<{ items: WeeklyReportRule[]; can_manage: boolean }>("/rules")
      .then((r) => r.data),

  createRule: (body: WeeklyReportRulePayload) =>
    weeklyReportHttp.post<WeeklyReportRule>("/rules", body).then((r) => r.data),

  updateRule: (id: string, body: WeeklyReportRulePayload) =>
    weeklyReportHttp.put<WeeklyReportRule>(`/rules/${id}`, body).then((r) => r.data),

  deleteRule: (id: string) =>
    weeklyReportHttp.delete(`/rules/${id}`).then((r) => r.data),

  getTeamWorkspace: () =>
    weeklyReportHttp.get<WeeklyReportTeamWorkspace>("/team/workspace").then((r) => r.data),

  getTeamStatistics: (params: {
    rule_id: string;
    year: number;
    week_number: number;
  }) => weeklyReportHttp
    .get<WeeklyReportTeamStatistics>("/team/statistics", { params })
    .then((r) => r.data),

  remindTeamMembers: (body: {
    rule_id: string;
    year: number;
    week_number: number;
    user_ids?: string[];
  }) => weeklyReportHttp
    .post<{ sent_count: number; skipped_count: number }>("/team/reminders", body)
    .then((r) => r.data),

  listTeamReports: (params?: {
    user_ids?: string[];
    rule_id?: string;
    year?: number;
    week_number?: number;
    keyword?: string;
    page?: number;
    page_size?: number;
  }) => weeklyReportHttp.post<WeeklyReportListResponse>(
    "/team/reports/query",
    params || {},
    { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } },
  ).then((r) => r.data),

  createTeamGroup: (body: { name: string; user_ids: string[]; is_shared?: boolean }) =>
    weeklyReportHttp
      .post<WeeklyReportTeamGroup>("/team/groups", body, {
        headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
      })
      .then((r) => r.data),

  updateTeamGroup: (id: string, body: { name: string; user_ids: string[]; is_shared?: boolean }) =>
    weeklyReportHttp
      .put<WeeklyReportTeamGroup>(`/team/groups/${id}`, body, {
        headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
      })
      .then((r) => r.data),

  deleteTeamGroup: (id: string) =>
    weeklyReportHttp
      .delete(`/team/groups/${id}`, {
        headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
      })
      .then((r) => r.data),

  listAnnotations: (reportId: string) =>
    weeklyReportHttp.get<{ items: WeeklyReportAnnotation[]; total: number }>(`/reports/${reportId}/annotations`).then((r) => r.data),

  listAnnotationsBatch: (reportIds: string[]) =>
    weeklyReportHttp.get<{ reports: Record<string, { items: WeeklyReportAnnotation[]; total: number }> }>("/annotations/batch", {
      params: { report_ids: reportIds.join(",") },
    }).then((r) => r.data),

  createAnnotation: (reportId: string, body: { content: string; field_id?: string; anchor_text?: string; anchor_start?: number; anchor_end?: number; parent_id?: string | null }) =>
    weeklyReportHttp.post<WeeklyReportAnnotation>(`/reports/${reportId}/annotations`, body).then((r) => r.data),

  resolveAnnotation: (reportId: string, annotationId: string, isResolved = true) =>
    weeklyReportHttp.patch<WeeklyReportAnnotation>(`/reports/${reportId}/annotations/${annotationId}`, { is_resolved: isResolved }).then((r) => r.data),

  updateAnnotation: (reportId: string, annotationId: string, content: string) =>
    weeklyReportHttp.put<WeeklyReportAnnotation>(
      `/reports/${reportId}/annotations/${annotationId}`,
      { content },
      { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } },
    ).then((r) => r.data),

  deleteAnnotation: (reportId: string, annotationId: string) =>
    weeklyReportHttp.delete(
      `/reports/${reportId}/annotations/${annotationId}`,
      { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } },
    ).then((r) => r.data),

  getOkrOptions: (year?: number, weekNumber?: number) =>
    weeklyReportHttp
      .get<WeeklyReportOkrOption[]>("/okr-options", {
        params: year && weekNumber ? { year, week_number: weekNumber } : undefined,
      })
      .then((r) => r.data),

  searchUsers: (q: string) =>
    weeklyReportHttp
      .get<OkrUserSearchResponse>("/users/search", { params: { q } })
      .then((r) => r.data.items),

  searchProjects: (q: string, limit = 8) =>
    weeklyReportHttp
      .get<WeeklyReportProjectSearchResponse>("/projects/search", {
        params: { q, limit },
      })
      .then((r) => r.data.items),
};

// ── 人事模块管理 ─────────────────────────────────────────────────────────────
