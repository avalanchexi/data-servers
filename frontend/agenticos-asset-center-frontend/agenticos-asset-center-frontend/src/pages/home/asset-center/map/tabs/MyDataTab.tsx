/**
 * 数据地图 — 我的数据页签
 * 热门排行 / 最近浏览（收藏动作由后端记录，浏览通过 recordUsage 上报）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Flame, History, RefreshCw } from 'lucide-react'
import { AssetMapApi } from '../../../../../api/asset'
import { Button, EmptyState, Select } from '../../../../../components/ui'
import { ClassificationBadge } from '../../../../../components/asset'

interface HotItem {
  id: string
  entity_type: string
  entity_id: string
  name_zh: string
  domain?: string
  owner_name?: string
  classification_level?: string
  hot?: number
  quality_score?: number
}

export default function MyDataTab() {
  const [entityType, setEntityType] = useState('')
  const [items, setItems] = useState<HotItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetMapApi.hotRanking({
        entity_type: entityType || undefined,
        limit: 20,
      })
      const list = (data as { items?: HotItem[] }).items ?? []
      setItems(list as unknown as HotItem[])
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载热门排行失败')
    } finally {
      setLoading(false)
    }
  }, [entityType])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Select value={entityType} onValueChange={(v) => setEntityType(Array.isArray(v) ? String(v[0]) : String(v))} ro>
          <option value="">全部类型</option>
          <option value="table">数据表</option>
          <option value="column">字段</option>
          <option value="metric">指标</option>
          <option value="asset">资产</option>
          <option value="service">数据服务</option>
        </Select>
        <Button variant="ghost" onClick={load}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !items.length && (
        <EmptyState
          icon="folder"
          title="暂无热门数据"
          description="热门排行基于使用统计（asset_usage_stat）定时 rollup 生成；浏览数据资产后热度将在此展示。"
        />
      )}

      {!!items.length && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item, idx) => (
            <div
              key={item.id ?? `${item.entity_type}-${item.entity_id}`}
              className="rounded-xl border px-4 py-3 transition-opacity hover:opacity-85"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: idx < 3 ? 'var(--color-warning-bg)' : 'var(--color-card-elevated)' }}>
                  {idx < 3 ? (
                    <Flame size={13} style={{ color: 'var(--color-warning)' }} />
                  ) : (
                    <History size={13} style={{ color: 'var(--color-text-tertiary)' }} />
                  )}
                </span>
                <span className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.name_zh}</span>
                <ClassificationBadge level={item.classification_level} short />
                <span className="ml-auto text-xs" style={{ color: 'var(--color-text-tertiary)' }}>热度 {item.hot ?? 0}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                <span>{item.domain ?? '-'}</span>
                <span>负责人：{item.owner_name ?? '-'}</span>
                {item.quality_score != null && <span>质量分 {item.quality_score}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
