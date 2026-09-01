/**
 * 资产目录 — 价值评估页签
 * 成本法/收益法/市场法可配置：价值 = 成本基线 × 质量系数 × 标准系数 × 热度系数
 * 会计入表流程：待确认 → 会计确认 → 入表 → 出表（确认留痕可举证）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { AssetCatalogApi } from '../../../../../api/asset'
import ApprovalFlowSteps, { type ApprovalStep } from '../../../../../components/asset/ApprovalFlowSteps'
import { Button, EmptyState, Pagination } from '../../../../../components/ui'

interface ValuationRow {
  id: string
  asset_id: string
  asset_name: string
  method: string
  cost_baseline?: number
  quality_factor?: number
  standard_factor?: number
  hot_factor?: number
  value?: number
  evaluated_at?: string
  accounting_status?: string
  confirm_info?: Array<{ action?: string; operator?: string; at?: string; comment?: string }>
}

const PAGE_SIZE = 10
const METHOD_LABELS: Record<string, string> = {
  cost: '成本法',
  income: '收益法',
  market: '市场法',
}

/** 入表状态 → 徽标文案/颜色/浅底色/下一步动作 */
const ACCOUNTING_META: Record<string, { label: string; color: string; bg: string; next?: { action: string; text: string } }> = {
  pending: { label: '待确认', color: 'var(--color-warning, #d97706)', bg: 'rgba(217, 119, 6, 0.12)', next: { action: 'confirm', text: '会计确认' } },
  confirmed: { label: '已确认', color: 'var(--color-primary)', bg: 'var(--color-primary-light)', next: { action: 'book', text: '入表' } },
  on_book: { label: '已入表', color: 'var(--color-success, #10b981)', bg: 'rgba(16, 185, 129, 0.12)', next: { action: 'off_book', text: '出表' } },
  off_book: { label: '已出表', color: 'var(--color-text-tertiary)', bg: 'rgba(148, 163, 184, 0.12)' },
}

/** 按入表状态推导四步流程条（估值→会计确认→入表→出表） */
function buildSteps(status: string | undefined, note?: string): ApprovalStep[] {
  const rank = { pending: 0, confirmed: 1, on_book: 2, off_book: 3 }[status ?? 'pending'] ?? 0
  const stateAt = (idx: number): ApprovalStep['state'] => {
    if (idx < rank) return 'done'
    if (idx === rank) return 'active'
    return 'pending'
  }
  return [
    { label: '估值', state: stateAt(0) },
    { label: '会计确认', state: stateAt(1), note: rank === 1 ? note : undefined },
    { label: '入表', state: stateAt(2), note: rank === 2 ? note : undefined },
    { label: '出表', state: stateAt(3), note: rank === 3 ? note : undefined },
  ]
}

export default function ValuationTab() {
  const [rows, setRows] = useState<ValuationRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetCatalogApi.listValuations({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as ValuationRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载估值记录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const act = useCallback(async (row: ValuationRow) => {
    const meta = ACCOUNTING_META[row.accounting_status ?? 'pending']
    if (!meta.next) return
    setActing(row.id)
    setError(null)
    try {
      await AssetCatalogApi.confirmValuationAccounting(row.id, { action: meta.next.action })
      await load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '会计流转失败')
    } finally {
      setActing(null)
    }
  }, [load, page])

  const lastNote = (row: ValuationRow) => {
    const last = row.confirm_info?.[row.confirm_info.length - 1]
    if (!last) return undefined
    return `${last.operator ?? '-'} ${last.at ? new Date(last.at).toLocaleString() : ''}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          估值公式：<span className="font-mono">价值 = 成本基线 × 质量系数 × 标准系数 × 热度系数</span>（系数取自质量评分/落标率/热度归一化）
        </p>
        <Button variant="ghost" onClick={() => load(page)} ro>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无估值记录"
          description="资产上架后按成本法/收益法/市场法自动估值，估值结果经会计确认后入表（资产运营定价基础）。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">资产</th>
                <th className="px-4 py-3 font-medium">评估方法</th>
                <th className="px-4 py-3 text-right font-medium">成本基线</th>
                <th className="px-4 py-3 text-right font-medium">质量系数</th>
                <th className="px-4 py-3 text-right font-medium">标准系数</th>
                <th className="px-4 py-3 text-right font-medium">热度系数</th>
                <th className="px-4 py-3 text-right font-medium">评估价值</th>
                <th className="px-4 py-3 text-right font-medium">评估时间</th>
                <th className="px-4 py-3 font-medium">入表状态</th>
                <th className="px-4 py-3 text-center font-medium" style={{ minWidth: 260 }}>入表流程</th>
                <th className="px-4 py-3 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = ACCOUNTING_META[row.accounting_status ?? 'pending']
                return (
                  <tr key={row.id} className="border-b last:border-b-0 align-top" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.asset_name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{METHOD_LABELS[row.method] ?? row.method}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.cost_baseline ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.quality_factor ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.standard_factor ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.hot_factor ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-primary)' }}>{row.value ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {row.evaluated_at ? new Date(row.evaluated_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ApprovalFlowSteps steps={buildSteps(row.accounting_status, lastNote(row))} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {meta.next ? (
                        <Button size="sm" loading={acting === row.id} onClick={() => act(row)}>
                          {meta.next.text}
                        </Button>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>已闭环</span>
                      )}
                    </td>
                  </tr>
                )
              })}
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
