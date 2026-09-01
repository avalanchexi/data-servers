/**
 * 治理评估 — 九域看板页签
 * L4 量化管理级举证核心：九域健康分 + 关键指标群聚合（domain-dashboard 端点）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, LayoutDashboard } from 'lucide-react'
import { AssetDcmmApi } from '../../../../../api/asset'
import { Button, EmptyState } from '../../../../../components/ui'
import { HealthScoreRadar } from '../../../../../components/asset'

interface DomainScore {
  domain: string
  label: string
  score: number
  trend?: number
}

interface DashboardData {
  domains?: DomainScore[]
  key_metrics?: Array<{ name: string; value: string }>
}

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

export default function DomainDashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = (await AssetDcmmApi.domainDashboard()) as unknown as {
        domains?: Array<Record<string, unknown>>
        key_metrics?: Array<{ name: string; value: string }>
      }
      setData({
        // 后端 domains 每项为 {domain, total_indicators, enabled_indicators, evidence_count}，
        // 无 score 字段，健康分按指标覆盖率（启用/总数）计算
        domains: (raw.domains ?? []).map((d) => {
          const domain = String(d.domain ?? '')
          const total = Number(d.total_indicators ?? 0)
          const enabled = Number(d.enabled_indicators ?? 0)
          return {
            domain,
            label: DOMAIN_LABELS[domain] ?? domain,
            score: total > 0 ? Math.round((enabled / total) * 100) : 0,
          }
        }),
        key_metrics: raw.key_metrics ?? [],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载九域看板失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const domains = data?.domains ?? []
  const avgScore = domains.length
    ? (domains.reduce((sum, d) => sum + d.score, 0) / domains.length).toFixed(1)
    : '-'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <LayoutDashboard size={13} style={{ color: 'var(--color-primary)' }} />
          L4 量化管理级举证核心：九域健康分 + 关键指标群聚合。
        </p>
        <Button variant="ghost" onClick={load}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* 雷达图 */}
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="mb-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>九域健康分雷达</p>
            {domains.length ? (
              <HealthScoreRadar
                dimensions={domains.map((d) => ({ name: d.label, score: d.score }))}
                height={260}
              />
            ) : (
              <EmptyState
                icon="folder"
                title="暂无看板数据"
                description="各模块运行态指标聚合后生成九域健康分。"
              />
            )}
          </div>

          {/* 域评分表 */}
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>九域得分</p>
            {!!domains.length && (
              <div className="space-y-2">
                {domains.map((d) => (
                  <div key={d.domain} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{d.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-bg)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, d.score)}%`,
                          backgroundColor: d.score >= 80 ? 'var(--color-success)' : d.score >= 60 ? 'var(--color-warning)' : 'var(--color-error)',
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs font-medium" style={{ color: 'var(--color-text)' }}>{d.score}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>九域平均：</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{avgScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* 关键指标群 */}
      {!loading && !!data?.key_metrics?.length && (
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <p className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>L4 关键指标群（运行态自动抓取）</p>
          <div className="flex flex-wrap gap-2">
            {data.key_metrics.map((m) => (
              <span key={m.name} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                {m.name}：{m.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
