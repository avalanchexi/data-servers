import {createHttp} from "../http";
import {apiClient} from "../core";
import {API_PROXY_PREFIX} from "./constants";
// 归档图片类型定义迁移至 ./contract.ts（合同归档图片归属合同领域），此处仅类型导入复用
import type {ArchiveImageGroupListResponse} from "./contract";


export interface InternalProjectItem {
  id: string;
  number: string;
  name: string;
  proposer: string | null;
  delivery_org_id: string | null;
  delivery_org_name: string | null;
  project_manager: string | null;
  description: string | null;
  is_active: boolean;
  approval_status: string | null; // 最新审批状态：pending/approved/rejected，已激活项目为 null
  created_at: string | null;
  updated_at: string | null;
}

export interface InternalProjectListResponse {
  total: number;
  items: InternalProjectItem[];
  limit: number;
  offset: number;
}

export interface InternalProjectCreateRequest {
  name: string;
  delivery_org_id?: string | null;
  project_manager?: string | null;
  description?: string | null;
}

export interface InternalProjectUpdateRequest {
  name?: string;
  delivery_org_id?: string | null;
  project_manager?: string | null;
  description?: string | null;
}

export interface InternalProjectQueryParams {
  keyword?: string;
  delivery_org_id?: string;
  limit?: number;
  offset?: number;
}

// ── 内部项目 API ──────────────────────────────────────────
const internalProjectHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/internal-projects`,
});

export interface InternalProjectPendingApprovalItem {
  id: string;
  number: string;
  name: string;
  proposer: string | null;
  delivery_org_id: string | null;
  delivery_org_name: string | null;
  project_manager: string | null;
  description: string | null;
  created_at: string | null;
}

export interface InternalProjectPendingApprovalListResponse {
  total: number;
  items: InternalProjectPendingApprovalItem[];
  limit: number;
  offset: number;
}

export interface InternalProjectApprovalActionRequest {
  action: "approve" | "reject";
  opinion?: string | null;
}

export interface InternalProjectApprovalActionResponse {
  success: boolean;
  project_id: string;
  project_name: string;
  approval_status: string;
  action: string;
}

export interface InternalProjectApprovalFlowLevel {
  approval_level: number;
  role: string;
  approver_id: string | null;
  approver_name: string | null;
  /** pending / approved / rejected；null=该级未开始 */
  status: "pending" | "approved" | "rejected" | null;
  opinion: string | null;
  action_time: string | null;
}

export interface InternalProjectApprovalFlowResponse {
  project_id: string;
  project_name: string;
  is_active: boolean;
  levels: InternalProjectApprovalFlowLevel[];
}

export const InternalProjectApi = {
  list: (params?: InternalProjectQueryParams) =>
    internalProjectHttp
      .get<InternalProjectListResponse>("", { params })
      .then((r) => r.data),

  get: (id: string) =>
    internalProjectHttp.get<InternalProjectItem>(`/${id}`).then((r) => r.data),

  create: (payload: InternalProjectCreateRequest) =>
    internalProjectHttp
      .post<InternalProjectItem>("", payload)
      .then((r) => r.data),

  update: (id: string, payload: InternalProjectUpdateRequest) =>
    internalProjectHttp
      .put<InternalProjectItem>(`/${id}`, payload)
      .then((r) => r.data),

  delete: (id: string) =>
    internalProjectHttp.delete(`/${id}`).then((r) => r.data),

  // ── 内部项目审批 ──
  listPendingApprovals: (
    params?: InternalProjectQueryParams & { status?: string },
  ) =>
    internalProjectHttp
      .get<InternalProjectPendingApprovalListResponse>("/approvals/pending", {
        params,
      })
      .then((r) => r.data),

  approvalAction: (
    projectId: string,
    payload: InternalProjectApprovalActionRequest,
  ) =>
    internalProjectHttp
      .post<InternalProjectApprovalActionResponse>(
        `/${projectId}/approval-action`,
        payload,
      )
      .then((r) => r.data),

  // ── 审批流（固定三级：项目经理 → 二级审批 → 三级审批）──
  getApprovalFlow: (projectId: string) =>
    internalProjectHttp
      .get<InternalProjectApprovalFlowResponse>(`/${projectId}/approval-flow`)
      .then((r) => r.data),
};

// ── 项目邀请人类型定义 ────────────────────────────────────

export interface ProjectUserItem {
  id: string;
  project_id: string;
  subject_type: string;
  user_id: string;
  user_name: string | null;
  dept_name: string | null;
  allowed: number; // 0=未通过，1=已通过
  approval_status: string | null; // pending / approved / rejected
  reject_reason: string | null;
  create_time: string | null;
  update_time: string | null;
}

export interface ProjectUserListResponse {
  items: ProjectUserItem[];
}

export interface ProjectUserAddRequest {
  user_ids: string[];
}

// ── 项目邀请人 API ────────────────────────────────────────

export const ProjectUserApi = {
  list: (projectId: string) =>
    internalProjectHttp
      .get<ProjectUserListResponse>(`/${projectId}/users`)
      .then((r) => r.data),

  add: (projectId: string, payload: ProjectUserAddRequest) =>
    internalProjectHttp
      .post<ProjectUserListResponse>(`/${projectId}/users`, payload)
      .then((r) => r.data),

  remove: (projectId: string, recordId: string) =>
    internalProjectHttp
      .delete(`/${projectId}/users/${recordId}`)
      .then((r) => r.data),
};

// ── 邀请人审批类型定义 ────────────────────────────────────

export interface InviteeRequestItem {
  id: string;
  project_id: string;
  project_name: string;
  user_ids: string[];
  submitter_id: string;
  submitter_name: string;
  approver_id: string;
  approver_name: string | null;
  status: string; // pending / approved / rejected
  opinion: string | null;
  action_time: string | null;
  create_time: string | null;
}

export interface InviteeRequestListResponse {
  total: number;
  items: InviteeRequestItem[];
  limit: number;
  offset: number;
}

export interface InviteeRequestCreateRequest {
  user_ids: string[];
  approver_id: string;
}

export interface InviteeRequestActionRequest {
  action: "approve" | "reject";
  opinion?: string | null;
}

export interface InviteeRequestActionResponse {
  success: boolean;
  request_id: string;
  status: string;
  action: string;
}

// ── 邀请人审批 API ────────────────────────────────────────

export const InviteeRequestApi = {
  /** 提交邀请人审批申请 */
  submit: (projectId: string, payload: InviteeRequestCreateRequest) =>
    internalProjectHttp
      .post<InviteeRequestItem>(`/${projectId}/invitee-requests`, payload)
      .then((r) => r.data),

  /** 查询我的邀请人审批列表（作为项目经理） */
  listPending: (params?: {
    status?: string;
    keyword?: string;
    limit?: number;
    offset?: number;
  }) =>
    internalProjectHttp
      .get<InviteeRequestListResponse>("/invitee-requests/pending", { params })
      .then((r) => r.data),

  /** 处理邀请人审批（通过/驳回） */
  action: (requestId: string, payload: InviteeRequestActionRequest) =>
    internalProjectHttp
      .post<InviteeRequestActionResponse>(
        `/invitee-requests/${requestId}/action`,
        payload,
      )
      .then((r) => r.data),
};

// ── 外部项目 API（CRM赢单商机）────────────────────────────

/** 转售后依据材料（单个文件对象），file_ext 支持 .rar/.zip/.doc/.docx/.pdf/.jpg */
export interface AfterSaleMaterialItem {
  file_object_id: string;
  file_name: string;
  file_url?: string | null;
  file_ext?: string | null;
  file_size?: number | null;
}

const externalProjectHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/external-projects`,
});

