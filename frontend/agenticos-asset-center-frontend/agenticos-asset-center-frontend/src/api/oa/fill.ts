import {createHttp} from "../http";
import {READONLY_SELF_SERVICE_HEADER} from "../interceptor";
import type {AuthUserResponse} from "../auth";
import {API_PROXY_PREFIX} from "./constants";
import type {OptionItem} from "./contract";
import {fetchAllOrgs, fetchAllUsers, toUserOption} from "./contract";
import type {InviteeRequestItem} from "./project";


// ── 通用文件上传 ──────────────────────────────────────────
export interface FileUploadResult {
  file_object_id: string;
  original_name: string;
  display_name: string;
}

const filesHttp = createHttp({ baseURL: `/api/v1/files` });

export const FileApi = {
  upload: (file: File, moduleCode: string = "oa_profile", bizType?: string, readonlySelfService = false) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("module_code", moduleCode);
    if (bizType) formData.append("biz_type", bizType);
    return filesHttp
      .post<FileUploadResult>("/upload", formData, readonlySelfService ? {
        headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
      } : undefined)
      .then((r) => r.data);
  },
  getDownloadUrl: (fileObjectId: string) =>
    `/api/v1/files/${fileObjectId}/download`,
};


/** 项目选项（供填报页下拉使用，合并 CRM 商机 + 内部项目） */
export interface DealProjectItem {
  id: string; // crm_deals.id 或 oa_internal_projects.id
  name: string; // 项目名称
  number: string | null; // 项目编号
  source?: string; // "crm" | "internal"
  is_general?: boolean; // 是否为综合类工时项目（仅 internal 来源时有效）
}

export interface ProjectListResponse {
  total: number;
  items: DealProjectItem[];
}

/** 可申请加入的项目（合并销售项目 + 研发项目） */
export interface JoinableProjectItem {
  id: string;                          // crm_deals.id 或 oa_internal_projects.id
  name: string;                        // 项目名称
  number: string | null;               // 项目编号
  source: "crm" | "internal";          // "crm"=销售项目，"internal"=研发项目
  project_manager: string | null;      // 项目经理用户ID（加入审批人）
}

export interface JoinableProjectListResponse {
  total: number;
  items: JoinableProjectItem[];
}

export interface WeekInfo {
  week_index: number;
  label: string;
  date_range: string;
  max_hours: number;
}

export interface DailyHours {
  project_id: string;
  project_name: string;
  work_type: string;
  content: string;
  week_index: number;
  daily_hours: Record<string, number>; // {"2026-06-01": 7.0}
}

export interface ProjectApprovalStatus {
  project_id: string;
  project_name: string;
  status: string; // pending / approved / rejected / not_submitted
  opinion: string | null;
  submit_round: number;
  week_index?: number; // 周次(1-based)，用于按周次隔离项目审批状态
}

export interface PeriodResponse {
  period_id: string;
  period_year: number;
  period_month: number;
  period_start: string;
  period_end: string;
  standard_hours: number;
  total_hours: number;
  status: string;
  weeks: WeekInfo[];
  details: DailyHours[];
  daily_max_hours: Record<string, number>; // key=YYYY-MM-DD, 无配置时全0
  project_approvals: ProjectApprovalStatus[];
}

export interface SaveDetailsRequest {
  details: DailyHours[];
}

export interface SaveDetailsResponse {
  success: boolean;
  period_id: string;
  total_hours: number;
  project_approvals: ProjectApprovalStatus[];
}

export interface SubmitResponse {
  success: boolean;
  period_id: string;
  status: string;
}

export interface ProjectSubmitItem {
  project_id: string;
  project_name: string;
  approver_id: string;
  approver_name: string;
}

export interface SubmitRequest {
  projects: ProjectSubmitItem[];
}

export interface CandidateApproverItem {
  id: string; // 候选审批人 sys_users.id；id 为空表示姓名未匹配到用户（前端应禁用）
  name: string;
  source_project_ids: string[];
  source_project_names: string[];
}

export interface CandidateApproversResponse {
  items: CandidateApproverItem[];
}

// ── 工时设置类型定义 ──────────────────────────────────────

