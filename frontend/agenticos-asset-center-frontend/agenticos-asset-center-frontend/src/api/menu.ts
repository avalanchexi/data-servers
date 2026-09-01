import { apiClient } from './client';

export type MenuKind = 'section' | 'menu' | 'action';
export type MenuSource = 'module' | 'manual';

export interface MenuNode {
  id: string;
  parent_id: string | null;
  module: string;
  kind: MenuKind;
  title: string;
  icon: string | null;
  route: string | null;
  hidden: boolean;
  sort_order: number;
  enabled: boolean;
  source: MenuSource;
  remark: string | null;
  children: MenuNode[];
}

export interface MenuNavigationResponse {
  sections: MenuNode[];
}

export interface MenuTreeResponse {
  nodes: MenuNode[];
}

export interface MenuCreateRequest {
  id: string;
  parent_id?: string | null;
  kind?: MenuKind;
  title: string;
  icon?: string | null;
  route?: string | null;
  hidden?: boolean;
  sort_order?: number;
  enabled?: boolean;
  remark?: string | null;
}

export interface MenuUpdateRequest {
  parent_id?: string | null;
  title?: string | null;
  icon?: string | null;
  route?: string | null;
  hidden?: boolean | null;
  sort_order?: number | null;
  enabled?: boolean | null;
  remark?: string | null;
}

export interface MenuSortItem {
  id: string;
  sort_order: number;
}

/** 导航下发树（无权限守卫，仅返回结构；前端按 permissions 过滤） */
export async function getMenuNavigation(): Promise<MenuNavigationResponse> {
  const response = await apiClient.get<MenuNavigationResponse>('/v1/menus/navigation');
  return response.data;
}

/** 「功能菜单」页签全量树（含 hidden/disabled/action 节点） */
export async function getMenuTree(): Promise<MenuTreeResponse> {
  const response = await apiClient.get<MenuTreeResponse>('/v1/menus/tree');
  return response.data;
}

export async function createMenu(data: MenuCreateRequest): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>('/v1/menus', data);
  return response.data;
}

export async function updateMenu(menuId: string, data: MenuUpdateRequest): Promise<{ id: string }> {
  const response = await apiClient.put<{ id: string }>(`/v1/menus/${menuId}`, data);
  return response.data;
}

export async function deleteMenu(menuId: string): Promise<{ id: string }> {
  const response = await apiClient.delete<{ id: string }>(`/v1/menus/${menuId}`);
  return response.data;
}

/** 批量更新同级排序权重 */
export async function batchSortMenus(items: MenuSortItem[]): Promise<{ changed: number }> {
  const response = await apiClient.put<{ changed: number }>('/v1/menus/sort', { items });
  return response.data;
}
