/** 企微应用相关 API 接口。 */

import { apiClient } from './core'
import type { AuthUser } from './auth'

export interface WecomFastLoginRequest {
  wecom_userid: string
  wecom_user_name?: string
  wecom_user_email?: string
}

export interface WecomFastLoginResponse {
  user: AuthUser
  need_bind: boolean
}

/** 企微快捷登录 */
export const wecomFastLogin = async (data: WecomFastLoginRequest): Promise<WecomFastLoginResponse> => {
  const response = await apiClient.post<WecomFastLoginResponse>('/v1/wecom-app/fast-login', data)
  return response.data
}

/** 查询企微用户映射状态 */
export const getWecomUserMapping = async (userid: string): Promise<{ mapped: boolean; sys_user_id: string | null }> => {
  const response = await apiClient.get('/v1/wecom-app/user-info', { params: { userid } })
  return response.data
}