export interface WorkingDaysItem {
  id: string;
  year: string;
  month: string; // 1-12
  label: string; // 如 "2026年12月"
  state: "未设置" | "已设置";
  total_hours: number;
  total_days: number;
  editor: string;
  update_time: string | null;
  date_detail: string[]; // 已设置的工作日日期列表，如 ["2026-12-01", ...]
}

export interface WorkingDaysListResponse {
  items: WorkingDaysItem[];
}

export interface WorkingDaysSaveRequest {
  year: number;
  month: number;
  dates: string[]; // 已选中的工作日 YYYY-MM-DD
  hours_per_day?: number; // 默认 8
}

export interface WorkingDaysSaveResponse {
  id: string;
  year: number;
  month: number;
  total_days: number;
  total_hours: number;
  updated_at: string;
}

export interface WorkingDaysDetailResponse {
  id: string;
  year: number;
  month: number;
  dates: string[];
  total_days: number;
  total_hours: number;
  editor: string;
  update_time: string;
}

// ── 工时统计类型 ──────────────────────────────────────────

export interface StatsKpi {
  total_hours: number;
  avg_hours_per_person: number;
  filled_users: number; // 已填报人数
  total_users: number; // 系统总人数
  project_count: number; // 涉及项目数
}

export interface MonthlyTrend {
  labels: string[];
  total_hours: number[];
  overtime_hours: number[]; // 暂无数据源，始终为 0
}

export interface DistributionItem {
  name: string;
  value: number;
}

export interface DetailTableRow {
  month: string;
  dept: string;
  dept_id: string; // 部门ID（供弹窗查询用）
  hours: number;
  filled: number;
  unfilled: number;
  rate: number;
  leader: string;
}

export interface StatsResponse {
  kpi: StatsKpi;
  monthly_trend: MonthlyTrend;
  project_distribution: DistributionItem[];
  dept_comparison: DistributionItem[];
  work_type_ratio: DistributionItem[];
  detail_table: DetailTableRow[];
}

/** 工时统计部门树节点（统计页部门下拉数据源，按角色数据范围裁剪） */
export interface DeptTreeNode {
  id: string;
  name: string;
  parent_id: string | null;
  children: DeptTreeNode[];
}

// ── 按项目统计（CRM 销售项目工时信息页）────────────────

/** 月度工时数据点（柱状图） */
export interface ProjectMonthlyHoursItem {
  month: string; // "2026-07"
  month_label: string; // "2026年07月"
  total_hours: number; // 该月本项目工时总数
}

/** 工时填报明细汇总行（按月聚合：年月 + 填报总人数 + 填报总工时） */
export interface ProjectSummaryItem {
  month: string; // "2026-07"
  total_users: number; // 该月填报总人数
  total_hours: number; // 该月填报总工时
}

/** 项目参与人及工时 */
export interface ProjectParticipantItem {
  user_id: string;
  user_name: string;
  dept_name: string;
  total_hours: number;
  work_days: number;
}

/** 按项目统计工时的响应 */
export interface ProjectWorkHoursStatsResponse {
  project_id: string;
  project_name: string;
  project_number: string | null;
  monthly_trend: ProjectMonthlyHoursItem[];
  summary: ProjectSummaryItem[];
  participants: ProjectParticipantItem[];
}

// ── 统计明细弹窗类型 ──────────────────────────────────────

/** 已填报用户明细（弹窗用） */
export interface FilledUserItem {
  user_id: string; // 用户ID（供详情查询用）
  month: string; // 年月份，如 "2026-07"
  user_name: string; // 姓名
  dept_name: string; // 部门名称
  expected_hours: number; // 应填报总工时
  filled_hours: number; // 已填报总工时
  general_hours: number; // 已填报综合类工时
  dept_leader: string; // 部门领导
  approval_status: string; // 审批状态
}

/** 未填报用户明细（弹窗用） */
export interface UnfilledUserItem {
  user_id: string; // 用户ID（供详情查询用）
  month: string; // 月份，如 "2026-07"
  user_name: string; // 姓名
  dept_name: string; // 部门名称
  expected_hours: number; // 应填报总工时
  dept_leader: string; // 部门领导
}

