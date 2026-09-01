/**
 * 资产中心共享组件 — 资产详情卡片
 * 基础信息/评分/分级/热度徽标聚合展示（资产详情页与数据地图共用）
 */
import ClassificationBadge from './ClassificationBadge'

export interface AssetDetailData {
  name?: string
  code?: string
  entity_type?: string
  domain?: string
  description?: string
  owner_name?: string
  status?: string
  classification_level?: string | null
  quality_score?: number | null
  standard_coverage?: number | null
  valuation?: number | null
  price?: number | null
  hot?: number
  is_public?: boolean
  created_at?: string
}

interface AssetDetailCardProps {
  data: AssetDetailData
  extra?: React.ReactNode
}

/** 状态 → 中文标签 */
const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已上架',
  offline: '已下架',
}

export default function AssetDetailCard({ data, extra }: AssetDetailCardProps) {
  const statusLabel = STATUS_LABELS[data.status || ''] || data.status || '-'
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{data.name || '-'}</h3>
            <ClassificationBadge level={data.classification_level} short />
            <span
              className="rounded px-1.5 py-0.5 text-xs"
              style={{ backgroundColor: 'var(--color-primary-bg, rgba(91,143,249,0.12))', color: 'var(--color-primary)' }}
            >
              {statusLabel}
            </span>
          </div>
          {data.code && (
            <p className="mt-0.5 font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{data.code}</p>
          )}
        </div>
        {extra}
      </div>

      {data.description && (
        <p className="text-sm leading-5" style={{ color: 'var(--color-text-secondary)' }}>{data.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="主题域" value={data.domain || '-'} />
        <Metric label="负责人" value={data.owner_name || '-'} />
        <Metric
          label="质量评分"
          value={data.quality_score != null ? data.quality_score.toFixed(1) : '-'}
        />
        <Metric
          label="落标率"
          value={data.standard_coverage != null ? `${(data.standard_coverage * 100).toFixed(0)}%` : '-'}
        />
        <Metric
          label="估值"
          value={data.valuation != null ? `¥${data.valuation.toLocaleString()}` : '-'}
        />
        <Metric
          label="定价"
          value={data.price != null ? `¥${data.price.toLocaleString()}` : '-'}
        />
        <Metric label="热度" value={data.hot != null ? String(data.hot) : '-'} />
        <Metric label="可见性" value={data.is_public ? '公开' : '私有'} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor: 'var(--color-bg)' }}>
      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</p>
    </div>
  )
}
