import { apiClient, extractApiErrorMessage } from './core'

export interface AuthUser {
  id: string
  username: string
  cn_name: string | null
  display_name: string | null
  email: string | null
  avatar_url: string | null
  avatar_mode: string | null
  avatar_text: string | null
  login_count: number
  last_login_at: string | null
  last_login_source?: string | null        // 阶段 3: local/oauth/wecom/feishu/wechat
  org_id?: string | null
  org_name?: string | null
  orgs?: Array<{ id: string; name: string; is_primary?: boolean }>  // 阶段 3: 多组织
  department_name?: string | null
  employee_id?: string | null
  status?: string                            // 阶段 3: active | disabled
  if_delete?: boolean                        // 是否已删除（软删）
  locked_until?: string | null              // 阶段 3: 登录锁定截止时间
  auth_summary?: {                          // 阶段 3: 认证摘要
    local_verified?: boolean
    oauth_verified?: boolean
    wecom_verified?: boolean
    feishu_verified?: boolean
    wechat_verified?: boolean
  } | null
  roles?: Array<{ id: string; code: string; name: string }>
}

export interface AuthUserResponse extends AuthUser {
  phone?: string
  telephone?: string
  address?: string
  title?: string
  employee_type?: string
}

export interface UserListResponse {
  items: AuthUserResponse[]
  total: number
  page: number
  page_size: number
}

export interface CreateUserRequest {
  username: string
  cn_name?: string
  employee_id?: string
  email?: string
  password: string
  phone: string
  telephone?: string
  address?: string
  title?: string
  org_id?: string
  employee_type?: string
}

export interface UpdateUserRequest {
  cn_name?: string | null
  employee_id?: string | null
  email?: string | null
  telephone?: string | null
  address?: string | null
  title?: string | null
  employee_type?: string | null
}

export interface ResetPasswordResponse {
  message: string
  default_password: string
}

export interface LoginResponse {
  user: AuthUser
  access_token?: string | null
  refresh_token?: string | null
}

export interface AuthConfigResponse {
  oauth_enabled: boolean
  local_login_enabled: boolean
  wecom_login_enabled: boolean
  wecom_trusted_domain: string
}

export type AuthMode = 'local' | 'oauth' | 'wecom'

export interface MeResponse {
  user: AuthUser
}

export const getAuthConfig = async (): Promise<AuthConfigResponse> => {
  try {
    const response = await apiClient.get<AuthConfigResponse>('/v1/auth/config')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, '获取认证配置失败'))
  }
}

export interface QrcodeUrlResponse {
  qrcode_url: string
  state: string
}

export const getQrcodeUrl = async (): Promise<QrcodeUrlResponse> => {
  try {
    const response = await apiClient.get<QrcodeUrlResponse>('/v1/wecom-app/qrcode/url')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, '获取扫码登录地址失败'))
  }
}

export interface QrcodeStatusResponse {
  status: 'pending' | 'scanned' | 'expired'
  user_id: string | null
  username: string | null
}

export const getQrcodeStatus = async (state: string): Promise<QrcodeStatusResponse> => {
  try {
    const response = await apiClient.get<QrcodeStatusResponse>('/v1/wecom-app/qrcode/status', {
      params: { state },
    })
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, '查询扫码状态失败'))
  }
}

export const login = async (username: string, password: string, authMode: AuthMode = 'oauth'): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/v1/auth/login', {
      username,
      password,
      auth_mode: authMode,
    })
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, '登录失败，请稍后重试'))
  }
}

export const logout = async (): Promise<void> => {
  await apiClient.post('/v1/auth/logout')
}

export const getCurrentUser = async (): Promise<MeResponse> => {
  const response = await apiClient.get<MeResponse>('/v1/auth/me')
  return response.data
}

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  try {
    await apiClient.post('/v1/auth/password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, '密码修改失败，请稍后重试'))
  }
}

/** OAuth 用户补充本地密码认证，无需旧密码 */
export const setLocalPassword = async (newPassword: string): Promise<void> => {
  try {
    await apiClient.post('/v1/auth/local-password', {
      new_password: newPassword,
    })
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, '设置密码失败，请稍后重试'))
  }
}

export interface UpdateProfileRequest {
  email?: string | null
  display_name?: string | null
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<MeResponse> => {
  try {
    const response = await apiClient.put<MeResponse>('/v1/auth/profile', data)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, '更新个人资料失败，请稍后重试'))
  }
}