/** 未填报人员提醒邮件响应 */
export interface NotifyUnfilledResponse {
  success: boolean;
  message: string;
  dry_run: boolean; // 测试环境（APP_ENV != prod）未真实发送，仅模拟
  target_count: number; // 未填报总人数
  no_email_count: number; // 无邮箱跳过人数
  sent_count: number; // 实际发送成功数
  recipients: string[]; // 收件人邮箱列表
}

// ── 用户工时详情类型（弹窗嵌套） ──────────────────────────

export interface WorkSegmentItem {
  start_date: string; // "2026-07-01"
  end_date: string; // "2026-07-05"
  expected_hours: number; // 本段应填工时
  filled_hours: number; // 本段已填工时
}

export interface ApprovalRecordItem {
  project_name: string;
  project_id?: string;
  status: string; // pending/approved/rejected
  status_label: string; // 填报状态（已审批/已驳回/待审批）
  action_label: string; // 操作（审批通过/审批驳回/-）
  approver_name: string; // 操作人姓名
  opinion: string; // 备注
  action_time: string; // 审批时间
  project_hours: number; // 填报工时
  submit_round: number;
  approval_level?: number;
}

export interface UserDetailResponse {
  user_name: string;
  dept_name: string;
  month: string;
  expected_hours: number;
  filled_hours: number;
  unfilled_hours: number;
  work_segments: WorkSegmentItem[];
  approvals: ApprovalRecordItem[];
}

export interface WorkHourTypeItem {
  id: string;
  project_type: string;
  work_hour_type: string;
}
export interface WorkHourTypeListResponse {
  items: WorkHourTypeItem[];
}

// ── 状态常量字典（前后端一致，禁止硬编码字符串）───────

/** 周期状态 */
export const PeriodStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
export type PeriodStatus = (typeof PeriodStatus)[keyof typeof PeriodStatus];

/** 项目审批状态（数据库存储值） */
export const ProjectApprovalStatusValue = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

/** 审批操作动作 */
export const ApprovalActionValue = {
  APPROVE: "approve",
  REJECT: "reject",
  SUBMIT: "submit",
  PENDING: "pending",
  CANCEL: "cancel",
} as const;

// ── 审批类型（从常量推导，避免重复定义）──────────

export type ApprovalStatus =
  (typeof ProjectApprovalStatusValue)[keyof typeof ProjectApprovalStatusValue];
export type ApprovalAction =
  | "approve"
  | "reject"
  | "submit"
  | "pending"
  | "approved"
  | "rejected"
  | "cancel";

export interface ApprovalFlowItem {
  node_order: number;
  approval_level?: number;
  approver_id: string;
  approver_name: string;
  action: ApprovalAction;
  opinion: string | null;
  action_time: string | null;
  project_id?: string | null;
  project_name?: string | null;
}

// ── 审批详情（仍用于弹窗展示） ──────────────────────────────────

export interface ApprovalDetailResponse {
  period_id: string;
  user_id: string;
  user_name: string;
  dept_name: string | null;
  period_year: number;
  period_month: number;
  period_start: string;
  period_end: string;
  standard_hours: number;
  total_hours: number;
  status: string;
  submit_time: string | null;
  weeks: WeekInfo[];
  details: DailyHours[];
  approval_flow: ApprovalFlowItem[];
}

// ── 审批 v2：按项目审批 ──────────────────────────────────────

export interface ProjectApprovalItem {
  project_approval_id: string;
  project_approval_ids?: string[]; // 聚合组内全部审批记录ID
  period_id: string;
  user_id: string;
  user_name: string;
  dept_name: string | null;
  period_year?: number | null;
  period_month?: number | null;
  project_id: string;
  project_name: string;
  project_names?: string[]; // 多项目名称列表
  project_count?: number; // 聚合的项目数
  hours: number;
  submit_round: number;
  submit_time: string | null;
  status: string;
  opinion: string | null;
  approval_type_code?: string | null; // 审批类型编码
  invitee_user_ids?: string[]; // 邀请人审批专用
}

export interface ProjectApprovalListResponse {
  total: number;
  items: ProjectApprovalItem[];
}

