import {apiClient} from './core'

/** 字典类型 */
export interface DictType {
  id: string
  type_code: string
  type_name: string
  remark: string | null
  is_system: boolean
  sort_order: number
  item_count: number
  created_at: string
  updated_at: string
}

export interface DictTypeListResponse {
  items: DictType[]
}

export interface DictTypeCreateRequest {
  type_code: string
  type_name: string
  remark?: string | null
  is_system?: boolean
  sort_order?: number
}

export interface DictTypeUpdateRequest {
  type_name?: string
  remark?: string | null
  sort_order?: number
}

/** 字典条目 */
export interface DictItem {
  id: string
  type_code: string
  item_code: string
  item_name: string
  sort_order: number
  is_active: boolean
  extra: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface DictItemListResponse {
  items: DictItem[]
}

export interface DictItemCreateRequest {
  item_code: string
  item_name: string
  sort_order?: number
  is_active?: boolean
  extra?: Record<string, unknown> | null
}

export interface DictItemUpdateRequest {
  item_code?: string
  item_name?: string
  sort_order?: number
  is_active?: boolean
  extra?: Record<string, unknown> | null
}

export interface DictItemBatchDeleteRequest {
  item_ids: string[]
}

/** 业务读取（[{code,name}]） */
export interface DictSimpleItem {
  code: string
  name: string
}

export interface DictSimpleListResponse {
  items: DictSimpleItem[]
}

/** 获取全部字典类型（含条目数量） */
export const listDictTypes = async (): Promise<DictTypeListResponse> => {
  const res = await apiClient.get<DictTypeListResponse>('/v1/system/dict-types')
  return res.data
}

/** 新增字典类型，返回最新列表 */
export const createDictType = async (body: DictTypeCreateRequest): Promise<DictTypeListResponse> => {
  const res = await apiClient.post<DictTypeListResponse>('/v1/system/dict-types', body)
  return res.data
}

/** 编辑字典类型，返回最新列表 */
export const updateDictType = async (
  typeCode: string,
  body: DictTypeUpdateRequest,
): Promise<DictTypeListResponse> => {
  const res = await apiClient.put<DictTypeListResponse>(`/v1/system/dict-types/${typeCode}`, body)
  return res.data
}

/** 删除字典类型，返回最新列表 */
export const deleteDictType = async (typeCode: string): Promise<DictTypeListResponse> => {
  const res = await apiClient.delete<DictTypeListResponse>(`/v1/system/dict-types/${typeCode}`)
  return res.data
}

/** 获取某类型的全部条目 */
export const listDictItems = async (typeCode: string): Promise<DictItemListResponse> => {
  const res = await apiClient.get<DictItemListResponse>(`/v1/system/dict-types/${typeCode}/items`)
  return res.data
}

/** 新增条目，返回最新条目列表 */
export const createDictItem = async (
  typeCode: string,
  body: DictItemCreateRequest,
): Promise<DictItemListResponse> => {
  const res = await apiClient.post<DictItemListResponse>(`/v1/system/dict-types/${typeCode}/items`, body)
  return res.data
}

/** 编辑条目，返回最新条目列表 */
export const updateDictItem = async (
  typeCode: string,
  itemId: string,
  body: DictItemUpdateRequest,
): Promise<DictItemListResponse> => {
  const res = await apiClient.put<DictItemListResponse>(
    `/v1/system/dict-types/${typeCode}/items/${itemId}`,
    body,
  )
  return res.data
}

/** 删除条目，返回最新条目列表 */
export const deleteDictItem = async (
  typeCode: string,
  itemId: string,
): Promise<DictItemListResponse> => {
  const res = await apiClient.delete<DictItemListResponse>(
    `/v1/system/dict-types/${typeCode}/items/${itemId}`,
  )
  return res.data
}

/** 批量删除条目，返回最新条目列表 */
export const batchDeleteDictItems = async (
  typeCode: string,
  body: DictItemBatchDeleteRequest,
): Promise<DictItemListResponse> => {
  const res = await apiClient.post<DictItemListResponse>(
    `/v1/system/dict-types/${typeCode}/items/batch-delete`,
    body,
  )
  return res.data
}

/** 业务读取：某类型全部启用条目（[{code,name}]） */
export const getDictItems = async (typeCode: string): Promise<DictSimpleListResponse> => {
  const res = await apiClient.get<DictSimpleListResponse>(`/v1/system/dicts/${typeCode}`)
  return res.data
}