export interface ExternalProjectItem {
  id: string;
  name: string;
  number: string | null;
  company_id: string | null; // 客户公司ID（crm_companies.id，基础信息编辑回显用）
  company_name: string | null;
  contact_id: string | null;
  contact_name: string | null;
  project_manager: string | null;
  project_manager_name: string | null;
  // 交付部门：项目经理所属部门（sys_user_org 取 min(org_id)）
  delivery_department: string | null;
  project_director: string | null;
  project_director_name: string | null;
  final_amount: number | null;
  actual_close_date: string | null;
  product_lines: string[] | null;
  sales_owner_id: string | null;
  sales_owner_name: string | null;
  // 销售部门：销售人员所属部门（sys_user_org 取 min(org_id)，与交付部门口径一致）
  sales_department: string | null;
  created_at: string | null;
  is_archived: boolean; // 是否已签约（数据来源 oa_contracts.is_archived）
  project_stage: string | null; // 项目阶段：PRE_SALE=售前，IMPLEMENT_MAN_HOUR=售后
  project_running_status: string | null; // 项目运行状态：ONGOING/FAILEDEND/POSTPROJECT
  status: string | null; // 项目状态：won=赢单，lost=输单，open=进行中
  // 销售合同信息（编号/名称取签订日期最早的一份，金额取合计，单位元）
  contract_number: string | null;
  contract_name: string | null;
  contract_amount: number | null;
  // 转售后信息（2026-08-25 新增列）
  after_sale_time: string | null; // 转售后时间
  after_sale_basis: string | null; // 转售后依据（统一字典 after_sale_basis 的 code）
  after_sale_materials: AfterSaleMaterialItem[] | null; // 转售后依据材料
  // 基础信息分页扩充字段（2026-08-04，全部来自 crm_deals 既有列，只读展示）
  amount: number | null; // 商机金额（初始报价）
  stage: string | null; // 销售阶段（如「需求发现」）
  probability: number | null; // 赢单概率（0-100）
  expected_close_date: string | null; // 预计赢单日期
  level: string | null; // 商机等级 A/B/C
  description: string | null; // 项目描述
  is_key_project: boolean; // 是否重点项目
  needs_leader_support: boolean; // 是否需要领导支持
  key_project_reason: string | null; // 重点项目原因
  leader_support_reason: string | null; // 领导支持原因
  // 项目经营指标（计划/实际），由后端 external_project_service._build_finance_metrics 计算返回
  plan_total_income: number | null; // 计划总收入
  plan_total_cost: number | null; // 计划总成本
  plan_profit_amount: number | null; // 计划利润额
  plan_profit_rate: number | null; // 计划利润率
  plan_total_man_days: number | null; // 计划总人日
  plan_labor_cost: number | null; // 计划人力成本
  actual_total_income: number | null; // 实际总收入
  current_total_cost: number | null; // 当前总成本
  current_profit_amount: number | null; // 当前利润额
  current_profit_rate: number | null; // 当前利润率
  current_total_man_days: number | null; // 当前总人日
  current_labor_cost: number | null; // 当前人力成本
}