/** 填报人查看本周期审批记录项 */
export interface PeriodApprovalItem {
  project_approval_id: string;
  project_id: string;
  project_name: string;
  approver_id: string;
  approver_name: string | null;
  status: string; // pending / approved / rejected
  opinion: string | null;
  submit_round: number;
  approval_level?: number | null;
  action_time: string | null;
}

/** 填报人查看本周期审批记录响应 */
export interface PeriodApprovalListResponse {
  items: PeriodApprovalItem[];
}

export interface ProjectApprovalActionResponse {
  success: boolean;
  project_approval_id: string;
  project_approval_ids?: string[];
  processed_count?: number;
  status: string;
  action: string;
}

export interface BatchApproveRequest {
  project_approval_ids: string[];
  opinion?: string | null;
  action?: string | null;
}

export interface BatchApproveResponse {
  success_count: number;
  failed: Array<{ project_approval_id: string; reason: string }>;
}

export interface ApprovalTypeItem {
  id: string;
  name: string;
  code: string;
}
export interface ApprovalTypeListResponse {
  items: ApprovalTypeItem[];
}

/** 审批类型 + 待审批数量 */
export interface ApprovalTypeWithCountItem extends ApprovalTypeItem {
  pending_count: number;
}
export interface ApprovalTypeWithCountListResponse {
  items: ApprovalTypeWithCountItem[];
}

export interface ApprovalListQuery {
  status?: ApprovalStatus;
  keyword?: string;
  approval_type_code?: string;
  page?: number;
  page_size?: number;
}

