/**
 * 数据质量 — 校验记录页签
 * 校验明细/趋势/告警（复用 ScoreTrendChart 趋势图）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { AssetQualityApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination, Select } from '../../../../../components/ui'
import { ScoreTrendChart } from '../../../../../components/asset'
import { useInfiniteScroll } from '../../useInfiniteScroll'

interface CheckRow {
  id: string
  rule_id: string
  rule_name?: string
  check_time?: string
  checked_at?: string
  status: string
  score?: number
  sla_met?: boolean | null
  recheck_status?: string
  violated_count?: number
  total_count?: number
  alert_sent?: boolean
  detail?: string
}

const PAGE_SIZE = 10
const STATUS_LABELS: Record<string, string> = {
  pass: '通过',
  fail: '未通过',
  error: '执行异常',
}

export default function CheckResultTab() {
  const [rows, setRows] = useState<CheckRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [rechecking, setRechecking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetQualityApi.listCheckResults({
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      const items = (data.items ?? []) as unknown as CheckRow[]
      // 增量加载：追加下一页
      setRows((prev) => (append ? [...prev, ...items] : items))
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载校验记录失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  // 滚动到底自动加载下一页（IntersectionObserver，零新依赖）
  const hasMore = rows.length < total
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    load(page + 1, true)
  }, [loading, hasMore, page, load])
  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading)

  // 复验：对 fail 记录重跑规则（写交互，deny-by-default 由权限守卫拦截）
  const recheck = async (row: CheckRow) => {
    setRechecking(row.id)
    setError(null)
    try {
      await AssetQualityApi.recheckCheckResult(row.id)
      await load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '复验失败')
    } finally {
      setRechecking(null)
    }
  }

  // 近 7 次结果趋势（倒序取最近通过率）
  const trendData = rows
    .slice()
    .reverse()
    .map((row) => ({
      label: row.check_time ? new Date(row.check_time).toLocaleDateString() : '-',
      value: row.total_count ? Math.round(((row.total_count - (row.violated_count ?? 0)) / row.total_count) * 100) : 0,
    }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部结果</option>
            <option value="pass">通过</option>
            <option value="fail">未通过</option>
            <option value="error">执行异常</option>
          </Select>
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !!trendData.length && (
        <ScoreTrendChart
          dimensions={['通过率']}
          points={trendData.map((d) => ({ label: d.label, values: [d.value] }))}
        />
      )}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无校验记录"
          description="监控任务执行后在此展示校验明细；未通过时自动告警并进入问题工单流转。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">规则</th>
                <th className="px-4 py-3 font-medium">校验时间</th>
                <th className="px-4 py-3 font-medium">结果</th>
                <th className="px-4 py-3 text-right font-medium">违规/总量</th>
                <th className="px-4 py-3 font-medium">SLA</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.rule_name ?? row.rule_id}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.check_time ? new Date(row.check_time).toLocaleString() : row.checked_at ? new Date(row.checked_at).toLocaleString() : '-'}
                    {row.recheck_status === 'recheck' && (
                      <span className="ml-1 rounded px-1 py-0.5" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>复验</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'pass' ? 'var(--color-success-bg)' : row.status === 'fail' ? 'var(--color-error-bg)' : 'var(--color-card-elevated)',
                        color: row.status === 'pass' ? 'var(--color-success)' : row.status === 'fail' ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.violated_count ?? '-'} / {row.total_count ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.status === 'pass' && row.sla_met != null ? (row.sla_met ? '达标' : '超时') : row.alert_sent ? '已推送' : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === 'fail' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={rechecking === row.id}
                        onClick={() => recheck(row)}
                      >
                        <RefreshCw size={13} className="mr-1" /> 复验
                      </Button>
                    )}
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
