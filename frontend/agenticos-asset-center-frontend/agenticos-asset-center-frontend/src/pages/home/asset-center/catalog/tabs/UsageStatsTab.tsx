/**
 * 资产目录 — 使用统计页签
 * 事件流水 + 定时 rollup（按资产聚合浏览量/调用量）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { AssetCatalogApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination } from '../../../../../components/ui'

interface UsageRow {
  id: string
  asset_id: string
  asset_name?: string
  view_count?: number
  call_count?: number
  stat_date?: string
  created_at?: string
}

const PAGE_SIZE = 10

export default function UsageStatsTab() {
  const [rows, setRows] = useState<UsageRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetCatalogApi.listUsageStats({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as UsageRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载使用统计失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const totalViews = rows.reduce((sum, row) => sum + (row.view_count ?? 0), 0)
  const totalCalls = rows.reduce((sum, row) => sum + (row.call_count ?? 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <span>本页浏览合计：<b style={{ color: 'var(--color-text)' }}>{totalViews}</b></span>
          <span>调用合计：<b style={{ color: 'var(--color-text)' }}>{totalCalls}</b></span>
          <span>事件流水由定时 rollup 预聚合入 asset_usage_stat</span>
        </div>
        <Button variant="ghost" onClick={() => load(page)}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无使用统计"
          description="用户浏览/调用资产后，事件流水按日 rollup 生成使用统计，支撑热度排行与估值热度系数。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">资产</th>
                <th className="px-4 py-3 text-right font-medium">浏览量</th>
                <th className="px-4 py-3 text-right font-medium">调用量</th>
                <th className="px-4 py-3 font-medium">统计日期</th>
                <th className="px-4 py-3 text-right font-medium">记录时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.asset_name ?? row.asset_id}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-primary)' }}>{row.view_count ?? 0}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.call_count ?? 0}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.stat_date ?? '-'}</td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
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
    </div>
  )
}
