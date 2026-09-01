/** 角色列表前端缓存模块。
 *
 * 缓存策略：
 * - 首次调用 listRoles() 时从 API 获取并缓存
 * - 后续调用直接返回缓存数据
 * - 调用 invalidateRoleCache() 可强制刷新
 *
 * 使用方式：
 *     import { getCachedRoles, invalidateRoleCache } from '../../../api/roleCache'
 *
 *     const roles = await getCachedRoles()
 *     // 角色管理页面操作后
 *     invalidateRoleCache()
 */

import { listRoles, RoleResponse } from './role'

let cachedRoles: RoleResponse[] | null = null
let fetchPromise: Promise<RoleResponse[]> | null = null

/** 获取角色列表（优先从缓存获取，缓存未命中则从 API 拉取）。 */
export async function getCachedRoles(): Promise<RoleResponse[]> {
  if (cachedRoles) {
    return cachedRoles
  }

  // 防止并发重复请求
  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = listRoles()
    .then((roles) => {
      cachedRoles = roles
      fetchPromise = null
      return roles
    })
    .catch((err) => {
      fetchPromise = null
      throw err
    })

  return fetchPromise
}

/** 清空缓存，下次调用 getCachedRoles() 将重新从 API 获取。 */
export function invalidateRoleCache(): void {
  cachedRoles = null
  fetchPromise = null
}
