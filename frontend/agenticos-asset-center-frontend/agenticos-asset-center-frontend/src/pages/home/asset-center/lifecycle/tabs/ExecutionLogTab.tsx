/**
 * 数据生命周期 — 执行记录页签
 * 全量留痕（分层/归档/退役执行），认证可追溯证据（evidence-records 端点）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, History } from 'lucide-react'
import { AssetLifecycleApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination, Select } from '../../../../../components/ui'

interface ExecutionRow {
  id: string
  policy_id?: string
  asset_id?: string
  asset_name?: string
  execution_type?: string
  status: string
  detail?: Record<string, unknown>
  approve_info?: Record<string, unknown>
  error?: string
  started_at?: string
  finished_at?: string
}

const PAGE_SIZE = 15
const TYPE_LABELS: Record<string, string> = {
  tier_move: '分层迁移',
  archive: '归档',
  retire: '退役',
}
const STATUS_LABELS: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  running: '执行中',
  success: '已完成',
  failed: '失败',
}

export default function ExecutionLogTab() {
  const [rows, setRows] = useState<ExecutionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetLifecycleApi.listExecutions({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      const all = (data.items ?? []) as unknown as ExecutionRow[]
      const filtered = typeFilter ? all.filter((r) => r.execution_type === typeFilter) : all
      setRows(filtered)
      setTotal(Math.max(filtered.length, data.total ?? 0))
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载执行记录失败')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { load(1) }, [load])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部类型</option>
            <option value="tier_move">分层迁移</option>
            <option value="archive">归档</option>
            <option value="retire">退役</option>
          </Select>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <History size={13} className="mr-1 inline" /> 全量留痕（evidence-records 认证证据）
          </span>
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
          title="暂无执行记录"
          description="分层迁移/归档/退役执行全量留痕，供 DCMM 认证可追溯举证。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">资产</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">审批信息</th>
                <th className="px-4 py-3 font-medium">开始时间</th>
                <th className="px-4 py-3 font-medium">完成时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {TYPE_LABELS[row.execution_type ?? ''] ?? row.execution_type ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.asset_name ?? row.asset_id ?? row.policy_id ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'success' ? 'var(--color-success-bg)' : row.status === 'rejected' || row.status === 'failed' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                        color: row.status === 'success' ? 'var(--color-success)' : row.status === 'rejected' || row.status === 'failed' ? 'var(--color-error)' : 'var(--color-warning)',
                      }}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.approve_info ? JSON.stringify(row.approve_info) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.started_at ? new Date(row.started_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.finished_at ? new Date(row.finished_at).toLocaleString() : '-'}
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
