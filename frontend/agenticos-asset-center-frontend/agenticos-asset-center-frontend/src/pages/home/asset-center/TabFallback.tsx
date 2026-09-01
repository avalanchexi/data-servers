/**
 * 资产中心页签懒加载占位（Suspense fallback）。
 * 与 ContentRouter 的 LoadingFallback 先例一致：旋转加载圈 + 页面背景色。
 */
export default function TabFallback() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full"
        style={{ border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)' }}
      />
    </div>
  )
}
