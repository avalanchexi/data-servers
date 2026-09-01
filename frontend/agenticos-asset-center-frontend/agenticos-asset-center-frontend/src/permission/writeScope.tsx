import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAuthStore } from '../store/authStore'
import { canWrite } from '../hooks/useCanWrite'

/**
 * 只读作用域容器属性（读写分离的事实源，替代原 documentElement 全局 class）。
 * WriteScopeProvider 渲染 data-wp-scope="readonly|writable" 的作用域容器，
 * 全局拦截器与 CSS 均通过 closest('[data-wp-scope="readonly"]') 限定作用域，
 * 避免全局信号误伤作用域外的导航/布局元素。
 */
export const WRITE_SCOPE_ATTR = 'data-wp-scope'
export const READONLY_SCOPE_SELECTOR = '[data-wp-scope="readonly"]'
/** 只读态下的统一黄色告警文案 */
export const NO_WRITE_PERMISSION_MESSAGE = '当前账号对该功能仅有浏览权限，无编辑权限，如需修改请联系管理员'
/** 只读置灰样式（与全局作用域内置灰保持一致） */
export const READONLY_CLASS = 'opacity-40 cursor-not-allowed !shadow-none'
/** 无 disabled 的输入类组件根容器遮罩：禁用交互并置灰 */
export const READONLY_CONTAINER_CLASS = 'pointer-events-none opacity-40 cursor-not-allowed'

interface WriteScopeValue {
  /** 当前页面是否处于只读态（写操作需被禁用/拦截） */
  readonly: boolean
  /** 当前页面归属的菜单权限 ID，无权限要求时为 null */
  menuId: string | null
}

const WriteScopeContext = createContext<WriteScopeValue>({ readonly: false, menuId: null })

export function useWriteScope(): WriteScopeValue {
  return useContext(WriteScopeContext)
}

/**
 * 判断当前是否应拦截写操作（反转后：作用域只读即拦截，默认 deny）。
 * 组件可通过自身 ro prop 显式豁免（useWriteBlocked() && !ro）。
 */
export function useWriteBlocked(): boolean {
  const { readonly } = useWriteScope()
  return readonly
}

interface WriteScopeProviderProps {
  /** 当前页面需要的菜单权限 ID（null 表示无需权限，永远可写） */
  menuId?: string | null
  /**
   * 仅供后端已按当前用户归属做强校验的本人自助区域使用。
   * 默认关闭，避免改变其他只读页面的行为。
   */
  selfServiceWrite?: boolean
  /**
   * 页面跨多个菜单时的权限 ID 集合（如企微 CRM 统一页覆盖全部 CRM 菜单）。
   * 任一菜单可写即视为可写（any 语义，与入口访问控制一致）；
   * 后端守卫按具体菜单精确 403。
   */
  menuIds?: string[]
  children: ReactNode
}

/**
 * 页面级读写权限作用域（读写分离 L1 层）。
 *
 * 由路由收口点（ContentRouter / WecomHomeLayout / 特殊路由）注入，集中推导只读态后下发：
 * - React 侧：UI 组件经 useWriteBlocked 自降级（置灰 + ro prop 豁免）
 * - DOM 侧：渲染 data-wp-scope="readonly|writable" 作用域容器（display:contents
 *   不产生布局盒子，不破坏 flex/grid 结构），全局拦截器与作用域 CSS 据此生效
 */
export function WriteScopeProvider({ menuId, menuIds, selfServiceWrite = false, children }: WriteScopeProviderProps) {
  const readonlyMenus = useAuthStore((state) => state.readonlyMenus)
  const readonlyAll = useAuthStore((state) => state.readonlyAll)

  const ids = menuIds ?? (menuId ? [menuId] : [])
  const scopeKey = ids.join('|')

  const readonly = useMemo(() => {
    if (selfServiceWrite) return false
    if (readonlyAll) return true
    if (ids.length === 0) return false
    return !ids.some((id) => canWrite(readonlyMenus, id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readonlyAll, readonlyMenus, scopeKey, selfServiceWrite])

  const value = useMemo(
    () => ({ readonly, menuId: menuId ?? null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readonly, scopeKey],
  )

  return (
    <WriteScopeContext.Provider value={value}>
      <div data-wp-scope={readonly ? 'readonly' : 'writable'} className="contents">
        {children}
      </div>
    </WriteScopeContext.Provider>
  )
}
