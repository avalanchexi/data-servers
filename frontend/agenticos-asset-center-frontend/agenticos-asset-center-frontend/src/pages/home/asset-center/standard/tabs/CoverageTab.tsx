/**
 * 数据标准 — 贯标统计页签
 * cron 扫描 DCG fingerprint → 落标率 = 已落标字段 / 总字段 → 已落标/未落标清单（认证核心证据）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { AssetStandardApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination } from '../../../../../components/ui'

interface CoverageStats {
  total_fields?: number
  mapped_fields?: number
  coverage_rate?: number
  unmapped_fields?: number
  stats_at?: string
}

interface UnmappedRow {
  id: string
  name: string
  entity_type?: string
  datasource_name?: string
  table_name?: string
}

const PAGE_SIZE = 10

export default function CoverageTab() {
  const [stats, setStats] = useState<CoverageStats | null>(null)
  const [rows, setRows] = useState<UnmappedRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      setStats(await AssetStandardApi.coverageStats() as unknown as CoverageStats)
      const data = await AssetStandardApi.unmappedList({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as UnmappedRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载贯标统计失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const rate = stats?.coverage_rate ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          落标率 = 已落标字段 / 总字段（cron 定时扫描 DCG fingerprint，认证核心证据）
        </p>
        <Button variant="ghost" onClick={() => load(page)}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !stats && (
        <EmptyState
          icon="folder"
          title="暂无贯标统计数据"
          description="执行元数据采集与落标映射后，cron 定时任务扫描生成落标率与未落标清单。"
        />
      )}

      {!loading && stats && (
        <>
          {/* 落标率总览卡 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>总字段数</p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>{stats.total_fields ?? 0}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>已落标字段</p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-success)' }}>{stats.mapped_fields ?? 0}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>落标率</p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: rate >= 60 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {(rate * 100).toFixed(1)}%
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full" style={{ backgroundColor: 'var(--color-bg)' }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, rate * 100))}%`, backgroundColor: rate >= 60 ? 'var(--color-success)' : 'var(--color-warning)' }}
                />
              </div>
            </div>
          </div>

          {/* 未落标清单 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              未落标清单（{stats.unmapped_fields ?? total}）
            </h4>
            {!rows.length ? (
              <p className="py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>全部字段已落标</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                      <th className="px-4 py-3 font-medium">字段</th>
                      <th className="px-4 py-3 font-medium">所属表</th>
                      <th className="px-4 py-3 font-medium">数据源</th>
                      <th className="px-4 py-3 font-medium">类型</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.table_name ?? '-'}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.datasource_name ?? '-'}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{row.entity_type ?? '-'}</td>
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
        </>
      )}
    </div>
  )
}
