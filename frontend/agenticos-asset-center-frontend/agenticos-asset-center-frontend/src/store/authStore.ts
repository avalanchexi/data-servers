import { create } from 'zustand'
import { isAxiosError } from 'axios'
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  AuthMode,
  AuthUser,
} from '../api/client'
import { getCurrentUserMenuPermissions } from '../api/permission'
import { KbApi } from '../api/knowledgeRag'

// 企微 WebView 可能清空 session cookie，用 localStorage 缓存用户数据以改善重复登录体验
const WECOM_USER_CACHE_KEY = 'wecom_cached_user'
const WECOM_USERNAME_CACHE_KEY = 'wecom_last_username'
const WECOM_PERMISSIONS_CACHE_KEY = 'wecom_cached_permissions'
// 只读权限缓存：生命周期与 permissions 一致，供 API 层拦截器（interceptor.ts）从 localStorage 读取，避免循环依赖
const WECOM_READONLY_MENUS_CACHE_KEY = 'wecom_cached_readonly_menus'
const WECOM_READONLY_ALL_CACHE_KEY = 'wecom_cached_readonly_all'

function cacheUser(user: AuthUser) {
  try {
    localStorage.setItem(WECOM_USER_CACHE_KEY, JSON.stringify(user))
    localStorage.setItem(WECOM_USERNAME_CACHE_KEY, user.username)
  } catch { /* 忽略写入失败 */ }
}

