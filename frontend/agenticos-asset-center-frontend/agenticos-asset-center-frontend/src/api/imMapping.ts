import { apiClient } from './core'

export interface ImMappingResponse {
  id: string
  im_type: string
  im_user_id: string
  im_open_id: string | null
  im_name: string | null
  im_email: string | null
  sys_user_id: string
  sys_username: string | null
  sys_display_name: string | null
  mapped_at: string
  expires_at: string
  auth_count: number
}

export interface ImMappingListResponse {
  items: ImMappingResponse[]
  total: number
  page: number
  page_size: number
}

export interface ListImMappingsParams {
  page?: number
  page_size?: number
  search?: string
  im_type?: string
  status?: string
}

export async function listImMappings(
  params: ListImMappingsParams,
): Promise<ImMappingListResponse> {
  const response = await apiClient.get<ImMappingListResponse>(
    '/v1/admin/im-mappings',
    { params },
  )
  return response.data
}

export async function batchExpireImMappings(
  ids: string[],
): Promise<void> {
  await apiClient.delete('/v1/admin/im-mappings', { data: { ids } })
}

export async function batchRenewImMappings(
  ids: string[],
  durationDays?: number | null,
): Promise<{ renewed_count: number }> {
  const response = await apiClient.put<{ renewed_count: number }>(
    '/v1/admin/im-mappings/batch-renew',
    { ids, duration_days: durationDays ?? null },
  )
  return response.data
}
