/**
 * 资产总览 — 治理排行榜页签
 * 按域/按责任人治理得分排行
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Medal } from 'lucide-react'
import { AssetOverviewApi } from '../../../../../api/asset'
import { Select } from '../../../../../components/ui'

interface RankingData {
  rankings?: Array<{ name: string; score: number; domain?: string; rank?: number }>
  [key: string]: unknown
}

export default function RankingTab() {
  const [dimension, setDimension] = useState('domain')
  const [data, setData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = (await AssetOverviewApi.rankings({ dimension, limit: 20 })) as unknown
      // 后端 /rankings 直接返回数组 [{name, published_count|asset_count}]，前端统一归一化
      const rawList = Array.isArray(raw) ? raw : ((raw as RankingData)?.rankings ?? [])
      const list = rawList as Array<Record<string, unknown>>
      setData({
        rankings: list.map((r) => ({
          name: String(r.name ?? '未分类'),
          score: Number(r.score ?? r.published_count ?? r.asset_count ?? 0),
          domain: r.domain ? String(r.domain) : undefined,
        })),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载排行榜失败')
    } finally {
      setLoading(false)
    }
  }, [dimension])

  useEffect(() => { load() }, [load])

  const rows = data?.rankings ?? []
  const medalColors = ['var(--color-warning)', 'var(--color-text-tertiary)', 'var(--color-error)']
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>排行维度</span>
        <Select
          value={dimension}
          onValueChange={(v) => setDimension(Array.isArray(v) ? String(v[0]) : String(v))}
          ro
        >
          <option value="domain">按域排行</option>
          <option value="owner">按责任人排行</option>
        </Select>
      </div>

      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}
      {error && <p className="py-10 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error} <button onClick={load} className="underline" data-ro>重试</button></p>}
      {!loading && !error && !rows.length && (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无排行数据</p>
      )}

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div
            key={`${row.name}-${idx}`}
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
          >
            <span className="flex h-7 w-7 items-center justify-center text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              {idx < 3 ? <Medal size={18} style={{ color: medalColors[idx] }} /> : idx + 1}
            </span>
            <span className="flex-1 truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</span>
            {row.domain && <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{row.domain}</span>}
            <div className="flex w-40 items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: 'var(--color-bg)' }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, row.score))}%`, backgroundColor: 'var(--color-primary)' }}
                />
              </div>
              <span className="w-10 text-right text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {Number(row.score).toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
