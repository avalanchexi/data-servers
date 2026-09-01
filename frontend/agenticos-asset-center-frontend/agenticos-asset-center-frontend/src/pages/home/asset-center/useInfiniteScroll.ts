import { useEffect, useRef } from 'react'

/**
 * IntersectionObserver 增量加载：滚动容器底部 sentinel 进入视口时触发 loadMore。
 * 零新依赖（计划 6.4）；rootMargin 提前 200px 预加载，loadMore 经 ref 转发
 * 避免每次渲染重建 observer。
 */
export function useInfiniteScroll(loadMore: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled])

  return sentinelRef
}
