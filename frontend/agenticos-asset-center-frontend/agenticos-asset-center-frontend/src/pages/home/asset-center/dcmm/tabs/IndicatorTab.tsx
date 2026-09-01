/**
 * 治理评估 — 指标台账页签
 * 九域 486 指标树内置 + 裁剪开关（seedIndicators/trimIndicators/indicatorTree）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Scissors, Sprout } from 'lucide-react'
import { AssetDcmmApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination } from '../../../../../components/ui'

interface IndicatorRow {
  id: string
  code: string
  name: string
  domain: string
  capability?: string
  level?: string
  trimmed?: boolean
}

const PAGE_SIZE = 20
const DOMAIN_LABELS: Record<string, string> = {
  strategy: '数据战略',
  governance: '数据治理',
  architecture: '数据架构',
  application: '数据应用',
  security: '数据安全',
  quality: '数据质量',
  standard: '数据标准',
  lifecycle: '数据生命周期',
  basic: '基础保障',
}

export default function IndicatorTab() {
  const [rows, setRows] = useState<IndicatorRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tree, setTree] = useState<Record<string, unknown> | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetDcmmApi.listIndicators({ limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE })
      setRows((data.items ?? []) as unknown as IndicatorRow[])
      setTotal(data.total ?? 0)
      setPage(p)
      setTree(await AssetDcmmApi.indicatorTree())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载指标台账失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const seed = async () => {
    try {
      await AssetDcmmApi.seedIndicators()
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '内置指标树加载失败')
    }
  }

  const trim = async (row: IndicatorRow) => {
    try {
      await AssetDcmmApi.trimIndicators({ indicator_ids: [row.id], trimmed: true })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '裁剪失败')
    }
  }

  // 指标树节点总数（含子节点），用于「当前 N 项」展示
  const countNodes = (nodes: unknown[]): number =>
    nodes.reduce<number>(
      (acc, n) => acc + 1 + countNodes((n as { children?: unknown[] }).children ?? []),
      0,
    )
  const treeCount = countNodes(((tree as { tree?: unknown[] })?.tree) ?? [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          九域 486 指标树内置（GB/T 36073-2025），支持裁剪聚焦 L4 关键指标群。
          {treeCount ? ` 当前 ${treeCount} 项` : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={seed}>
            <Sprout size={14} className="mr-1" /> 加载内置指标树
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="指标台账为空"
          description="点击「加载内置指标树」导入 DCMM 九域 486 指标（GB/T 36073-2025）。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">指标编码</th>
                <th className="px-4 py-3 font-medium">指标名称</th>
                <th className="px-4 py-3 font-medium">能力域</th>
                <th className="px-4 py-3 font-medium">能力项</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{row.code}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {DOMAIN_LABELS[row.domain] ?? row.domain}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.capability ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.trimmed ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                        color: row.trimmed ? 'var(--color-warning)' : 'var(--color-success)',
                      }}
                    >
                      {row.trimmed ? '已裁剪' : '启用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {!row.trimmed && (
                        <Button size="sm" variant="ghost" onClick={() => trim(row)}>
                          <Scissors size={13} className="mr-1" /> 裁剪
                        </Button>
                      )}
                    </div>
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
