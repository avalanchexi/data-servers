import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/skills`,
})

export interface ToolConfig {
  name: string
  label?: string
  description: string
}

export interface CreateSkillRequest {
  name: string
  display_name: string
  description: string
  category: string
  version: string
  tags: string[]
  tools: ToolConfig[]
}

export interface CreateSkillResponse {
  success: boolean
  message: string
  skill_id: string
  path: string
}

export interface DeleteSkillResponse {
  success: boolean
  message: string
}

export interface SkillDetailTool {
  name: string
  description: string
}

export interface SkillDetailFile {
  name: string
  size: number
}

export interface SkillDetail {
  skill_id: string
  skill_name: string
  description: string
  category: string
  source: string
  path: string
  enabled: boolean
  frontmatter: Record<string, unknown>
  tools: SkillDetailTool[]
  raw_content: string
  body: string
  files: SkillDetailFile[]
}

export interface AiSuggestRequest {
  description: string
}

export interface AiSuggestTool {
  name: string
  label?: string
  description: string
  source?: string  // 'real'=真实工具, 'template'=模板工具, 'llm'=LLM推荐
}

export interface AvailableTool {
  name: string
  label: string
  description: string
}

export interface AiSuggestResponse {
  suggested_name: string
  suggested_display_name: string
  suggested_description: string
  suggested_category: string
  suggested_tags: string[]
  suggested_tools: AiSuggestTool[]
}

export interface TemplateTool {
  name: string
  description: string
}

export interface TemplateItem {
  id: string
  name: string
  description: string
  tags: string[]
  tools: TemplateTool[]
}

export interface TemplateListResponse {
  items: TemplateItem[]
}

export interface UpdateSkillRequest {
  display_name?: string
  description?: string
  tags?: string[]
  tools?: ToolConfig[]
}

export interface UpdateSkillResponse {
  success: boolean
  message: string
  skill_id: string
}

export interface SkillImportResponse {
  success: boolean
  message: string
  skill_id?: string
  path?: string
}

export interface FileUploadResponse {
  success: boolean
  message: string
  file_name: string
  file_size: number
}

export const SkillApi = {
  create: (payload: CreateSkillRequest) =>
    http.post<CreateSkillResponse>('', payload).then((r) => r.data),

  delete: (skillId: string) =>
    http.delete<DeleteSkillResponse>(`/delete?skill_id=${encodeURIComponent(skillId)}`).then((r) => r.data),

  checkName: (name: string, category: string = 'custom') =>
    http.get<{ exists: boolean }>(`/check-name?name=${encodeURIComponent(name)}&category=${encodeURIComponent(category)}`).then((r) => r.data),

  getDetail: (skillId: string) =>
    http.get<SkillDetail>(`/detail?skill_id=${encodeURIComponent(skillId)}`).then((r) => r.data),

  aiSuggest: (payload: AiSuggestRequest) =>
    http.post<AiSuggestResponse>('/ai-suggest', payload).then((r) => r.data),

  listTemplates: () =>
    http.get<TemplateListResponse>('/templates').then((r) => r.data),

  listAvailableTools: () =>
    http.get<AvailableTool[]>('/available-tools').then((r) => r.data),

  update: (skillId: string, payload: UpdateSkillRequest) =>
    http.put<UpdateSkillResponse>(`/update?skill_id=${encodeURIComponent(skillId)}`, payload).then((r) => r.data),

  importZip: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<SkillImportResponse>('/import', formData).then((r) => r.data)
  },

  exportZip: (skillId: string) =>
    http.get(`/export?skill_id=${encodeURIComponent(skillId)}`, { responseType: 'blob' }).then((r) => {
      const disposition = r.headers['content-disposition'] || ''
      const match = disposition.match(/filename="?([^";]+)"?/)
      const fileName = match ? match[1] : 'skill.zip'
      const url = URL.createObjectURL(r.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    }),

  uploadFile: (skillId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<FileUploadResponse>(`/files?skill_id=${encodeURIComponent(skillId)}`, formData).then((r) => r.data)
  },
}
