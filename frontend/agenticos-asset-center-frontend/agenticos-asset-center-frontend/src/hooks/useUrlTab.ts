import { useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * URL 同步的 Tab 状态 Hook
 *
 * 将 tab 状态同步到 URL search params（?tab=xxx），
 * 支持浏览器前进/后退、URL 分享、刷新保持状态。
 *
 * @param defaultTab - 默认 tab 值
 * @param paramName - URL 参数名，默认 'tab'
 * @returns [activeTab, setActiveTab] - 与 useState 用法一致
 */
export function useUrlTab<T extends string>(
  defaultTab: T,
  paramName: string = 'tab'
): [T, (tab: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  // 从 URL 读取初始值
  const urlTab = searchParams.get(paramName) as T | null
  const initialTab = urlTab && urlTab !== '' ? urlTab : defaultTab

  const [activeTab, setActiveTabState] = useState<T>(initialTab)

  // 当 URL 变化时（浏览器前进/后退）同步状态
  useEffect(() => {
    const urlValue = searchParams.get(paramName) as T | null
    if (urlValue && urlValue !== '' && urlValue !== activeTab) {
      setActiveTabState(urlValue)
    }
  }, [searchParams, paramName])

  // 更新 tab 时同步到 URL（保留其他 query 参数，如数据集筛选条件）
  const setActiveTab = useCallback(
    (tab: T) => {
      setActiveTabState(tab)
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.set(paramName, tab)
        return next
      }, { replace: true })
    },
    [setSearchParams, paramName]
  )

  return [activeTab, setActiveTab]
}
