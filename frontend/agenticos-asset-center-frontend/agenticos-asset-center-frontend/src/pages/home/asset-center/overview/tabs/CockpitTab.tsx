/**
 * 资产总览 — 治理驾驶舱页签
 * 健康分体系：存储/质量/安全/标准/成本五健康度，雷达图 + 环比
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { AssetOverviewApi } from '../../../../../api/asset'
import { HealthScoreRadar } from '../../../../../components/asset'

interface HealthScoresData {
  overall?: number
  dimensions?: Array<{ name: string; score: number; change?: number }>
  baseline?: Array<{ name: string; score: number }>
  computed_at?: string
  [key: string]: unknown
}

// 后端 health-scores 的 dimensions 为按维度名索引的 dict（storage/quality/security/standard/cost），
// 前端组件期待数组，这里在数据层归一化（含中文名映射），避免结构不一致导致渲染崩溃。
const DIMENSION_LABELS: Record<string, string> = {
  storage: '存储',
  quality: '质量',
  security: '安全',
  standard: '标准',
  cost: '成本',
  governance: '治理',
}

export default function CockpitTab() {
  const [data, setData] = useState<HealthScoresData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = (await AssetOverviewApi.healthScores()) as HealthScoresData
      const dims = raw.dimensions
      setData({
        ...raw,
        dimensions: Array.isArray(dims)
          ? dims
          : Object.entries((dims ?? {}) as Record<string, unknown>).map(([key, score]) => ({
              name: DIMENSION_LABELS[key] ?? key,
              score: Number(score) || 0,
            })),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载健康分失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
  }
  if (error) {
    return <p className="py-10 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error} <button onClick={load} className="underline" data-ro>重试</button></p>
  }

  const dims = data?.dimensions ?? []
  return (
    <div className="space-y-4">
      {data?.computed_at && (
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          聚合时间：{new Date(data.computed_at).toLocaleString()}（缓存口径，写操作后自动刷新）
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>健康分体系</h3>
          {data?.overall != null && (
            <span className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
              {Number(data.overall).toFixed(1)}
            </span>
          )}
        </div>
        <HealthScoreRadar
          dimensions={dims}
          baseline={(data?.baseline ?? []) as Array<{ name: string; score: number }>}
          height={320}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>五健康度明细</h3>
        {dims.map((d) => (
          <div key={d.name} className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>{d.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{Number(d.score).toFixed(1)}</span>
                {d.change != null && (
                  <span
                    className="flex items-center gap-0.5 text-xs"
                    style={{ color: d.change >= 0 ? 'var(--color-success, #10b981)' : 'var(--color-error)' }}
                  >
                    {d.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(d.change).toFixed(1)}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, d.score))}%`,
                  backgroundColor: d.score >= 80 ? 'var(--color-success, #10b981)' : d.score >= 60 ? 'var(--color-primary)' : 'var(--color-error)',
                }}
              />
            </div>
          </div>
        ))}
        {!dims.length && (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无健康度数据</p>
        )}
      </div>
      </div>
    </div>
  )
}