export interface ExternalProjectListResponse {
  total: number;
  items: ExternalProjectItem[];
  limit: number;
  offset: number;
}

// 归档图片类型定义迁移至 ./contract.ts，此处仅顶部 import 复用
export const ExternalProjectApi = {
  list: (params?: {
    keyword?: string;
    status?: string;
    project_stage?: string;
    project_running_status?: string;
    sales_department_id?: string;
    delivery_department_id?: string;
    project_manager?: string;
    sales_owner_id?: string;
    limit?: number;
    offset?: number;
  }) =>
    externalProjectHttp
      .get<ExternalProjectListResponse>("", { params })
      .then((r) => r.data),
  get: (projectId: string) =>
    externalProjectHttp
      .get<ExternalProjectItem>(`/${projectId}`)
      .then((r) => r.data),
  /** 更新项目名称/运行状态与基础信息字段（客户/联系人/项目经理/总监/销售负责人/描述）；项目阶段仅可通过转售后变更 */
  update: (
    projectId: string,
    body: {
      name?: string;
      project_running_status?: string | null;
      company_id?: string | null;
      contact_id?: string | null;
      project_manager?: string | null;
      project_director?: string | null;
      sales_owner_id?: string | null;
      description?: string | null;
    },
  ) =>
    externalProjectHttp
      .put<ExternalProjectItem>(`/${projectId}`, body)
      .then((r) => r.data),

  /** 转售后：填充转售后时间/依据/依据材料（专用动作接口） */
  transferAfterSale: (
    projectId: string,
    body: {
      after_sale_time: string;
      after_sale_basis: string;
      after_sale_materials?: AfterSaleMaterialItem[] | null;
    },
  ) =>
    externalProjectHttp
      .post<ExternalProjectItem>(`/${projectId}/after-sale`, body)
      .then((r) => r.data),
  /** 审批管理页面查看 CRM 赢单项目详情 */
  getForApproval: (projectId: string) =>
    externalProjectHttp
      .get<ExternalProjectItem>(`/approval-view/${projectId}`)
      .then((r) => r.data),
  /** 获取CRM商机各合同的归档图片分组（详情页按合同展示用） */
  getArchiveImages: (dealId: string) =>
    externalProjectHttp
      .get<ArchiveImageGroupListResponse>(`/${dealId}/archive-images`)
      .then((r) => r.data),
  /** 导出全部销售项目为 Excel 文件（与列表相同筛选条件） */
  exportExcel: (params?: {
    keyword?: string;
    status?: string;
    project_stage?: string;
    project_running_status?: string;
    sales_department_id?: string;
    delivery_department_id?: string;
    project_manager?: string;
    sales_owner_id?: string;
  }) =>
    externalProjectHttp
      .get<Blob>("/export", {
        params,
        responseType: "blob",
        timeout: 600000,
      })
      .then((r) => r.data),
  /** 导出单个销售项目为 Excel 文件（详情页使用） */
  exportExcelById: (projectId: string) =>
    externalProjectHttp
      .get<Blob>(`/${projectId}/export`, {
        responseType: "blob",
        timeout: 600000,
      })
      .then((r) => r.data),
};