// ── 工时 API ────────────────────────────────────────────
const workingHoursHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/working-hours`,
});

export const WorkingHoursApi = {
  /** 工时类型列表，可选按 project_type 过滤（GENERAL/NORMAL） */
  listWorkHourTypes: (project_type?: string) =>
    workingHoursHttp
      .get<WorkHourTypeListResponse>("/work-types", {
        params: project_type ? { project_type } : {},
      })
      .then((r) => r.data),

  /** 获取周期（只读，不存在时返回空周期 period_id=""） */
  getPeriod: (user_id: string, year: number, month: number) =>
    workingHoursHttp
      .get<PeriodResponse>("/period", { params: { user_id, year, month } })
      .then((r) => r.data),

  /** 创建周期（保存/提交前调用；已存在则返回现有周期） */
  createPeriod: (user_id: string, year: number, month: number) =>
    workingHoursHttp
      .post<PeriodResponse>("/period", null, { params: { user_id, year, month } })
      .then((r) => r.data),

  /** 保存草稿 */
  saveDetails: (period_id: string, body: SaveDetailsRequest) =>
    workingHoursHttp
      .put<SaveDetailsResponse>(`/period/${period_id}/details`, body)
      .then((r) => r.data),

  /** 提交审批 */
  submit: (period_id: string, body: SubmitRequest) =>
    workingHoursHttp
      .post<SubmitResponse>(`/period/${period_id}/submit`, body)
      .then((r) => r.data),

  /** 候选审批人（按本期已填项目聚合） */
  listCandidateApprovers: (period_id: string, project_ids: string[]) =>
    workingHoursHttp
      .post<CandidateApproversResponse>(
        `/period/${period_id}/candidate-approvers`,
        { project_ids },
      )
      .then((r) => r.data),

  /** 项目列表 */
  listProjects: (keyword?: string) =>
    workingHoursHttp
      .get<ProjectListResponse>("/projects", {
        params: keyword ? { keyword } : {},
      })
      .then((r) => r.data),

  /** 可申请加入的项目列表（销售 + 研发合并，支持编号/名称搜索、分页） */
  listJoinableProjects: (keyword?: string, page = 1, pageSize = 20) =>
    workingHoursHttp
      .get<JoinableProjectListResponse>("/projects/joinable", {
        params: {
          keyword: keyword || undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        },
      })
      .then((r) => r.data),

  /** 申请加入项目（复用邀请人审批流程，审批人为项目经理） */
  submitJoinRequest: (payload: { project_id: string; source: "crm" | "internal" }) =>
    workingHoursHttp
      .post<InviteeRequestItem>("/projects/join-request", payload)
      .then((r) => r.data),

  /** 按项目统计工时（CRM 销售项目工时信息页），month 可选（YYYY-MM）仅统计该月参与人 */
  getProjectStatistics: (projectId: string, month?: string) =>
    workingHoursHttp
      .get<ProjectWorkHoursStatsResponse>(`/projects/${projectId}/statistics`, {
        params: month ? { month } : {},
      })
      .then((r) => r.data),

  // ── 审批 ──

  /** 审批类型列表 */
  listApprovalTypes: () =>
    workingHoursHttp
      .get<ApprovalTypeListResponse>("/approval-types")
      .then((r) => r.data),

  /** 审批类型列表（含待审批数量） */
  listApprovalTypesWithCount: () =>
    workingHoursHttp
      .get<ApprovalTypeWithCountListResponse>("/approval-types-with-count")
      .then((r) => r.data),

  /** 审批列表（v2：按项目审批记录） */
  listApprovals: (q: ApprovalListQuery) =>
    workingHoursHttp
      .get<ProjectApprovalListResponse>("/approvals", {
        params: {
          status: q.status,
          keyword: q.keyword,
          approval_type_code: q.approval_type_code,
          page: q.page ?? 1,
          page_size: q.page_size ?? 20,
        },
      })
      .then((r) => r.data),

  /** 审批详情（兼容旧详情弹窗） */
  getApprovalDetail: (period_id: string) =>
    workingHoursHttp
      .get<ApprovalDetailResponse>(`/approvals/${period_id}/detail`)
      .then((r) => r.data),

  /** 填报人查看本周期审批记录 */
  getPeriodApprovals: (period_id: string) =>
    workingHoursHttp
      .get<PeriodApprovalListResponse>(`/period/${period_id}/approvals`)
      .then((r) => r.data.items),

  /** 审批操作（v2：按项目审批记录） */
  approvalAction: (
    projectApprovalId: string,
    body: { action: string; opinion?: string | null },
  ) =>
    workingHoursHttp
      .post<ProjectApprovalActionResponse>(
        `/approvals/project/${projectApprovalId}/action`,
        body,
      )
      .then((r) => r.data),

  /** 批量通过（v2） */
  batchApprove: (body: BatchApproveRequest) =>
    workingHoursHttp
      .post<BatchApproveResponse>("/approvals/batch-approve", body)
      .then((r) => r.data),

  // ── 工时设置（工作日历） ──

  /** 获取所有已有工时设置数据的年份 */
  listWorkingDaysYears: () =>
    workingHoursHttp.get<number[]>("/working-days/years").then((r) => r.data),

  /** 按年份查询各月份的工时设置汇总 */
  listWorkingDays: (year: number) =>
    workingHoursHttp
      .get<WorkingDaysListResponse>("/working-days", { params: { year } })
      .then((r) => r.data),

  /** 获取某月已设置的工作日明细 */
  getWorkingDays: (year: number, month: number) =>
    workingHoursHttp
      .get<WorkingDaysDetailResponse>("/working-days/detail", {
        params: { year, month },
      })
      .then((r) => r.data),

  /** 保存某月工作日设置 */
  saveWorkingDays: (body: WorkingDaysSaveRequest) =>
    workingHoursHttp
      .post<WorkingDaysSaveResponse>("/working-days", body)
      .then((r) => r.data),

  /** 删除某月工作日设置 */
  deleteWorkingDays: (year: number, month: number) =>
    workingHoursHttp
      .delete(`/working-days/${year}/${month}`)
      .then((r) => r.data),

  // ── 工时统计 ──

  /** 工时统计部门树节点（按角色数据范围裁剪，后端返回） */
  getStatisticsDeptTree: () =>
    workingHoursHttp
      .get<DeptTreeNode[]>("/statistics/dept-tree")
      .then((r) => r.data),

  /** 工时统计 */
  getStatistics: (
    start: string,
    end: string,
    deptId?: string,
    detailMonth?: string,
  ) =>
    workingHoursHttp
      .get<StatsResponse>("/statistics", {
        params: {
          start,
          end,
          dept_id: deptId || undefined,
          detail_month: detailMonth,
        },
      })
      .then((r) => r.data),

  /** 已填报用户明细（统计弹窗） */
  getFilledUsers: (year: number, month: number, deptId?: string) =>
    workingHoursHttp
      .get<FilledUserItem[]>("/statistics/filled-users", {
        params: { year, month, dept_id: deptId || undefined },
      })
      .then((r) => r.data),

  /** 未填报用户明细（统计弹窗） */
  getUnfilledUsers: (year: number, month: number, deptId?: string) =>
    workingHoursHttp
      .get<UnfilledUserItem[]>("/statistics/unfilled-users", {
        params: { year, month, dept_id: deptId || undefined },
      })
      .then((r) => r.data),

  /** 提醒未填报人员（向需要工时填报部门的未填报人员发送提醒邮件；测试环境不真实发送） */
  notifyUnfilled: (year: number, month: number) =>
    workingHoursHttp
      .post<NotifyUnfilledResponse>("/statistics/notify-unfilled", { year, month })
      .then((r) => r.data),

  /** 用户工时详情（统计弹窗嵌套） */
  getUserDetail: (userId: string, year: number, month: number, segmentStart?: string, segmentEnd?: string) =>
    workingHoursHttp
      .get<UserDetailResponse>("/statistics/user-detail", {
        params: { user_id: userId, year, month, segment_start: segmentStart, segment_end: segmentEnd },
      })
      .then((r) => r.data),

  /** 导出工时明细为 Excel 文件 */
  exportStatistics: async (
    year: number,
    month: number,
    deptId?: string,
  ): Promise<void> => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    if (deptId) params.set("dept_id", deptId);
    const resp = await fetch(
      `${API_PROXY_PREFIX}/v1/oa/working-hours/statistics/export?${params}`,
      {
        credentials: "include",
      },
    );
    if (!resp.ok) throw new Error("导出失败");
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `工时明细_${year}-${String(month).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** 人员维度导出工时明细为 Excel 文件 */
  exportStatisticsByPerson: async (
    year: number,
    month: number,
    deptId?: string,
  ): Promise<void> => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    if (deptId) params.set("dept_id", deptId);
    const resp = await fetch(
      `${API_PROXY_PREFIX}/v1/oa/working-hours/statistics/export/person?${params}`,
      {
        credentials: "include",
      },
    );
    if (!resp.ok) throw new Error("导出失败");
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `工时明细_人员维度_${year}-${String(month).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** 项目维度导出工时明细为 Excel 文件（year/month 成对传入时按所选月份过滤） */
  exportStatisticsByProject: async (
    year: number,
    month: number,
    deptId?: string,
  ): Promise<void> => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    if (deptId) params.set("dept_id", deptId);
    const resp = await fetch(
      `${API_PROXY_PREFIX}/v1/oa/working-hours/statistics/export/project?${params}`,
      {
        credentials: "include",
      },
    );
    if (!resp.ok) throw new Error("导出失败");
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `工时明细_项目维度_${year}-${String(month).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** 未填报人员导出为 Excel 文件 */
  exportUnfilledUsers: async (
    year: number,
    month: number,
    deptId?: string,
  ): Promise<void> => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    if (deptId) params.set("dept_id", deptId);
    const resp = await fetch(
      `${API_PROXY_PREFIX}/v1/oa/working-hours/statistics/export/unfilled?${params}`,
      { credentials: "include" },
    );
    if (!resp.ok) throw new Error("导出失败");
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `工时明细_未填报人员_${year}-${String(month).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },

};

export const SelectorApi = {
  /** 加载全部组织（分页） */
  fetchAllOrgs,

  /** 加载全部用户（分页，含 org_id 等原始字段） */
  fetchAllUsers,

  /** 将用户列表转为选项 */
  toOptions(users: AuthUserResponse[]): OptionItem[] {
    return users.map(toUserOption);
  },

  /** 从原始用户列表中按 org_id 过滤为选项（本地，无网络请求） */
  filterUsersByOrg(users: AuthUserResponse[], orgId: string): OptionItem[] {
    return users.filter((u) => u.org_id === orgId).map(toUserOption);
  },

  /** 从原始用户列表中查找单个用户（本地） */
  findUserById(
    users: AuthUserResponse[],
    userId: string,
  ): AuthUserResponse | undefined {
    return users.find((u) => u.id === userId);
  },
};

// ── 内部项目类型定义 ──────────────────────────────────────
