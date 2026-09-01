import { useEffect, useState } from 'react'

/**
 * 值防抖：输入停止 delay 毫秒后返回最新值。
 * 用于搜索框等场景，避免每次击键都触发请求。
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}
