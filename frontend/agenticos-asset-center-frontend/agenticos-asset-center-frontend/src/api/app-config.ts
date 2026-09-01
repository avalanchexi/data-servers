import { apiClient } from './core'

export interface AppConfigFieldInfo {
  key: string
  raw_value: string | number | boolean | null
  display_value: string
  field_type: string
  masked: boolean
  comment: string
  options: string[] | null
}

export interface AppConfigSection {
  name: string
  label: string
  fields: AppConfigFieldInfo[]
}

export interface AppConfigResponse {
  sections: AppConfigSection[]
  file_exists: boolean
  last_modified: string | null
}

export interface AppConfigUpdateItem {
  section: string
  key: string
  value: string | number | boolean | null
}

export interface AppConfigBatchUpdateRequest {
  updates: AppConfigUpdateItem[]
}

export interface AppConfigUpdateResponse {
  success: boolean
  message: string
  backup_path: string | null
}

export const getAppConfig = async (): Promise<AppConfigResponse> => {
  const res = await apiClient.get<AppConfigResponse>('/v1/admin/app-config')
  return res.data
}

export const batchUpdateAppConfig = async (request: AppConfigBatchUpdateRequest): Promise<AppConfigUpdateResponse> => {
  const res = await apiClient.put<AppConfigUpdateResponse>('/v1/admin/app-config/batch', request)
  return res.data
}
