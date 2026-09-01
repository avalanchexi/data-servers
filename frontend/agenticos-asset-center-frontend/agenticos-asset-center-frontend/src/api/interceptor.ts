import type { AxiosInstance } from 'axios'

/** 根据当前 hash 和 window.name 判断是否在企微应用上下文中 */
function isWecomContext(): boolean {
  const hash = window.location.hash
  if (hash.startsWith('#/wecom')) return true
  const name = window.name
  return !!(name && name.indexOf('_wecom_') === 0)
}

/**
 * 全站只读标志的 localStorage 键，与 authStore.ts 的 WECOM_READONLY_ALL_CACHE_KEY 保持一致。
 * 不从 authStore 直接读取：authStore → api/client → core → http → interceptor 存在循环依赖。
 */
const READONLY_ALL_CACHE_KEY = 'wecom_cached_readonly_all'
/** 仅供后端仍会执行归属校验的自助业务显式绕过前端全站只读拦截。 */
export const READONLY_SELF_SERVICE_HEADER = 'X-Client-Readonly-Self-Service'

/** 判断当前是否为全站只读模式（authStore 登录/权限刷新时写入，登出时清除） */
function isGlobalReadonly(): boolean {
  try {
    return localStorage.getItem(READONLY_ALL_CACHE_KEY) === 'true'
  } catch {
    return false
  }
}

/** 判断当前是否已在登录页，避免 401 拦截器与 checkSession 形成死循环 */
function isOnLoginPage(): boolean {
  const hash = window.location.hash
  return hash === '#/login' || hash.startsWith('#/wecom/login')
}

/** 最近一次 401 自动重定向的时间戳，防止短时间内重复跳转导致页面抖动 */
let last401RedirectAt = 0
const REDIRECT_COOLDOWN_MS = 2000

/**
 * 后端只读 403 的文案特征（与 api/permission_guard.py 的 detail 保持一致）。
 * 不直接复用 readonly403Bridge 的导出：bridge 依赖 authStore → api/client → interceptor 成环，
 * 故本地保留一份轻量判定，事件常量同理用字面量。
 */
function isReadonly403Detail(detail: unknown): boolean {
  return typeof detail === 'string' && (detail.includes('只读') || detail.includes('无权访问'))
}

export const setupAuthInterceptor = (instance: AxiosInstance): void => {
  // 全站只读模式下的请求层拦截：非 GET/HEAD 请求直接拒绝，不发请求
  // 认证端点（登录/登出/改密等）必须放行，否则只读用户无法登出形成死锁
  instance.interceptors.request.use((config) => {
    const method = (config.method ?? 'get').toLowerCase()
    const isSelfService = config.headers.get(READONLY_SELF_SERVICE_HEADER) === 'true'
    // 保留标识传给后端；后端会结合请求路径和业务归属再次校验本人写入。
    if (isGlobalReadonly() && method !== 'get' && method !== 'head' && !config.url?.includes('/v1/auth/') && !isSelfService) {
      return Promise.reject(new Error('当前为只读浏览模式，无法执行修改操作'))
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // 已在登录页则不再跳转，避免死循环
        if (isOnLoginPage()) return Promise.reject(error)
        // 冷却期内不重复跳转，防止多个 401 响应接连触发导致页面闪烁
        const now = Date.now()
        if (now - last401RedirectAt < REDIRECT_COOLDOWN_MS) return Promise.reject(error)
        last401RedirectAt = now
        // 根据上下文选择正确的登录页：企微应用 → wecom/login，主应用 → /login
        window.location.hash = isWecomContext() ? '#/wecom/login' : '#/login'
      }
      // R7：后端只读 403 → 通知 readonly403Bridge 统一告警 + 刷新权限（收敛会话内权限漂移）
      if (error.response?.status === 403 && isReadonly403Detail(error.response?.data?.detail)) {
        window.dispatchEvent(new CustomEvent('wp:readonly-403'))
      }
      return Promise.reject(error)
    }
  )
}
