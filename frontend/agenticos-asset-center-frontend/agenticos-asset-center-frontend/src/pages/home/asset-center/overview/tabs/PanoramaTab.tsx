/**
 * 资产总览 — 全景大屏页签
 * 存储量/表数/数据源数/资产数 + 全局/流动/结构化三视图
 */
import { useCallback, useEffect, useState } from 'react'
import { Database, Table2, Boxes, HardDrive, Loader2 } from 'lucide-react'
import { AssetOverviewApi } from '../../../../../api/asset'
import { EmptyState } from '../../../../../components/ui'

interface PanoramaData {
  storage_bytes?: number
  table_count?: number
  datasource_count?: number
  asset_count?: number
  views?: Record<string, { label: string; count: number }>
  computed_at?: string
  [key: string]: unknown
}

export default function PanoramaTab() {
  const [data, setData] = useState<PanoramaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = (await AssetOverviewApi.panorama()) as Record<string, unknown>
      // 后端 /panorama 字段：total_assets/total_tables/total_datasources +
      // global_view.status_distribution / flow_view.total_views / structured_view.type_distribution，
      // 前端统一映射为本地结构
      const flowView = (raw.flow_view ?? {}) as Record<string, unknown>
      const statusDist = (raw.global_view as Record<string, unknown> | undefined)?.status_distribution as
        | Record<string, number>
        | undefined
      const typeDist = (raw.structured_view as Record<string, unknown> | undefined)?.type_distribution as
        | Record<string, number>
        | undefined
      const views = {
        global: {
          label: '全局资产',
          count: Object.values(statusDist ?? {}).reduce((a, b) => a + b, 0),
        },
        flow: { label: '总访问量', count: Number(flowView.total_views ?? 0) },
        structured: {
          label: '结构化对象',
          count: Object.values(typeDist ?? {}).reduce((a, b) => a + b, 0),
        },
      }
      setData({
        storage_bytes: Number(raw.storage_bytes ?? 0),
        table_count: Number(raw.total_tables ?? 0),
        datasource_count: Number(raw.total_datasources ?? 0),
        asset_count: Number(raw.total_assets ?? 0),
        computed_at: typeof raw.computed_at === 'string' ? raw.computed_at : undefined,
        // 三视图计数全为 0（如 mock 空对象/尚未采集）时保持空态，由 UI 显示暂无视图数据
        views: Object.values(views).some((v) => v.count > 0) ? views : {},
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载全景数据失败')
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
  if (!data) {
    return <EmptyState icon="database" title="暂无全景数据" description="请先在数据地图执行元数据采集，再在资产目录完成盘点编目" />
  }

  const cards = [
    { label: '存储量', value: formatBytes(data.storage_bytes ?? 0), icon: HardDrive },
    { label: '数据表数', value: String(data.table_count ?? 0), icon: Table2 },
    { label: '数据源数', value: String(data.datasource_count ?? 0), icon: Database },
    { label: '资产数', value: String(data.asset_count ?? 0), icon: Boxes },
  ]

  return (
    <div className="space-y-4">
      {data.computed_at && (
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          聚合时间：{new Date(data.computed_at).toLocaleString()}（缓存口径，写操作后自动刷新）
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <c.icon size={14} style={{ color: 'var(--color-primary)' }} /> {c.label}
            </div>
            <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>{c.value}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>三视图</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {(Object.entries(data.views ?? {})).map(([key, v]) => (
          <div key={key} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{v.label}</p>
            <p className="mt-1 text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>{v.count}</p>
          </div>
        ))}
        {!Object.keys(data.views ?? {}).length && (
          <p className="col-span-3 py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无视图数据</p>
        )}
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(2)} TB`
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`
  return `${bytes} B`
}
