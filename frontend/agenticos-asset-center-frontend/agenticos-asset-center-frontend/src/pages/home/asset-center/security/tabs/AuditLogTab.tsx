/**
 * 数据安全 — 审计日志页签
 * 三类事件：分类分级变更 / 脱敏操作 / 敏感数据访问（复用 audit_controller 通道）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { AssetSecurityApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination, Select } from '../../../../../components/ui'
import { useInfiniteScroll } from '../../useInfiniteScroll'

interface AuditRow {
  id: string
  event_type: string
  operator?: string
  target?: string
  detail?: Record<string, unknown>
  created_at?: string
}

const PAGE_SIZE = 15
const EVENT_TYPES = ['classification', 'mask', 'sensitive_access'] as const
const EVENT_LABELS: Record<string, string> = {
  classification: '分类分级变更',
  mask: '脱敏操作',
  sensitive_access: '敏感数据访问',
}

export default function AuditLogTab() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [eventType, setEventType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetSecurityApi.listAuditLogs({
        event_type: eventType || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      const items = (data.items ?? []) as unknown as AuditRow[]
      // 增量加载：追加下一页
      setRows((prev) => (append ? [...prev, ...items] : items))
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载审计日志失败')
    } finally {
      setLoading(false)
    }
  }, [eventType])

  useEffect(() => { load(1) }, [load])

  // 滚动到底自动加载下一页（IntersectionObserver，零新依赖）
  const hasMore = rows.length < total
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    load(page + 1, true)
  }, [loading, hasMore, page, load])
  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={eventType} onValueChange={(v) => setEventType(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部事件</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{EVENT_LABELS[t]}</option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" onClick={() => load(page)}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      <p className="text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
        审计事件复用 audit_controller 通道落库，覆盖分类分级变更、脱敏操作、敏感数据访问三类，支持 DCMM 认证可追溯举证。
      </p>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="search"
          title="暂无审计日志"
          description="分类分级变更、脱敏操作、敏感数据访问事件将在此留痕。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">时间</th>
                <th className="px-4 py-3 font-medium">事件类型</th>
                <th className="px-4 py-3 font-medium">操作人</th>
                <th className="px-4 py-3 font-medium">对象</th>
                <th className="px-4 py-3 font-medium">详情</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {EVENT_LABELS[row.event_type] ?? row.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.operator ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.target ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.detail ? JSON.stringify(row.detail) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }} data-ro>
          {loading ? <Loader2 size={14} className="animate-spin" /> : '滚动加载更多…'}
        </div>
      )}
    </div>
  )
}
