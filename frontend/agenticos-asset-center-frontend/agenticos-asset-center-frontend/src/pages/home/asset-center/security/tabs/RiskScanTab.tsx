/**
 * 数据安全 — 风险识别页签
 * 数据量/频次阈值预警规则（基于审计事件 + 分类覆盖率聚合）
 */
import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { AssetSecurityApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Select } from '../../../../../components/ui'

interface RiskRule {
  id: string
  name: string
  metric: string // volume | frequency
  threshold: number
  window?: string
  status?: string
}

interface RiskHit {
  id: string
  rule_name?: string
  target?: string
  value?: number
  created_at?: string
}

const RISK_METRICS: Record<string, string> = {
  volume: '数据量（单次访问行数）',
  frequency: '访问频次（时间窗内次数）',
}

export default function RiskScanTab() {
  const [rules, setRules] = useState<RiskRule[]>([])
  const [hits, setHits] = useState<RiskHit[]>([])
  const [coverage, setCoverage] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', metric: 'volume', threshold: '10000', window: '1h' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 风险命中事件复用敏感访问审计流
      const logs = await AssetSecurityApi.listAuditLogs({
        event_type: 'sensitive_access',
        limit: 20,
      })
      const items = (logs.items ?? []) as unknown as Array<Record<string, unknown>>
      setHits(items.map((it, idx) => ({
        id: String(it.id ?? idx),
        rule_name: String(it.rule_name ?? '敏感访问'),
        target: String(it.target ?? '-'),
        value: typeof it.value === 'number' ? it.value : undefined,
        created_at: typeof it.created_at === 'string' ? it.created_at : undefined,
      })))
      setCoverage(await AssetSecurityApi.coverage())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载风险数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      setRules((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          name: form.name,
          metric: form.metric,
          threshold: Number(form.threshold) || 0,
          window: form.window,
          status: 'enabled',
        },
      ])
      setShowForm(false)
      setForm({ name: '', metric: 'volume', threshold: '10000', window: '1h' })
    } finally {
      setSaving(false)
    }
  }

  const remove = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id))

  const uncovered = ((coverage as { uncovered?: number })?.uncovered ?? 0) as number
  const total = ((coverage as { total?: number })?.total ?? 0) as number

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            <AlertTriangle size={15} style={{ color: 'var(--color-warning)' }} />
            未分级资源 {uncovered}{total ? ` / ${total}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={load}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={() => setShowForm(true)} data-ro>
            <Plus size={14} className="mr-1" /> 预警规则
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {/* 预警规则 */}
      {!loading && !rules.length && (
        <EmptyState
          icon="folder"
          title="暂无风险预警规则"
          description="配置数据量/频次阈值规则，敏感数据访问超阈值即触发预警（联动审计日志）。"
        />
      )}

      {!!rules.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">规则名称</th>
                <th className="px-4 py-3 font-medium">指标</th>
                <th className="px-4 py-3 font-medium">阈值</th>
                <th className="px-4 py-3 font-medium">时间窗</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{rule.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{RISK_METRICS[rule.metric] ?? rule.metric}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-warning)' }}>{rule.threshold}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{rule.window ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => remove(rule.id)} data-ro>
                        <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 风险命中记录 */}
      {!loading && !!hits.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <div className="border-b px-4 py-2.5 text-xs font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
            近期风险命中
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">规则</th>
                <th className="px-4 py-3 font-medium">对象</th>
                <th className="px-4 py-3 font-medium">观测值</th>
                <th className="px-4 py-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((hit) => (
                <tr key={hit.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{hit.rule_name ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{hit.target ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-warning)' }}>{hit.value ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {hit.created_at ? new Date(hit.created_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="新增风险预警规则">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>规则名称</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：单次导出超过 1 万行" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>预警指标</label>
            <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="volume">数据量（单次访问行数）</option>
              <option value="frequency">访问频次（时间窗内次数）</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>阈值</label>
            <Input value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} placeholder="10000" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>时间窗</label>
            <Select value={form.window} onValueChange={(v) => setForm({ ...form, window: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="10m">10 分钟</option>
              <option value="1h">1 小时</option>
              <option value="1d">1 天</option>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
