import { apiClient } from './core'

export interface TemplateFileInfo {
  filename: string
  name: string
  description: string
  size_bytes: number
  modified_at: string
}

export interface TemplateListResponse {
  templates: TemplateFileInfo[]
  total: number
}

export interface TemplateContentResponse {
  filename: string
  content: string
  parsed: Record<string, unknown> | null
}

export interface TemplateUpdateRequest {
  content: string
}

export interface TemplateUpdateResponse {
  success: boolean
  message: string
  filename: string
}

export interface TemplateGenerateRequest {
  description: string
}

export interface TemplateGenerateResponse {
  success: boolean
  message: string
  filename: string
}

export interface TemplateReloadResponse {
  success: boolean
  message: string
  template_count: number
}

export interface TemplateDeleteResponse {
  success: boolean
  message: string
  filename: string
}

export const listTemplates = async (): Promise<TemplateListResponse> => {
  const res = await apiClient.get<TemplateListResponse>('/v1/admin/report-templates')
  return res.data
}

export const getTemplate = async (filename: string): Promise<TemplateContentResponse> => {
  const res = await apiClient.get<TemplateContentResponse>(`/v1/admin/report-templates/${encodeURIComponent(filename)}`)
  return res.data
}

export const updateTemplate = async (filename: string, request: TemplateUpdateRequest): Promise<TemplateUpdateResponse> => {
  const res = await apiClient.put<TemplateUpdateResponse>(`/v1/admin/report-templates/${encodeURIComponent(filename)}`, request)
  return res.data
}

export const generateReportTemplate = async (request: TemplateGenerateRequest): Promise<TemplateGenerateResponse> => {
  const res = await apiClient.post<TemplateGenerateResponse>('/v1/admin/report-templates/generate', request)
  return res.data
}

export const reloadTemplateCache = async (): Promise<TemplateReloadResponse> => {
  const res = await apiClient.post<TemplateReloadResponse>('/v1/admin/report-templates/reload-cache')
  return res.data
}

export const deleteReportTemplate = async (filename: string): Promise<TemplateDeleteResponse> => {
  const res = await apiClient.delete<TemplateDeleteResponse>(`/v1/admin/report-templates/${encodeURIComponent(filename)}`)
  return res.data
}
