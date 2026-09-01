/**
 * 资产总览 — 资产360 抽屉
 * 单对象 360 视图：基础信息 + 治理项 + 事件时间线 + 质量画像 + 使用趋势
 * 只读聚合（deny-by-default：查询与关闭均为读操作）
 */
import { useCallback, useState } from 'react'
import { Loader2, Search, Database, Activity, Gauge, TrendingUp } from 'lucide-react'
import { AssetGovernanceApi } from '../../../../api/asset'
import { Button, Drawer, Input, Select } from '../../../../components/ui'

interface Asset360View {
  basic?: {
    name_zh: string
    name_en?: string
    description?: string
    domain?: string
    owner_name?: string
    classification_level?: string
    quality_score?: number
    tags?: string[]
    asset?: { code: string; name: string; status: string; valuation?: unknown } | null
    classification?: { level: string; category?: string; method: string; status: string } | null
  } | null
  governance_items?: Array<{ id: string; category: string; title: string; severity: string; deduct_score: number }>
  timeline?: Array<{ event_type: string; title: string; time?: string; status?: string }>
  quality?: { total_score?: number; scored_at?: string } | null
  usage_trend?: Array<{
    stat_date?: string
    view_count: number
    download_count: number
    service_call_count: number
    user_count: number
  }>
  generated_at?: string
}

const ENTITY_TYPES = [
  { value: 'table', label: '表（table）' },
  { value: 'column', label: '字段（column）' },
  { value: 'dataset', label: '数据集（dataset）' },
  { value: 'metric', label: '指标（metric）' },
  { value: 'standard', label: '标准（standard）' },
  { value: 'service', label: '服务（service）' },
  { value: 'datasource', label: '数据源（datasource）' },
]

const EVENT_ICONS: Record<string, typeof Activity> = {
  audit: Activity,
  lifecycle: Database,
  quality_check: Gauge,
}

export default function Asset360Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entityType, setEntityType] = useState<string>('table')
  const [entityId, setEntityId] = useState('')
  const [view, setView] = useState<Asset360View | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queried, setQueried] = useState(false)

  const query = useCallback(async () => {
    if (!String(entityId || '').trim()) {
      setError('请输入对象 ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const raw = (await AssetGovernanceApi.asset360(String(entityType), entityId.trim())) as Asset360View
      setView(raw)
      setQueried(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询资产360失败')
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  const basic = view?.basic
  const timeline = view?.timeline ?? []
  const usage = view?.usage_trend ?? []

  return (
    <Drawer open={open} onClose={onClose} title="资产360" width="560px">
      {/* 查询区（纯读） */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Select value={entityType} onValueChange={(v) => setEntityType(String(v))} className="w-40" ro>
            {ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Input
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="对象 ID（如物理表名）"
            className="flex-1"
            data-ro
          />
          <Button variant="primary" onClick={query} loading={loading} ro>
            <Search size={15} /> 查询
          </Button>
        </div>
        {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      </div>

      {/* 结果区 */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      {!loading && queried && !basic && !error && (
        <p className="py-12 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          未找到该对象（检索宽表与资产目录均无记录）
        </p>
      )}

      {!loading && basic && (
        <div className="space-y-4">
          {/* 基础信息 */}
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <div className="flex items-center justify-between">
              <h4 className="font-medium" style={{ color: 'var(--color-text)' }}>{basic.name_zh}</h4>
              {basic.classification_level && (
                <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  {basic.classification_level}
                </span>
              )}
            </div>
            {basic.name_en && <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{basic.name_en}</p>}
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span>域：{basic.domain || '未分类'}</span>
              <span>负责人：{basic.owner_name || '未指定'}</span>
              <span>质量分：{basic.quality_score ?? '—'}</span>
              <span>资产状态：{basic.asset?.status ?? '未编目'}</span>
            </div>
            {basic.description && <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{basic.description}</p>}
          </div>

          {/* 治理项 */}
          {!!(view.governance_items ?? []).length && (
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <h4 className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>治理项（{view.governance_items!.length}）</h4>
              <div className="space-y-1.5">
                {view.governance_items!.map((item) => (
                  <p key={item.id} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    · {item.title}（扣 {item.deduct_score}）
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 质量画像 + 使用趋势 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                <Gauge size={15} /> 质量画像
              </h4>
              {view.quality ? (
                <p className="text-2xl font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {view.quality.total_score ?? '—'}
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>暂无质量评分</p>
              )}
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                <TrendingUp size={15} /> 使用趋势
              </h4>
              {usage.length ? (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  浏览 {usage.reduce((s, u) => s + u.view_count, 0)} · 调用 {usage.reduce((s, u) => s + u.service_call_count, 0)} · 下载 {usage.reduce((s, u) => s + u.download_count, 0)}
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>暂无使用记录</p>
              )}
            </div>
          </div>

          {/* 事件时间线 */}
          {!!timeline.length && (
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <h4 className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>事件时间线（{timeline.length}）</h4>
              <div className="space-y-2">
                {timeline.map((e, idx) => {
                  const Icon = EVENT_ICONS[e.event_type] ?? Activity
                  return (
                    <div key={`${e.event_type}-${idx}`} className="flex items-start gap-2">
                      <Icon size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{e.title}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {e.time ? new Date(e.time).toLocaleString() : '—'}{e.status ? ` · ${e.status}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
