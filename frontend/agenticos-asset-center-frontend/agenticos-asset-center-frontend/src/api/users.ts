import { apiClient } from './core'
import type { AuthUserResponse, UserListResponse, CreateUserRequest, UpdateUserRequest, ResetPasswordResponse } from './auth'

export interface UserListQuery {
  page?: number
  page_size?: number
  search?: string
  oauth_verified?: boolean
  wecom_verified?: boolean
  local_verified?: boolean
  role_code?: string
  org_id?: string
  status?: string
  has_phone?: boolean
}

export const listUsers = async (params: UserListQuery = {}): Promise<UserListResponse> => {
  const response = await apiClient.get<UserListResponse>('/v1/admin/users', { params })
  return response.data
}

export const getUser = async (userId: string): Promise<AuthUserResponse> => {
  const response = await apiClient.get<AuthUserResponse>(`/v1/admin/users/${userId}`)
  return response.data
}

export const createUser = async (data: CreateUserRequest): Promise<AuthUserResponse> => {
  const response = await apiClient.post<AuthUserResponse>('/v1/admin/users', data)
  return response.data
}

export const updateUser = async (userId: string, data: UpdateUserRequest): Promise<AuthUserResponse> => {
  const response = await apiClient.put<AuthUserResponse>(`/v1/admin/users/${userId}`, data)
  return response.data
}

export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/v1/admin/users/${userId}`)
}

export const batchDeleteUsers = async (userIds: string[]): Promise<{ deleted_count: number; errors: string[] }> => {
  const response = await apiClient.post('/v1/admin/users/batch/delete', { user_ids: userIds })
  return response.data
}

export const disableUser = async (userId: string): Promise<void> => {
  await apiClient.post(`/v1/admin/users/${userId}/disable`)
}

export const enableUser = async (userId: string): Promise<void> => {
  await apiClient.post(`/v1/admin/users/${userId}/enable`)
}

export const batchDisableUsers = async (userIds: string[]): Promise<{ message: string; disabled_count: number; errors: string[] }> => {
  const response = await apiClient.post('/v1/admin/users/batch/disable', { user_ids: userIds })
  return response.data
}

export const batchEnableUsers = async (userIds: string[]): Promise<{ message: string; enabled_count: number; errors: string[] }> => {
  const response = await apiClient.post('/v1/admin/users/batch/enable', { user_ids: userIds })
  return response.data
}

export const unlockUser = async (userId: string): Promise<void> => {
  await apiClient.post(`/v1/admin/users/${userId}/unlock`)
}

export const resetPassword = async (userId: string): Promise<ResetPasswordResponse> => {
  const response = await apiClient.post<ResetPasswordResponse>(`/v1/admin/users/${userId}/reset-password`)
  return response.data
}

export interface SyncUserResponse {
  success: boolean
  message: string
  created_count: number
  updated_count: number
  synced_users: string[]
}

export const syncUsersFromOAuth = async (): Promise<SyncUserResponse> => {
  const response = await apiClient.post<SyncUserResponse>('/v1/admin/users/sync', {})
  return response.data
}

export interface WecomUserSyncSkippedItem {
  name: string
  userid: string
  reason: string
}

export interface WecomUserSyncResponse {
  success: boolean
  message: string
  wecom_user_count: number
  matched_count: number
  updated_count: number
  created_count: number
  restored_count: number
  departed_count: number
  profile_updated_count: number
  profile_restored_count: number
  profile_archived_count: number
  skipped_count: number
  skipped_users: WecomUserSyncSkippedItem[]
}

export const syncUsersFromWecom = async (): Promise<WecomUserSyncResponse> => {
  const response = await apiClient.post<WecomUserSyncResponse>('/v1/admin/users/sync-wecom')
  return response.data
}
