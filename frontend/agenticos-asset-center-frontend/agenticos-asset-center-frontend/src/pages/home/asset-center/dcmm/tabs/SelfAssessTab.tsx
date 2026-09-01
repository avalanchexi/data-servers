/**
 * 治理评估 — 自评估页签
 * 四档打分：完全满足/一般满足/改进项/不满足；评估报告导出
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, ClipboardCheck, Save } from 'lucide-react'
import { AssetDcmmApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination, Select } from '../../../../../components/ui'

interface IndicatorRow {
  id: string
  code: string
  name: string
  domain: string
  level?: string
  trimmed?: boolean
}

const PAGE_SIZE = 20
// 四档打分
const GRADE_LABELS: Record<string, string> = {
  full: '完全满足',
  partial: '一般满足',
  improvement: '改进项',
  none: '不满足',
}

export default function SelfAssessTab() {
  const [rows, setRows] = useState<IndicatorRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetDcmmApi.listIndicators({ limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE })
      setRows((data.items ?? []) as unknown as IndicatorRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载自评估指标失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const gradeOf = (row: IndicatorRow) => grades[row.id] ?? ''

  const saveAssessment = async () => {
    setSaving(true)
    try {
      await AssetDcmmApi.selfAssess({ scores: grades })
      setSavedAt(new Date().toLocaleString())
    } catch (e) {
      setError(e instanceof Error ? e.message : '自评估保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 四档统计
  const counts = Object.values(grades).reduce<Record<string, number>>((acc, g) => {
    acc[g] = (acc[g] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(GRADE_LABELS).map(([key, label]) => (
            <span key={key} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-secondary)' }}>
              {label}：{counts[key] ?? 0}
            </span>
          ))}
          {savedAt && <span className="text-xs" style={{ color: 'var(--color-success)' }}>已保存 {savedAt}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={saveAssessment} disabled={saving || !Object.keys(grades).length}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />} 保存自评估
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无评估指标"
          description="先在「指标台账」加载内置指标树，再逐项四档打分。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">指标</th>
                <th className="px-4 py-3 font-medium">能力域</th>
                <th className="px-4 py-3 font-medium">自评档位</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{row.code}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.domain}</td>
                  <td className="px-4 py-3">
                    <Select value={gradeOf(row)} onValueChange={(v) => setGrades((prev) => ({ ...prev, [row.id]: Array.isArray(v) ? String(v[0]) : String(v) }))} ro={false} className="w-44">
                      <option value="">未评估</option>
                      {Object.entries(GRADE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </Select>
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

      <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        <ClipboardCheck size={13} style={{ color: 'var(--color-primary)' }} />
        自评估结果按四档打分统计，评估报告可复用 report_gen 模板导出。
      </p>
    </div>
  )
}
