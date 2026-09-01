import { createHttp } from "../http";
import { READONLY_SELF_SERVICE_HEADER } from "../interceptor";
import { API_PROXY_PREFIX } from "./constants";


// ── ✨ 员工人事档案 API ──────────────────────────────────────
export const employeesHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/employees`,
});

export interface EmployeeItem {
  id: string;
  profile_type: string;
  name: string;
  dept_level1_id: string | null;
  dept_level1_name: string;
  dept_level2_id: string | null;
  dept_level2_name: string;
  dept_level3_id: string | null;
  dept_level3_name: string;
  position: string;
  leader_name: string;
  personal_phone: string;
  personal_email: string;
  recruit_channel: string;
  employer_company: string;
  offer_date: string;
  expected_entry_date: string;
  original_entry_date: string;
  job_level: string;
  work_location: string;
  social_insurance_location: string;
  contract_sign_location: string;
  referrer_name: string | null;
  referrer_relation: string | null;
  contact_name: string | null;
  created_at: string | null;
}

export interface EmployeeListResponse {
  total: number;
  items: EmployeeItem[];
  limit: number;
  offset: number;
}

export interface EmployeeAttachmentRef {
  category: string;
  file_id: string;
  file_name?: string;
}

export interface EmployeeContractAttachmentRef {
  file_id: string;
  file_name: string;
}

export interface EmployeeDetail extends EmployeeItem {
  user_id: string | null;
  job_number: string | null;
  probation_months: number | null;
  mobile: string | null;
  email: string | null;
  id_number: string | null;
  birth_date: string | null;
  age: number | null;
  gender: string | null;
  political_status: string | null;
  ethnicity: string | null;
  marital_status: string | null;
  household_type: string | null;
  native_place: string | null;
  first_work_date: string | null;
  id_address: string | null;
  current_address: string | null;
  id_valid_until: string | null;
  education_json: Record<string, unknown>[] | null;
  work_experience_json: Record<string, unknown>[] | null;
  family_members_json: Record<string, unknown>[] | null;
  emergency_contacts_json: Record<string, unknown>[] | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_card_attachment_id: string | null;
  attachment_ids: EmployeeAttachmentRef[] | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string | null;
  professional_title: string | null;
  family_address: string | null;
  family_phone: string | null;
  has_company_relative: boolean | null;
  company_relative_name: string | null;
  company_relative_department: string | null;
  company_relative_relation: string | null;
  has_previous_employer_dispute: boolean | null;
  has_non_compete_obligation: boolean | null;
  personal_info_supplement: string | null;
  submission_status: string | null;
  submission_return_reason: string | null;
  entry_date: string | null;
  departure_date: string | null;
  first_entry_date: string | null;
  departure_type: string | null;
  salary_end_date: string | null;
  housing_fund_stop_date: string | null;
  social_insurance_stop_date: string | null;
  departure_remark: string | null;
  pending_submitter_id: string | null;
  pending_submit_at: string | null;
  pending_onboarded_at: string | null;
  updated_at: string | null;
  version: number;
  is_deleted: boolean;
}

export interface EmployeeCreateRequest {
  name: string;
  dept_level1_id: string;
  dept_level2_id?: string | null;
  dept_level3_id?: string | null;
  position: string;
  leader_name: string;
  personal_phone: string;
  personal_email: string;
  recruit_channel: string;
  employer_company: string;
  offer_date: string;
  expected_entry_date: string;
  original_entry_date: string;
  job_level: string;
  work_location: string;
  social_insurance_location: string;
  contract_sign_location: string;
  referrer_name?: string | null;
  referrer_relation?: string | null;
  contact_name?: string | null;
}

export interface EmployeeUpdateRequest {
  name?: string;
  dept_level1_id?: string;
  dept_level2_id?: string | null;
  dept_level3_id?: string | null;
  position?: string;
  leader_name?: string;
  personal_phone?: string;
  personal_email?: string;
  email?: string;
  recruit_channel?: string;
  employer_company?: string;
  offer_date?: string;
  expected_entry_date?: string;
  original_entry_date?: string;
  job_level?: string;
  work_location?: string;
  social_insurance_location?: string;
  contract_sign_location?: string;
  referrer_name?: string | null;
  referrer_relation?: string | null;
  contact_name?: string | null;
  // 员工个人字段
  id_number?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  political_status?: string | null;
  ethnicity?: string | null;
  marital_status?: string | null;
  household_type?: string | null;
  native_place?: string | null;
  first_work_date?: string | null;
  id_address?: string | null;
  current_address?: string | null;
  id_valid_until?: string | null;
  education_json?: Record<string, unknown>[] | null;
  work_experience_json?: Record<string, unknown>[] | null;
  family_members_json?: Record<string, unknown>[] | null;
  emergency_contacts_json?: Record<string, unknown>[] | null;
  bank_name?: string | null;
  bank_account?: string | null;
  bank_card_attachment_id?: string | null;
  attachment_ids?: EmployeeAttachmentRef[] | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  blood_type?: string | null;
  professional_title?: string | null;
  family_address?: string | null;
  family_phone?: string | null;
  has_company_relative?: boolean | null;
  company_relative_name?: string | null;
  company_relative_department?: string | null;
  company_relative_relation?: string | null;
  has_previous_employer_dispute?: boolean | null;
  has_non_compete_obligation?: boolean | null;
  personal_info_supplement?: string | null;
  first_entry_date?: string | null;
  departure_type?: '辞职' | '劝退' | '终止' | '辞退' | null;
  departure_date?: string | null;
  salary_end_date?: string | null;
  housing_fund_stop_date?: string | null;
  social_insurance_stop_date?: string | null;
  departure_remark?: string | null;
}

export interface OnboardRequest {
  job_number: string;
  probation_months: number;
  email: string;
}

export interface EmployeeImportError {
  row_number: number;
  name: string;
  message: string;
}

export interface EmployeeImportDepartmentIssue {
  row_number: number;
  name: string;
  level: number;
  department_name: string;
  message: string;
}

export interface EmployeeImportResult {
  total_count: number;
  success_count: number;
  failure_count: number;
  unmatched_department_count: number;
  errors: EmployeeImportError[];
  unmatched_departments: EmployeeImportDepartmentIssue[];
  created_count: number;
  updated_count: number;
  skipped_count: number;
}

export interface EmploymentPackageStatus {
  id: string;
  document_version: number;
  status: string;
  file_name: string | null;
  generated_at: string | null;
  first_download_available: boolean;
  redownload_request_status: string | null;
  authorization_expires_at: string | null;
}

export const EmployeeApi = {
  listPending: (params?: {
    keyword?: string;
    dept_id?: string;
    limit?: number;
    offset?: number;
  }) =>
    employeesHttp
      .get<EmployeeListResponse>("/pending", { params })
      .then((r) => r.data),

  list: (params?: {
    keyword?: string;
    dept_id?: string;
    profile_type?: string;
    entry_date_start?: string;
    entry_date_end?: string;
    departure_date_start?: string;
    departure_date_end?: string;
    limit?: number;
    offset?: number;
  }) =>
    employeesHttp.get<EmployeeListResponse>("", { params }).then((r) => r.data),

  get: (id: string) =>
    employeesHttp.get<EmployeeDetail>(`/${id}`).then((r) => r.data),

  createPending: (payload: EmployeeCreateRequest) =>
    employeesHttp.post<EmployeeDetail>("/pending", payload).then((r) => r.data),

  importPending: (file: File) => {
    const form = new FormData();
    form.append("file", file, file.name);
    return employeesHttp
      .post<EmployeeImportResult>("/pending/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      })
      .then((r) => r.data);
  },

  importEmployeeLedger: (file: File, profileType: 'formal' | 'archived') => {
    const form = new FormData();
    form.append('file', file, file.name);
    return employeesHttp
      .post<EmployeeImportResult>(`/import/ledger?profile_type=${profileType}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      .then((r) => r.data);
  },

  update: (id: string, payload: EmployeeUpdateRequest) =>
    employeesHttp.put<EmployeeDetail>(`/${id}`, payload).then((r) => r.data),

  delete: (id: string) => employeesHttp.delete(`/${id}`).then((r) => r.data),

  onboard: (id: string, payload: OnboardRequest) =>
    employeesHttp
      .post<EmployeeDetail>(`/${id}/onboard`, payload)
      .then((r) => r.data),

  /** 当前用户档案 */
  getMyProfile: () =>
    employeesHttp.get<EmployeeDetail>("/me").then((r) => r.data),

  getEmploymentPackage: () =>
    employeesHttp
      .get<EmploymentPackageStatus | null>("/me/employment-package")
      .then((r) => r.data),

  generateEmploymentPackage: (projectName?: string) =>
    employeesHttp
      .post<EmploymentPackageStatus>("/me/employment-package/generate", {
        project_name: projectName || null,
      }, { headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } })
      .then((r) => r.data),

  downloadEmploymentPackage: () =>
    employeesHttp.post<Blob>(
      "/me/employment-package/download",
      { project_name: null },
      { responseType: "blob", headers: { [READONLY_SELF_SERVICE_HEADER]: "true" } },
    ),

  downloadEmploymentPackageForEmployee: (profileId: string) =>
    employeesHttp.post<Blob>(
      `/${profileId}/employment-package/download`,
      { project_name: null },
      { responseType: "blob" },
    ),

  exportEmployeeAttachments: (profileId: string) =>
    employeesHttp.get<Blob>(`/${profileId}/attachments/export`, {
      responseType: "blob",
    }),

  exportEmployeeLedger: (params?: {
    keyword?: string;
    dept_id?: string;
    profile_type?: string;
    entry_date_start?: string;
    entry_date_end?: string;
    departure_date_start?: string;
    departure_date_end?: string;
    include_departure_details?: boolean;
  }) =>
    employeesHttp.get<Blob>("/export/ledger", {
      params,
      responseType: "blob",
    }),

  requestEmploymentPackageRedownload: (reason: string) =>
    employeesHttp
      .post<{
        id: string;
        request_status: string;
      }>("/me/employment-package/redownload-request", { reason }, {
        headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
      })
      .then((r) => r.data),

  /** 查待审批 */
  getPendingRequest: (profileId: string) =>
    employeesHttp
      .get<{
        id?: string;
        request_status?: string;
        submit_at?: string;
      }>(`/${profileId}/pending-request`)
      .then((r) => r.data),

  /** 提交档案修改审批 */
  submitChangeRequest: (profileId: string, payload: Record<string, unknown>) =>
    employeesHttp
      .post<{
        id: string;
        request_status: string;
      }>(`/${profileId}/change-request`, payload, {
        headers: { [READONLY_SELF_SERVICE_HEADER]: "true" },
      })
      .then((r) => r.data),
};



