import { useMemo } from 'react'
import { useAuthStore } from '../store/authStore'

/**
 * 检查用户对指定菜单是否拥有写权限（read/write 两档操作级权限）。
 *
 * 依据：authStore.readonlyMenus（多角色权限最大化合并后仍为只读的菜单）。
 * 仅用于按钮可用/禁用等 UI 体验层；真正的安全拦截由后端守卫与 API 层拦截器负责。
 *
 * @param menuId - 菜单 ID，如 "knowledge-kb"、"config-permission"
 * @returns true 表示可执行写操作（编辑/删除等）
 *
 * @example
 * const canWrite = useCanWrite('config-permission')
 * <Button disabled={!canWrite} onClick={onSave}>保存</Button>
 */
export function useCanWrite(menuId: string): boolean {
  const readonlyMenus = useAuthStore((state) => state.readonlyMenus)
  return useMemo(() => canWrite(readonlyMenus, menuId), [readonlyMenus, menuId])
}

/**
 * 纯函数版本：根据只读菜单列表判断指定菜单是否可写。
 * 适用于非 React 组件场景或需要传入自定义只读列表的场景。
 *
 * 语义：只读列表为空 → 全部可写；菜单不在只读列表 → 可写。
 */
export function canWrite(
  readonlyMenus: string[] | null | undefined,
  menuId: string,
): boolean {
  if (!readonlyMenus || readonlyMenus.length === 0) return true
  return !readonlyMenus.includes(menuId)
}
