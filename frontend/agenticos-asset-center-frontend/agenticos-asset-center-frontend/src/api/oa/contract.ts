import {createHttp} from "../http";
import {apiClient} from "../core";
import type {AuthUserResponse} from "../auth";
import {API_PROXY_PREFIX} from "./constants";


// ── 合同类型字典 ──────────────────────────────────────────
export interface ContractTypeItem {
  id: string;
  name: string;
  sort_order: number;
}

// ── 合同回款里程碑 ─────────────────────────────────────────
/** 合同回款里程碑条目（第N笔款/回款内容/回款金额/预计回款时间） */
export interface PaymentMilestoneItem {
  installment_no: number;
  content: string;
  amount: number;
  expected_date: string | null;
}

// ── 合同售卖产品 ────────────────────────────────────────────
/** 合同售卖产品条目（创建/编辑请求） */
export interface ContractProductInput {
  product_id: string;
  unit_price: number;
  quantity: number;
}

/** 合同售卖产品条目（响应） */
export interface ContractProductItem {
  id: string;
  contract_id: string;
  product_id: string;
  product_name: string | null;
  unit_price: number;
  quantity: number;
  amount: number;
  sort_order: number;
}

// ── 类型定义 ──────────────────────────────────────────────
export interface ContractItem {
  id: string;
  contract_number: string;
  contract_name: string;
  contract_type_id: string | null;
  contract_type_name: string | null;
  signing_date: string | null;
  party_a: string;
  party_b: string;
  end_user: string | null;
  sales_manager_id: string | null;
  sales_manager_name: string | null;
  sales_department_id: string | null;
  sales_department_name: string | null;
  deal_id: string | null;
  project_name: string | null;
  project_number: string | null;
  is_archived: boolean;
  contract_amount: number;
  product_amount: number | null;
  service_amount: number | null;
  hardware_product_amount: number | null;
  agreed_final_accept_date: string | null;
  counterparty_contact_person: string | null;
  contract_payment_milestone: PaymentMilestoneItem[] | null;
  products: ContractProductItem[];
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export type ContractDetail = ContractItem;

export interface ContractListResponse {
  total: number;
  items: ContractItem[];
  limit: number;
  offset: number;
}

export interface ContractCreateRequest {
  contract_number?: string;
  contract_name: string;
  contract_type_id?: string | null;
  signing_date?: string | null;
  party_a: string;
  party_b: string;
  end_user?: string | null;
  sales_manager_id?: string | null;
  sales_department_id?: string | null;
  deal_id?: string | null;
  contract_amount?: number;
  product_amount?: number | null;
  service_amount?: number | null;
  hardware_product_amount?: number | null;
  agreed_final_accept_date?: string | null;
  counterparty_contact_person?: string | null;
  contract_payment_milestone?: PaymentMilestoneItem[] | null;
  products?: ContractProductInput[] | null;
}

export interface ContractUpdateRequest {
  contract_number?: string;
  contract_name?: string;
  contract_type_id?: string | null;
  signing_date?: string | null;
  party_a?: string;
  party_b?: string;
  end_user?: string | null;
  sales_manager_id?: string | null;
  sales_department_id?: string | null;
  deal_id?: string | null;
  contract_amount?: number | null;
  product_amount?: number | null;
  service_amount?: number | null;
  hardware_product_amount?: number | null;
  agreed_final_accept_date?: string | null;
  counterparty_contact_person?: string | null;
  contract_payment_milestone?: PaymentMilestoneItem[] | null;
  products?: ContractProductInput[] | null;
}

export interface ContractQueryParams {
  keyword?: string;
  project_keyword?: string; // 按关联项目名称/编号模糊搜索
  contract_type_id?: string;
  sales_manager_id?: string;
  sales_department_id?: string;
  deal_id?: string; // 按关联商机ID过滤（CRM-销售项目详情页合同信息分页使用）
  party_a?: string;
  party_b?: string;
  amount_min?: number;
  amount_max?: number;
  limit?: number;
  offset?: number;
}

export interface OptionItem {
  value: string;
  label: string;
}

// ── 人事归档相关类型 ────────────────────────────────────

/** 归档图片列表项 */
export interface ArchiveImageItem {
  file_object_id: string;
  original_name: string;
  display_name: string;
  size_bytes: number;
  content_type: string;
  file_ext: string | null;
  created_at: string | null;
}

/** 归档图片列表响应 */
export interface ArchiveImageListResponse {
  total: number;
  items: ArchiveImageItem[];
}

/** 商机归档图片按合同分组 */
export interface ContractArchiveGroup {
  contract_id: string;
  contract_number: string;
  items: ArchiveImageItem[];
}

/** 商机归档图片分组列表响应 */
export interface ArchiveImageGroupListResponse {
  total: number;
  groups: ContractArchiveGroup[];
}

export interface ArchiveResponse {
  contract_id: string;
  deal_id: string;
  deal_name: string;
  success_count: number;
  failed_count: number;
  is_archived: boolean;
}

// ── 合同 API ──────────────────────────────────────────────
const contractsHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/contracts`,
});

export const ContractApi = {
  /** 获取合同类型列表（改走统一字典 /v1/system/dicts/contract_type） */
  listTypes: () =>
    apiClient
      .get<{ items: { code: string; name: string }[] }>('/v1/system/dicts/contract_type')
      .then((r) =>
        r.data.items.map((i) => ({ id: i.code, name: i.name, sort_order: 0 })),
      ),

  list: (params?: ContractQueryParams) =>
    contractsHttp.get<ContractListResponse>("", { params }).then((r) => r.data),

  get: (id: string) =>
    contractsHttp.get<ContractDetail>(`/${id}`).then((r) => r.data),

  create: (payload: ContractCreateRequest) =>
    contractsHttp.post<ContractDetail>("", payload).then((r) => r.data),

  update: (id: string, payload: ContractUpdateRequest) =>
    contractsHttp.put<ContractDetail>(`/${id}`, payload).then((r) => r.data),

  /** 人事归档：上传归档图片（多文件，大文件长超时） */
  archive: (contractId: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file, file.name));
    return contractsHttp
      .post<ArchiveResponse>(`/${contractId}/archive`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
      })
      .then((r) => r.data);
  },

  delete: (id: string) => contractsHttp.delete(`/${id}`).then((r) => r.data),

  /** 获取合同关联商机的归档图片列表 */
  getArchiveImages: (contractId: string) =>
    contractsHttp
      .get<ArchiveImageListResponse>(`/${contractId}/archive-images`)
      .then((r) => r.data),
};

// ── 邮件 API ──────────────────────────────────────────────

export interface MailSendRequest {
  to: string[]
  cc?: string[]
  subject: string
  body: string
  content_type?: 'plain' | 'html'
  attachments?: { filename: string; content: string; content_type?: string }[]
}

export interface MailSendResponse {
  success: boolean
  message: string
}

const mailHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/mail`,
});

