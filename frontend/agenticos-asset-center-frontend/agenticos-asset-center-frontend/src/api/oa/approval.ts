import { employeesHttp } from "./hr";


// ── 审批请求 API（HR） ────────────────────────────────────
export interface ApproveRequestItem {
  id: string;
  profile_id: string;
  request_type: string;
  request_status: string;
  submitter_id: string;
  submitter_name: string;
  employee_name: string;
  approver_id: string | null;
  review_comment: string | null;
  submit_at: string | null;
  review_at: string | null;
  created_at: string | null;
}

export interface ApproveRequestListResponse {
  total: number;
  items: ApproveRequestItem[];
  limit: number;
  offset: number;
}

export interface ApproveRequestDetail extends ApproveRequestItem {
  candidate_data: Record<string, unknown> | null;
  original_data: Record<string, unknown> | null;
}

export const ApprovalApi = {
  list: (params?: {
    keyword?: string;
    request_status?: string;
    limit?: number;
    offset?: number;
  }) =>
    employeesHttp
      .get<ApproveRequestListResponse>("/approvals", { params })
      .then((r) => r.data),

  getDetail: (requestId: string) =>
    employeesHttp
      .get<ApproveRequestDetail>(`/approvals/${requestId}`)
      .then((r) => r.data),

  action: (
    requestId: string,
    payload: { action: "approve" | "reject"; comment?: string | null },
  ) =>
    employeesHttp
      .post<{ success: boolean }>(`/approvals/${requestId}/action`, payload)
      .then((r) => r.data),
};

// ── 员工劳动合同 API ─────────────────────────────────────
