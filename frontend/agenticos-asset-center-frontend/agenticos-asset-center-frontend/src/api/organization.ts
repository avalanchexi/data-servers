import { apiClient } from './core';

export interface OrganizationResponse {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  parent_name: string | null;
  description: string | null;
  manager_ids: string[];
  manager_names: string[];
  status: string;
  if_delete: boolean;
  sort_order: number;
  user_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrganizationTreeResponse extends OrganizationResponse {
  children: OrganizationTreeResponse[];
  users?: OrganizationUserItem[];
}

export interface OrganizationListResponse {
  items: OrganizationResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
  parent_id?: string;
  description?: string;
  manager_ids?: string[];
}

export interface UpdateOrganizationRequest {
  name?: string;
  description: string | null;
  manager_ids?: string[];
  parent_id: string | null;
}

export interface OrganizationUsersRequest {
  user_ids: string[];
}

export interface OrganizationUserItem {
  id: string;
  username: string;
  display_name: string | null;
  cn_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  employee_type: string | null;
  org_id: string | null;
  is_primary: boolean;
  created_at: string | null;
  joined_at: string | null;
}

export interface OrganizationUserListResponse {
  items: OrganizationUserItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface OrganizationListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  include_deleted?: boolean;
}

export interface OrganizationUserQuery {
  page?: number;
  page_size?: number;
  search?: string;
  recursive?: boolean;
}

export interface OrganizationTreeQuery {
  include_users?: boolean;
}

export async function getOrganizationTree(params: OrganizationTreeQuery = {}): Promise<OrganizationTreeResponse[]> {
  const response = await apiClient.get<OrganizationTreeResponse[]>('/v1/admin/organizations/tree', { params });
  return response.data;
}

export async function getCrmOrganizationTree(params: OrganizationTreeQuery = {}): Promise<OrganizationTreeResponse[]> {
  const response = await apiClient.get<OrganizationTreeResponse[]>('/v1/crm/users/organization-tree', { params });
  return response.data;
}

export async function listOrganizations(params: OrganizationListQuery = {}): Promise<OrganizationListResponse> {
  const response = await apiClient.get<OrganizationListResponse>('/v1/admin/organizations', { params });
  return response.data;
}

export async function getOrganization(orgId: string): Promise<OrganizationResponse> {
  const response = await apiClient.get<OrganizationResponse>(`/v1/admin/organizations/${orgId}`);
  return response.data;
}

export async function createOrganization(data: CreateOrganizationRequest): Promise<OrganizationResponse> {
  const response = await apiClient.post<OrganizationResponse>('/v1/admin/organizations', data);
  return response.data;
}

export async function updateOrganization(orgId: string, data: UpdateOrganizationRequest): Promise<OrganizationResponse> {
  const response = await apiClient.put<OrganizationResponse>(`/v1/admin/organizations/${orgId}`, data);
  return response.data;
}

export async function deleteOrganization(orgId: string): Promise<void> {
  await apiClient.delete(`/v1/admin/organizations/${orgId}`);
}

export async function getOrgUsers(orgId: string, params: OrganizationUserQuery = {}): Promise<OrganizationUserListResponse> {
  const response = await apiClient.get<OrganizationUserListResponse>(`/v1/admin/organizations/${orgId}/users`, { params });
  return response.data;
}

export async function setOrgUsers(orgId: string, userIds: string[]): Promise<void> {
  const data: OrganizationUsersRequest = { user_ids: userIds };
  await apiClient.put(`/v1/admin/organizations/${orgId}/users`, data);
}

export async function removeUserFromOrg(orgId: string, userId: string): Promise<void> {
  await apiClient.delete(`/v1/admin/organizations/${orgId}/users/${userId}`);
}

export interface SyncOrganizationRequest {
  tenant_id?: string;
}

export interface SyncOrganizationResponse {
  success: boolean;
  message: string;
  created_count: number;
  updated_count: number;
  deactivated_count: number;
  synced_orgs: string[];
}

export async function syncOrganizationsFromOAuth(data: SyncOrganizationRequest): Promise<SyncOrganizationResponse> {
  const response = await apiClient.post<SyncOrganizationResponse>('/v1/admin/organizations/sync', data);
  return response.data;
}

export interface WecomOrganizationSyncSkippedUser {
  name: string;
  userid: string;
  reason: string;
}

export interface WecomOrganizationSyncResponse {
  success: boolean;
  message: string;
  department_count: number;
  user_count: number;
  organization_created_count: number;
  organization_renamed_count: number;
  organization_moved_count: number;
  organization_restored_count: number;
  organization_deleted_count: number;
  user_matched_count: number;
  relation_rebuilt_count: number;
  relation_row_count: number;
  manager_relation_count: number;
  manager_added_count: number;
  manager_existing_count: number;
  user_skipped_count: number;
  skipped_users: WecomOrganizationSyncSkippedUser[];
}

export async function syncOrganizationsFromWecom(): Promise<WecomOrganizationSyncResponse> {
  const response = await apiClient.post<WecomOrganizationSyncResponse>('/v1/admin/organizations/sync-wecom');
  return response.data;
}
