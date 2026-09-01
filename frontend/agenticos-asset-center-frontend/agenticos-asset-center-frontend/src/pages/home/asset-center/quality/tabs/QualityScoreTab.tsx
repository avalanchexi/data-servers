/**
 * 数据质量 — 质量评分页签
 * 数据集级六维加权评分（预聚合落 asset_dq_score，区别于模型级评分，分层并存）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { AssetQualityApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination } from '../../../../../components/ui'
import { ScoreTrendChart } from '../../../../../components/asset'

interface ScoreRow {
  id: string
  dataset_id: string
  dataset_name?: string
  total_score?: number
  completeness?: number
  uniqueness?: number
  validity?: number
  consistency?: number
  accuracy?: number
  timeliness?: number
  scored_at?: string
}

const PAGE_SIZE = 10
const DIMENSIONS = [
  { key: 'completeness', label: '完整性', weight: 0.2 },
  { key: 'uniqueness', label: '唯一性', weight: 0.2 },
  { key: 'validity', label: '有效性', weight: 0.15 },
  { key: 'consistency', label: '一致性', weight: 0.15 },
  { key: 'accuracy', label: '准确性', weight: 0.2 },
  { key: 'timeliness', label: '及时性', weight: 0.1 },
]

export default function QualityScoreTab() {
  const [rows, setRows] = useState<ScoreRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetQualityApi.listScores({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as ScoreRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载质量评分失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const first = rows[0]
  const trendPoints = rows.slice(0, 7).map((row) => ({
    label: row.scored_at ? new Date(row.scored_at).toLocaleDateString() : '-',
    values: DIMENSIONS.map((d) => Number(row[d.key as keyof ScoreRow] ?? 0)),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          数据集级六维加权评分：完整性 20% + 唯一性 20% + 有效性 15% + 一致性 15% + 准确性 20% + 及时性 10%（GB/T 36344-2018）
        </p>
        <Button variant="ghost" onClick={() => load(page)}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !!trendPoints.length && (
        <ScoreTrendChart dimensions={DIMENSIONS.map((d) => d.label)} points={trendPoints} />
      )}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无质量评分"
          description="监控任务执行后按六维加权计算数据集评分，预聚合落 asset_dq_score 支撑健康分体系。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">数据集</th>
                <th className="px-4 py-3 text-right font-medium">总分</th>
                {DIMENSIONS.map((d) => (
                  <th key={d.key} className="px-4 py-3 text-right font-medium">{d.label}</th>
                ))}
                <th className="px-4 py-3 text-right font-medium">评分时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.dataset_name ?? row.dataset_id}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: (row.total_score ?? 0) >= 80 ? 'var(--color-success-bg)' : (row.total_score ?? 0) >= 60 ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
                        color: (row.total_score ?? 0) >= 80 ? 'var(--color-success)' : (row.total_score ?? 0) >= 60 ? 'var(--color-warning)' : 'var(--color-error)',
                      }}
                    >
                      {row.total_score ?? '-'}
                    </span>
                  </td>
                  {DIMENSIONS.map((d) => (
                    <td key={d.key} className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {row[d.key as keyof ScoreRow] != null ? row[d.key as keyof ScoreRow] : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.scored_at ? new Date(row.scored_at).toLocaleString() : '-'}
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

      {!loading && first && (
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          说明：本页为数据集级评分（asset_dq_score），与语义模型级评分（quality_foundation）分层并存，分别服务资产治理与模型评测场景。
        </p>
      )}
    </div>
  )
}
