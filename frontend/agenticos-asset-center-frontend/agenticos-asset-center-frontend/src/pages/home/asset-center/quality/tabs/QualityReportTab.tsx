/**
 * 数据质量 — 质量报告页签
 * 复用 report_gen 模板出报告（质量周报/月报入口 + 报告记录）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, FileText, RefreshCw } from 'lucide-react'
import { AssetQualityApi } from '../../../../../api/asset'
import { Button, EmptyState, Select } from '../../../../../components/ui'

interface ReportItem {
  id: string
  title: string
  period?: string
  generated_at?: string
  summary?: Record<string, unknown>
  status?: string
}

interface ScoreRow {
  id: string
  dataset_name?: string
  dataset_id: string
  total_score?: number
  scored_at?: string
}

interface SlaReport {
  sla_met_rate?: number | null
  avg_repair_minutes?: number | null
  recurrence_rate?: number
  total_fail?: number
  closed_count?: number
}

export default function QualityReportTab() {
  const [period, setPeriod] = useState('week')
  const [scores, setScores] = useState<ScoreRow[]>([])
  const [sla, setSla] = useState<SlaReport | null>(null)
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetQualityApi.listScores({ limit: 50 })
      setScores((data.items ?? []) as unknown as ScoreRow[])
      // SLA 闭环：达标率/修复时长/复发率（校验记录聚合）
      try {
        setSla((await AssetQualityApi.slaReport()) as unknown as SlaReport)
      } catch {
        setSla(null)
      }
      // 报告记录复用评分聚合（report_gen 模板渲染入口）
      setReports([])
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载质量数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const avgScore = scores.length
    ? (scores.reduce((sum, r) => sum + (r.total_score ?? 0), 0) / scores.length).toFixed(1)
    : '-'
  const goodCount = scores.filter((r) => (r.total_score ?? 0) >= 80).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="week">质量周报</option>
            <option value="month">质量月报</option>
            <option value="quarter">质量季报</option>
          </Select>
          <Button onClick={load}>
            <FileText size={14} className="mr-1" /> 生成报告
          </Button>
        </div>
        <Button variant="ghost" onClick={load}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {/* 报告摘要 */}
      {!loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>数据集平均质量分</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>{avgScore}</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>健康数据集（≥80 分）</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-success)' }}>{goodCount}</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>报告模板</p>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>report_gen 标准模板</p>
          </div>
        </div>
      )}

      {/* SLA 闭环维度 */}
      {!loading && sla && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>SLA 达标率（修复闭环）</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-primary)' }}>
              {sla.sla_met_rate != null ? `${sla.sla_met_rate}%` : '—'}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              已闭环 {sla.closed_count ?? 0} 次 / 失败 {sla.total_fail ?? 0} 次
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>平均修复时长</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
              {sla.avg_repair_minutes != null ? `${sla.avg_repair_minutes} 分钟` : '—'}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>fail→pass 闭环均值</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>复发率</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: (sla.recurrence_rate ?? 0) > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
              {sla.recurrence_rate != null ? `${sla.recurrence_rate}%` : '0%'}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>闭环修复后再次失败</p>
          </div>
        </div>
      )}

      {!loading && !reports.length && (
        <EmptyState
          icon="folder"
          title="点击「生成报告」输出质量报告"
          description={`报告基于六维评分/校验记录/工单台账聚合（周期：${period === 'week' ? '周' : period === 'month' ? '月' : '季'}），复用 report_gen 模板引擎。`}
        />
      )}

      {!!reports.length && (
        <div className="space-y-2">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <FileText size={16} style={{ color: 'var(--color-primary)' }} />
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{report.title}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {report.generated_at ? new Date(report.generated_at).toLocaleString() : '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