// 外部项目邀请人 API（与内部项目接口一致，baseURL 为 /v1/oa/external-projects）
export const ExternalProjectUserApi = {
  list: (projectId: string) =>
    externalProjectHttp
      .get<ProjectUserListResponse>(`/${projectId}/users`)
      .then((r) => r.data),

  add: (projectId: string, payload: ProjectUserAddRequest) =>
    externalProjectHttp
      .post<ProjectUserListResponse>(`/${projectId}/users`, payload)
      .then((r) => r.data),

  remove: (projectId: string, recordId: string) =>
    externalProjectHttp
      .delete(`/${projectId}/users/${recordId}`)
      .then((r) => r.data),
};

// 外部项目邀请人审批 API
export const ExternalInviteeRequestApi = {
  submit: (projectId: string, payload: InviteeRequestCreateRequest) =>
    externalProjectHttp
      .post<InviteeRequestItem>(`/${projectId}/invitee-requests`, payload)
      .then((r) => r.data),

  listPending: (params?: {
    status?: string;
    keyword?: string;
    limit?: number;
    offset?: number;
  }) =>
    externalProjectHttp
      .get<InviteeRequestListResponse>("/invitee-requests/pending", { params })
      .then((r) => r.data),

  action: (requestId: string, payload: InviteeRequestActionRequest) =>
    externalProjectHttp
      .post<InviteeRequestActionResponse>(
        `/invitee-requests/${requestId}/action`,
        payload,
      )
      .then((r) => r.data),
};


// ── 产品目录 API ──────────────────────────────────────────
const productsHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/oa/products` })

export interface ProductItem {
  id: string
  product_organization_id: string
  category_id: string | null
  category_name: string | null
  product_name: string
  product_number: string
  product_version: string
  product_combined_name: string | null
  software_copyright: string | null
  version_type: string | null
  product_scale: string | null
  product_unit: string | null
  public_price: string | null
  maintenance_rate: string | null
  product_description: string | null
  creator: string
  modifier: string
  create_time: string | null
  update_time: string | null
  del_status: boolean
}

export interface ProductListResponse {
  total: number
  items: ProductItem[]
  limit: number
  offset: number
}

export const ProductApi = {
  list: (params?: {
    keyword?: string
    limit?: number
    offset?: number
  }) => productsHttp.get<ProductListResponse>('', { params }).then((r) => r.data),

  get: (id: string) => productsHttp.get<ProductItem>(`/${id}`).then((r) => r.data),

  /** 版本类型字典（code → 中文名，改走统一字典 /v1/system/dicts） */
  listVersionTypes: () =>
    apiClient
      .get<{ items: { code: string; name: string }[] }>('/v1/system/dicts/product_version_type')
      .then((r) => r.data.items),

  /** 产品规模字典（code → 中文名，改走统一字典 /v1/system/dicts） */
  listScales: () =>
    apiClient
      .get<{ items: { code: string; name: string }[] }>('/v1/system/dicts/product_scale')
      .then((r) => r.data.items),

  /** 产品单位字典（code → 中文名，改走统一字典 /v1/system/dicts） */
  listUnits: () =>
    apiClient
      .get<{ items: { code: string; name: string }[] }>('/v1/system/dicts/product_unit')
      .then((r) => r.data.items),

  create: (payload: {
    product_organization_id?: string
    product_name: string
    product_number?: string
    product_version?: string
    product_combined_name?: string
    software_copyright?: string
    version_type?: string
    product_scale?: string
    product_unit?: string
    public_price?: string
    maintenance_rate?: string
    product_description?: string
  }) => productsHttp.post<ProductItem>('', payload).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>) =>
    productsHttp.put<ProductItem>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => productsHttp.delete(`/${id}`).then(() => true),
}

// ── 产品分类 API ──────────────────────────────────────────
const categoryHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/oa/product-categories` })

export interface CategoryItem {
  id: string
  node_id: string
  parent_id: string | null
  name: string
  sort_order: number
  description: string | null
  creator: string
  modifier: string
  create_time: string | null
  update_time: string | null
  del_status: boolean
}

export interface CategoryTreeNode extends CategoryItem {
  children: CategoryTreeNode[]
}

export const CategoryApi = {
  getTree: () => categoryHttp.get<CategoryTreeNode[]>('/tree').then((r) => r.data),

  create: (payload: {
    parent_id?: string | null
    name: string
    sort_order?: number
    description?: string | null
  }) => categoryHttp.post<CategoryTreeNode>('', payload).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>) =>
    categoryHttp.put<CategoryTreeNode>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => categoryHttp.delete(`/${id}`).then(() => true),
}