export const MailApi = {
  send: (payload: MailSendRequest) =>
    mailHttp.post<MailSendResponse>('/send', payload).then((r) => r.data),
};

// ── 项目预算 API ──────────────────────────────────────────

/** 预算明细类型 */
export type BudgetItemType =
  | 'man_hour' // 人力成本
  | 'product' // 产品
  | 'outsource_product' // 外采产品
  | 'outsource_service'; // 外采服务

export interface BudgetItemCreateRequest {
  item_type: BudgetItemType;
  item_name?: string | null;
  product_id?: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  cost: number;
  travel_allowance: number;
  quote_price: number;
  profit: number;
  profit_rate: number;
  sort_order?: number;
}

export interface BudgetCreateRequest {
  project_id?: string | null;
  budget_name?: string | null;
  project_start_date?: string | null;
  project_end_date?: string | null;
  project_duration_days?: number | null;
  total_man_days: number;
  daily_travel_allowance: number;
  items: BudgetItemCreateRequest[];
}

export interface BudgetItemDetail {
  id: string;
  budget_id: string;
  item_type: BudgetItemType;
  item_name: string | null;
  product_id: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  cost: number;
  travel_allowance: number;
  quote_price: number;
  profit: number;
  profit_rate: number;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface BudgetDetail {
  id: string;
  project_id: string | null;
  budget_name: string | null;
  project_start_date: string | null;
  project_end_date: string | null;
  project_duration_days: number | null;
  total_man_days: number;
  daily_travel_allowance: number;
  total_cost: number;
  contract_quote_total: number;
  total_profit: number;
  total_profit_rate: number;
  status: string | null;
  items: BudgetItemDetail[];
  created_at: string | null;
  updated_at: string | null;
}

const budgetsHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/project-budgets`,
});

export const BudgetApi = {
  create: (payload: BudgetCreateRequest) =>
    budgetsHttp.post<BudgetDetail>("", payload).then((r) => r.data),
  getByProject: (projectId: string) =>
    budgetsHttp.get<BudgetDetail>(`/by-project/${projectId}`).then((r) => r.data),
};

// ── 成本标准 API ──────────────────────────────────────────

export interface CostStandardItem {
  id: string;
  city_level: string;
  grade: string;
  monthly_cost: number;
  role_level: string | null;
  daily_cost: number;
}

export interface CostStandardListResponse {
  items: CostStandardItem[];
}

const costStandardsHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/cost-standards`,
});

export const CostStandardApi = {
  list: () =>
    costStandardsHttp
      .get<CostStandardListResponse>("")
      .then((r) => r.data),
};

// ── 组织 API ──────────────────────────────────────────────
const orgsHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/admin/organizations`,
});

export async function fetchAllOrgs(): Promise<OptionItem[]> {
  const all: OptionItem[] = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await orgsHttp.get<{
      items: { id: string; name: string }[];
      total: number;
    }>("", {
      params: { page, page_size: pageSize },
    });
    const data = res.data;
    for (const o of data.items ?? []) {
      all.push({ value: o.id, label: o.name });
    }
    if (all.length >= (data.total ?? 0)) break;
    page++;
  }
  return all;
}

// ── 用户 API ──────────────────────────────────────────────

interface UserBriefItem {
  id: string;
  display_name: string | null;
  cn_name: string | null;
  username: string;
  org_id: string | null;
}

export async function fetchAllUsers(): Promise<AuthUserResponse[]> {
  const usersHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}` });
  const res = await usersHttp.get<UserBriefItem[]>("/v1/admin/users/all");
  // 兼容旧 AuthUserResponse 类型，补齐缺失字段
  return (res.data ?? []).map(
    (u): AuthUserResponse => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      cn_name: u.cn_name,
      org_id: u.org_id ?? undefined,
      email: null,
      avatar_url: null,
      avatar_mode: null,
      avatar_text: null,
      login_count: 0,
      last_login_at: null,
    }),
  );
}

export function toUserOption(u: AuthUserResponse): OptionItem {
  return {
    value: u.id,
    label: u.display_name || u.cn_name || u.username || u.id,
  };
}

// ── 工时系统类型定义 ──────────────────────────────────────
