import { apiClient } from './client';

export interface RoleResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  builtin: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface RoleCreateRequest {
  code: string;
  name: string;
  description?: string;
}

export interface RoleUpdateRequest {
  name?: string;
  description?: string;
}

export interface UserRolesUpdateRequest {
  role_ids: string[];
}

export async function listRoles(): Promise<RoleResponse[]> {
  const response = await apiClient.get<RoleResponse[]>('/v1/roles');
  return response.data;
}

export async function getRole(roleId: string): Promise<RoleResponse> {
  const response = await apiClient.get<RoleResponse>(`/v1/roles/${roleId}`);
  return response.data;
}

export async function createRole(data: RoleCreateRequest): Promise<RoleResponse> {
  const response = await apiClient.post<RoleResponse>('/v1/roles', data);
  return response.data;
}

export async function updateRole(roleId: string, data: RoleUpdateRequest): Promise<RoleResponse> {
  const response = await apiClient.put<RoleResponse>(`/v1/roles/${roleId}`, data);
  return response.data;
}

export async function deleteRole(roleId: string): Promise<void> {
  await apiClient.delete(`/v1/roles/${roleId}`);
}

export interface RoleUsageResponse {
  used_by_users: boolean;
  has_permissions: boolean;
  can_delete: boolean;
}

export async function checkRoleUsage(roleId: string): Promise<RoleUsageResponse> {
  const response = await apiClient.get<RoleUsageResponse>(`/v1/roles/${roleId}/usage`);
  return response.data;
}

export async function getUserRoles(userId: string): Promise<RoleResponse[]> {
  const response = await apiClient.get<RoleResponse[]>(`/v1/roles/users/${userId}`);
  return response.data;
}

export async function setUserRoles(userId: string, roleIds: string[]): Promise<RoleResponse[]> {
  const requestData: UserRolesUpdateRequest = { role_ids: roleIds };
  const response = await apiClient.put<RoleResponse[]>(`/v1/roles/users/${userId}`, requestData);
  return response.data;
}
