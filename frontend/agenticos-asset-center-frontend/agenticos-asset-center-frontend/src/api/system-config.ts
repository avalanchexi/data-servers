import { apiClient } from './core'

export interface ConfigFieldInfo {
  key: string
  raw_value: string | number | boolean | null
  display_value: string
  field_type: string
  masked: boolean
  comment: string
  options: string[] | null
}

export interface ConfigSection {
  name: string
  label: string
  fields: ConfigFieldInfo[]
}

export interface SystemConfigResponse {
  sections: ConfigSection[]
  file_exists: boolean
  last_modified: string | null
}

export interface ConfigUpdateItem {
  section: string
  key: string
  value: string | number | boolean | null
}

export interface BatchConfigUpdateRequest {
  updates: ConfigUpdateItem[]
}

export interface ConfigUpdateResponse {
  success: boolean
  message: string
  backup_path: string | null
}

export interface ConfigBackupInfo {
  filename: string
  path: string
  size_bytes: number
  created_at: string
}

export interface ConfigBackupListResponse {
  backups: ConfigBackupInfo[]
}

/** 获取完整系统配置 */
export const getConfig = async (): Promise<SystemConfigResponse> => {
  const res = await apiClient.get<SystemConfigResponse>('/v1/admin/system-config')
  return res.data
}

/** 批量更新配置 */
export const batchUpdateConfig = async (request: BatchConfigUpdateRequest): Promise<ConfigUpdateResponse> => {
  const res = await apiClient.put<ConfigUpdateResponse>('/v1/admin/system-config/batch', request)
  return res.data
}

/** 创建备份 */
export const createBackup = async (): Promise<ConfigUpdateResponse> => {
  const res = await apiClient.post<ConfigUpdateResponse>('/v1/admin/system-config/backup')
  return res.data
}

/** 获取备份列表 */
export const listBackups = async (): Promise<ConfigBackupListResponse> => {
  const res = await apiClient.get<ConfigBackupListResponse>('/v1/admin/system-config/backups')
  return res.data
}
