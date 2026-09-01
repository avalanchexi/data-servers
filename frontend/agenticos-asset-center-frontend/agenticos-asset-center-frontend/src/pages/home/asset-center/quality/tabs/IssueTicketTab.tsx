/**
 * 数据质量 — 问题工单页签
 * 发现→告警→工单→修复→复验闭环（复用 sys_risk_cases 工单流转）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { AssetQualityApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination, Select } from '../../../../../components/ui'
import { ApprovalFlowSteps } from '../../../../../components/asset'

interface TicketRow {
  id: string
  title: string
  status: string
  priority?: string
  assignee_name?: string
  created_at?: string
  risk_case_id?: string
}

const PAGE_SIZE = 10
const STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  processing: '修复中',
  fixed: '已修复',
  verified: '已复验',
  closed: '已关闭',
}
const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
}

export default function IssueTicketTab() {
  const [rows, setRows] = useState<TicketRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      // 质量工单复用 sys_risk_cases 流转：读取校验失败记录关联的风险案例
      const data = await AssetQualityApi.listCheckResults({
        status: 'fail',
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      const items = ((data.items ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({
        id: String(r.id ?? ''),
        title: `质量校验未通过：${String(r.rule_name ?? r.rule_id ?? '')}`,
        status: String(r.status ?? 'open'),
        created_at: r.check_time as string | undefined,
      }))
      setRows(items as unknown as TicketRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载问题工单失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          发现→告警→工单→修复→复验闭环；工单复用 sys_risk_cases 流转通道（AI 根因分析见治理 Agent）
        </p>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !filtered.length && (
        <EmptyState
          icon="folder"
          title="暂无问题工单"
          description="校验未通过时自动创建工单（复用 sys_risk_cases），修复后复验关闭。"
        />
      )}

      {!!filtered.length && (
        <div className="space-y-2">
          {filtered.map((row) => (
            <div key={row.id} className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <div className="flex items-center gap-3">
                <span className="flex-1 truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>{row.title}</span>
                {row.priority && (
                  <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-secondary)' }}>
                    {PRIORITY_LABELS[row.priority] ?? row.priority}
                  </span>
                )}
                <span
                  className="rounded px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: row.status === 'verified' || row.status === 'closed' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                    color: row.status === 'verified' || row.status === 'closed' ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                >
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
                <span className="w-40 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                </span>
              </div>
              <div className="mt-3">
                <ApprovalFlowSteps steps={[
                  { label: '发现', state: 'done' },
                  { label: '告警', state: 'done' },
                  { label: '工单', state: row.status === 'open' ? 'active' : 'done' },
                  { label: '修复', state: row.status === 'processing' ? 'active' : row.status === 'fixed' || row.status === 'verified' || row.status === 'closed' ? 'done' : 'pending' },
                  { label: '复验', state: row.status === 'verified' || row.status === 'closed' ? 'done' : 'pending' },
                ]} />
              </div>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}
    </div>
  )
}