function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(WECOM_USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function cachePermissions(permissions: string[]) {
  try {
    localStorage.setItem(WECOM_PERMISSIONS_CACHE_KEY, JSON.stringify(permissions))
  } catch { /* 忽略写入失败 */ }
}

function getCachedPermissions(): string[] {
  try {
    const raw = localStorage.getItem(WECOM_PERMISSIONS_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function cacheReadonlyInfo(readonlyMenus: string[], readonlyAll: boolean) {
  try {
    localStorage.setItem(WECOM_READONLY_MENUS_CACHE_KEY, JSON.stringify(readonlyMenus))
    localStorage.setItem(WECOM_READONLY_ALL_CACHE_KEY, String(readonlyAll))
  } catch { /* 忽略写入失败 */ }
}

function getCachedReadonlyMenus(): string[] {
  try {
    const raw = localStorage.getItem(WECOM_READONLY_MENUS_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function getCachedReadonlyAll(): boolean {
  try {
    return localStorage.getItem(WECOM_READONLY_ALL_CACHE_KEY) === 'true'
  } catch {
    return false
  }
}

function clearUserCache() {
  try {
    localStorage.removeItem(WECOM_USER_CACHE_KEY)
    localStorage.removeItem(WECOM_USERNAME_CACHE_KEY)
    localStorage.removeItem(WECOM_PERMISSIONS_CACHE_KEY)
    localStorage.removeItem(WECOM_READONLY_MENUS_CACHE_KEY)
    localStorage.removeItem(WECOM_READONLY_ALL_CACHE_KEY)
  } catch { /* 忽略 */ }
}

interface AuthState {
  user: AuthUser | null
  initialized: boolean
  checking: boolean
  loginError: string | null
  authMode: AuthMode | null
  permissions: string[]
  /** 只读菜单列表（多角色权限最大化合并后仍不可写的菜单） */
  readonlyMenus: string[]
  /** 全站只读标记（所有可见菜单均无写权限，API 层拦截器据此拒绝非 GET 请求） */
  readonlyAll: boolean
  checkSession: () => Promise<void>
  login: (username: string, password: string, authMode?: AuthMode) => Promise<void>
  logout: () => Promise<void>
  refreshPermissions: () => Promise<void>
}

// 初始化时从 localStorage 恢复缓存用户和权限，避免每次刷新都显示"正在检查登录状态..."
const cachedUserOnInit = getCachedUser()
const cachedPermissionsOnInit = getCachedPermissions()
const cachedReadonlyMenusOnInit = getCachedReadonlyMenus()
const cachedReadonlyAllOnInit = getCachedReadonlyAll()

export const useAuthStore = create<AuthState>((set) => ({
  user: cachedUserOnInit,
  initialized: !!cachedUserOnInit,
  // 有缓存用户时仍需等待首次权限校验，避免入口页用空权限抢先跳到对话页
  checking: !!cachedUserOnInit,
  loginError: null,
  authMode: null,
  permissions: cachedPermissionsOnInit,
  readonlyMenus: cachedReadonlyMenusOnInit,
  readonlyAll: cachedReadonlyAllOnInit,

  checkSession: async () => {
    set({ checking: true })
    try {
      // 并行请求用户信息和菜单权限，减少串行等待时间
      const [result, permissionsResult] = await Promise.all([
        getCurrentUser(),
        getCurrentUserMenuPermissions(),
      ])
      const authMode = result.user.auth_summary?.oauth_verified === true ? 'oauth' : 'local'
      const readonlyMenus = permissionsResult.readonly_menus ?? []
      const readonlyAll = permissionsResult.readonly_all ?? false
      cacheUser(result.user)
      cachePermissions(permissionsResult.menus)
      cacheReadonlyInfo(readonlyMenus, readonlyAll)
      set({ user: result.user, permissions: permissionsResult.menus, readonlyMenus, readonlyAll, initialized: true, checking: false, loginError: null, authMode })
    } catch (error: unknown) {
      // 401 表示 session 已过期，不使用缓存用户，避免与拦截器形成死循环
      if (isAxiosError(error) && error.response?.status === 401) {
        clearUserCache()
        set({ user: null, permissions: [], readonlyMenus: [], readonlyAll: false, initialized: true, checking: false, loginError: null, authMode: null })
      } else {
        // 网络错误等其他异常时，尝试用缓存恢复
        const cached = getCachedUser()
        set({ user: cached, permissions: [], initialized: true, checking: false })
      }
    }
  },

  login: async (username: string, password: string, authMode: AuthMode = 'oauth') => {
    set({ checking: true, loginError: null })
    try {
      const result = await apiLogin(username, password, authMode)
      const permissionsResult = await getCurrentUserMenuPermissions()
      const readonlyMenus = permissionsResult.readonly_menus ?? []
      const readonlyAll = permissionsResult.readonly_all ?? false
      cacheUser(result.user)
      cachePermissions(permissionsResult.menus)
      cacheReadonlyInfo(readonlyMenus, readonlyAll)
      set({ user: result.user, permissions: permissionsResult.menus, readonlyMenus, readonlyAll, initialized: true, checking: false, loginError: null, authMode })

      // 登录成功后异步刷新所有知识库存储容量（不阻塞登录流程）。
      // 该接口会更新统计字段，只有知识库具备编辑权限时才允许调用。
      if (
        permissionsResult.menus.includes('knowledge-kb')
        && !readonlyMenus.includes('knowledge-kb')
      ) {
        KbApi.refreshAllStorage().catch(() => { /* 静默失败，不影响用户体验 */ })
      }


    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      set({ user: null, permissions: [], readonlyMenus: [], readonlyAll: false, initialized: true, checking: false, loginError: message, authMode: null })
      throw error
    }
  },

  logout: async () => {
    try {
      await apiLogout()
    } finally {
      clearUserCache()
      set({ user: null, permissions: [], readonlyMenus: [], readonlyAll: false, initialized: true, checking: false, loginError: null, authMode: null })
    }
  },

  refreshPermissions: async () => {
    try {
      const permissionsResult = await getCurrentUserMenuPermissions()
      const readonlyMenus = permissionsResult.readonly_menus ?? []
      const readonlyAll = permissionsResult.readonly_all ?? false
      cachePermissions(permissionsResult.menus)
      cacheReadonlyInfo(readonlyMenus, readonlyAll)
      set({ permissions: permissionsResult.menus, readonlyMenus, readonlyAll })
    } catch {
      set({ permissions: [], readonlyMenus: [], readonlyAll: false })
    }
  },
}))
