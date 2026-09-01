import { apiClient } from './client';

export interface MenuPermissionNode {
  id: string;
  label: string;
  section_id: string;
  section_title: string;
  role_ids: string[];
  // 矩阵式授权：角色 → 操作级别（"read"/"write"）
  role_actions: Record<string, string>;
}

export interface MenuPermissionSection {
  id: string;
  title: string;
  children: MenuPermissionNode[];
}

export interface MenuPermissionListResponse {
  sections: MenuPermissionSection[];
}

export interface MenuRoleUpdateResponse {
  menu_id: string;
  role_ids: string[];
}

export interface MenuPermissionsUpdateRequest {
  role_actions: Record<string, string | null>;
}

export interface RoleMenuUpdateResponse {
  role_id: string;
  menu_ids: string[];
}

export interface RoleMenuPermissionsUpdateRequest {
  menu_actions: Record<string, string | null>;
}

export interface UserMenuPermissionResponse {
  menus: string[];
  // 只读菜单列表（多角色权限最大化合并后仍不可写的菜单）
  readonly_menus?: string[];
  // 全站只读标记（所有可见菜单均无写权限，前端据此全局拦截非 GET 请求）
  readonly_all?: boolean;
}

export async function getCurrentUserMenuPermissions(): Promise<UserMenuPermissionResponse> {
  const response = await apiClient.get<UserMenuPermissionResponse>('/v1/permissions/me/menus');
  return response.data;
}

export async function getMenuPermissions(): Promise<MenuPermissionListResponse> {
  const response = await apiClient.get<MenuPermissionListResponse>('/v1/permissions/menus');
  return response.data;
}

export async function updateMenuPermissions(
  menuId: string,
  roleActions: Record<string, string | null>,
): Promise<MenuRoleUpdateResponse> {
  const response = await apiClient.put<MenuRoleUpdateResponse>(`/v1/permissions/menus/${menuId}/permissions`, {
    role_actions: roleActions,
  });
  return response.data;
}

export async function updateRoleMenuPermissions(
  roleId: string,
  menuActions: Record<string, string | null>,
): Promise<RoleMenuUpdateResponse> {
  const response = await apiClient.put<RoleMenuUpdateResponse>(`/v1/permissions/roles/${roleId}/permissions`, {
    menu_actions: menuActions,
  });
  return response.data;
}