export interface EmployeeContractItem {
  id: string;
  profile_id: string;
  contract_company: string;
  contract_type: string;
  contract_start_date: string;
  contract_end_date: string | null;
  contract_end_date_text: string | null;
  renewal_count: number;
  attachment_ids: EmployeeContractAttachmentRef[] | null;
  hr_archive_attachment_ids: EmployeeContractAttachmentRef[] | null;
  archived: boolean;
  is_deleted: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface EmployeeContractCreate {
  contract_company: string;
  contract_type: string;
  contract_start_date: string;
  contract_end_date?: string | null;
  contract_end_date_text?: string | null;
  attachment_ids?: EmployeeContractAttachmentRef[] | null;
}

export interface EmployeeContractUpdate {
  contract_company?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string | null;
  contract_end_date_text?: string | null;
  renewal_count?: number;
  archived?: boolean;
  attachment_ids?: EmployeeContractAttachmentRef[] | null;
}

export const EmployeeContractApi = {
  list: (profileId: string) =>
    employeesHttp
      .get<EmployeeContractItem[]>(`/${profileId}/contracts`)
      .then((r) => r.data),

  create: (profileId: string, payload: EmployeeContractCreate) =>
    employeesHttp
      .post<EmployeeContractItem>(`/${profileId}/contracts`, payload)
      .then((r) => r.data),

  update: (
    profileId: string,
    contractId: string,
    payload: EmployeeContractUpdate,
  ) =>
    employeesHttp
      .put<EmployeeContractItem>(
        `/${profileId}/contracts/${contractId}`,
        payload,
      )
      .then((r) => r.data),

  delete: (profileId: string, contractId: string) =>
    employeesHttp
      .delete(`/${profileId}/contracts/${contractId}`)
      .then((r) => r.data),
};

// ═══════════════════════════════════════════════════════════
// OKR 目标管理 API
// ═══════════════════════════════════════════════════════════


export interface HrDepartmentConfigItem {
  id: string;
  org_id: string;
  org_name: string;
  org_path: string;
  department_no: string | null;
  center_category: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HrDepartmentConfigPayload {
  org_id: string;
  department_no: string | null;
  center_category: string | null;
}

export interface HrDepartmentConfigListResponse {
  total: number;
  items: HrDepartmentConfigItem[];
}

export interface InitializeWecomOrganizationsResponse {
  success: boolean;
  message: string;
  wecom_department_count: number;
  local_organization_count: number;
  matched_count: number;
  updated_count: number;
  unchanged_count: number;
  skipped_count: number;
  warnings: string[];
}

export interface SkippedWecomUserItem {
  name: string;
  userid: string;
  reason: string;
}

export interface InitializeWecomUsersResponse {
  success: boolean;
  message: string;
  wecom_user_count: number;
  local_user_count: number;
  matched_count: number;
  updated_count: number;
  unchanged_count: number;
  skipped_count: number;
  skipped_users: SkippedWecomUserItem[];
}

export interface HrCompanyItem {
  id: string;
  city: string;
  company_name: string;
  legal_representative: string;
  company_address: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface HrCompanyPayload {
  city: string;
  company_name: string;
  legal_representative: string;
  company_address: string;
}

export interface HrCompanyListResponse {
  total: number;
  items: HrCompanyItem[];
}

const hrModuleManagementHttp = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/oa/hr-module-management`,
});

export const HrModuleManagementApi = {
  initializeWecomUsers: () =>
    hrModuleManagementHttp
      .post<InitializeWecomUsersResponse>("/users/initialize-wecom")
      .then((response) => response.data),

  initializeWecomOrganizations: () =>
    hrModuleManagementHttp
      .post<InitializeWecomOrganizationsResponse>("/organizations/initialize-wecom")
      .then((response) => response.data),

  listDepartments: (params?: { keyword?: string; center_category?: string }) =>
    hrModuleManagementHttp
      .get<HrDepartmentConfigListResponse>("/departments", { params })
      .then((response) => response.data),

  listCenterCategories: () =>
    hrModuleManagementHttp
      .get<string[]>("/center-categories")
      .then((response) => response.data),

  createDepartment: (payload: HrDepartmentConfigPayload) =>
    hrModuleManagementHttp
      .post<HrDepartmentConfigItem>("/departments", payload)
      .then((response) => response.data),

  updateDepartment: (id: string, payload: HrDepartmentConfigPayload) =>
    hrModuleManagementHttp
      .put<HrDepartmentConfigItem>(`/departments/${id}`, payload)
      .then((response) => response.data),

  deleteDepartment: (id: string) =>
    hrModuleManagementHttp
      .delete(`/departments/${id}`)
      .then((response) => response.data),

  listCompanies: (params?: { keyword?: string }) =>
    hrModuleManagementHttp
      .get<HrCompanyListResponse>("/companies", { params })
      .then((response) => response.data),

  createCompany: (payload: HrCompanyPayload) =>
    hrModuleManagementHttp
      .post<HrCompanyItem>("/companies", payload)
      .then((response) => response.data),

  updateCompany: (id: string, payload: HrCompanyPayload) =>
    hrModuleManagementHttp
      .put<HrCompanyItem>(`/companies/${id}`, payload)
      .then((response) => response.data),

  deleteCompany: (id: string) =>
    hrModuleManagementHttp
      .delete(`/companies/${id}`)
      .then((response) => response.data),
};
