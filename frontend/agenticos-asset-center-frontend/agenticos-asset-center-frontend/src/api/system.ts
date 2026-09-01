import { createHttp } from './http'

// 使用不带认证拦截器的 HTTP 客户端（避免在未登录时触发重定向）
const http = createHttp({ baseURL: '/api/v1/system/profile', withAuthInterceptor: false })

let cachedTitle: string | null = null

export interface SystemProfile {
  title: string
}

/** 获取系统名称（仅首次调用发请求，后续返回缓存值）。 */
export async function getSystemTitle(): Promise<string> {
  if (cachedTitle) return cachedTitle
  try {
    const res = await http.get<SystemProfile>('')
    cachedTitle = res.data.title
    return cachedTitle
  } catch {
    // 请求失败时使用默认值，避免阻塞页面渲染
    return 'Data Agentic OS'
  }
}

/** 重置缓存（测试用）。 */
export function resetSystemTitleCache(): void {
  cachedTitle = null
}
