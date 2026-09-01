/**
 * 数据服务 — 调用统计页签
 * audit + 事件表：调用量/成功率/趋势（call-stats + call-trend 端点）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, BarChart3 } from 'lucide-react'
import { AssetServiceApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination, Select } from '../../../../../components/ui'
import { ScoreTrendChart } from '../../../../../components/asset'

interface CallStatRow {
  id: string
  service_id?: string
  service_name?: string
  call_count?: number
  success_count?: number
  success_rate?: number
  stat_date?: string
}

const PAGE_SIZE = 15

export default function CallStatsTab() {
  const [rows, setRows] = useState<CallStatRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [serviceId, setServiceId] = useState('')
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([])
  const [trend, setTrend] = useState<Array<{ label: string; values: number[] }> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadServices = useCallback(async () => {
    try {
      const data = await AssetServiceApi.listServices({ limit: 100, offset: 0 })
      setServices(((data.items ?? []) as unknown as Array<{ id: string; name: string }>))
    } catch { /* 服务列表加载失败不阻塞 */ }
  }, [])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetServiceApi.listCallStats({
        service_id: serviceId || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as CallStatRow[])
      setTotal(data.total ?? 0)
      setPage(p)
      if (serviceId) {
        const trendData = (await AssetServiceApi.callTrend(serviceId)) as { points?: Array<{ label: string; values: number[] }> }
        setTrend(trendData.points ?? null)
      } else {
        setTrend(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载调用统计失败')
    } finally {
      setLoading(false)
    }
  }, [serviceId])

  useEffect(() => { loadServices() }, [loadServices])
  useEffect(() => { load(1) }, [load])

  const totalCalls = rows.reduce((sum, r) => sum + (r.call_count ?? 0), 0)
  const totalSuccess = rows.reduce((sum, r) => sum + (r.success_count ?? 0), 0)
  const overallRate = totalCalls ? ((totalSuccess / totalCalls) * 100).toFixed(1) : '-'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={serviceId} onValueChange={(v) => setServiceId(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部服务</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" onClick={() => load(page)}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {/* 汇总卡 */}
      {!loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>本页调用总量</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>{totalCalls}</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>本页成功调用</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-success)' }}>{totalSuccess}</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>成功率</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-primary)' }}>{overallRate}{overallRate !== '-' ? '%' : ''}</p>
          </div>
        </div>
      )}

      {/* 趋势图 */}
      {!loading && trend && trend.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            <BarChart3 size={15} style={{ color: 'var(--color-primary)' }} /> 调用量/成功率趋势
          </p>
          <ScoreTrendChart dimensions={['调用量', '成功率']} points={trend} height={220} />
        </div>
      )}

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="database"
          title="暂无调用统计"
          description="调用统计基于 audit + 事件表，调用量/成功率/趋势定时 rollup。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">统计日期</th>
                <th className="px-4 py-3 font-medium">服务</th>
                <th className="px-4 py-3 font-medium">调用量</th>
                <th className="px-4 py-3 font-medium">成功量</th>
                <th className="px-4 py-3 font-medium">成功率</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.stat_date ? new Date(row.stat_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.service_name ?? row.service_id ?? '-'}</td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--color-text)' }}>{row.call_count ?? 0}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-success)' }}>{row.success_count ?? 0}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-primary)' }}>
                    {row.success_rate != null ? `${(row.success_rate * 100).toFixed(1)}%` : '-'}
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
