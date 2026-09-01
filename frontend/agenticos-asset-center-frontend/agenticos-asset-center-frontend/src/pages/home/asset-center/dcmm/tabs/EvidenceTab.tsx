/**
 * 治理评估 — 证据库页签
 * 制度文档/演示场景脚本/运行记录绑定；自动抓取各模块运行态指标
 * （落标率/质量评分/工单台账/审计日志/资产统计/生命周期执行记录）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2, Sparkles } from 'lucide-react'
import { AssetDcmmApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'

interface EvidenceRow {
  id: string
  title: string
  evidence_type?: string // doc | script | record | runtime
  domain?: string
  content?: Record<string, unknown>
  created_at?: string
}

const PAGE_SIZE = 10
const TYPE_LABELS: Record<string, string> = {
  doc: '制度文档',
  script: '演示场景脚本',
  record: '运行记录',
  runtime: '运行态指标',
}

export default function EvidenceTab() {
  const [rows, setRows] = useState<EvidenceRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runtime, setRuntime] = useState<Record<string, unknown> | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', evidence_type: 'doc', domain: 'strategy' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetDcmmApi.listEvidences({
        evidence_type: typeFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as EvidenceRow[])
      setTotal(data.total ?? 0)
      setPage(p)
      setRuntime(await AssetDcmmApi.runtimeEvidence())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载证据库失败')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { load(1) }, [load])

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await AssetDcmmApi.createEvidence({
        title: form.title,
        evidence_type: form.evidence_type,
        domain: form.domain,
      })
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: EvidenceRow) => {
    try {
      await AssetDcmmApi.deleteEvidence(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const runtimeItems = (runtime as { items?: Array<{ name: string; value: string }> })?.items ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部类型</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={14} className="mr-1" /> 登记证据
          </Button>
        </div>
      </div>

      {/* 运行态指标自动抓取 */}
      {!loading && runtimeItems.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            <Sparkles size={15} style={{ color: 'var(--color-primary)' }} /> 运行态指标自动抓取
          </p>
          <div className="flex flex-wrap gap-2">
            {runtimeItems.map((item) => (
              <span key={item.name} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                {item.name}：{item.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="证据库为空"
          description="登记制度文档/演示场景脚本/运行记录；落标率、质量评分、工单台账、审计日志等运行态指标自动抓取。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">能力域</th>
                <th className="px-4 py-3 font-medium">登记时间</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.title}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {TYPE_LABELS[row.evidence_type ?? ''] ?? row.evidence_type ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.domain ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => remove(row)}>
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

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="登记证据">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>标题</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如：数据质量管理规范" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>类型</label>
            <Select value={form.evidence_type} onValueChange={(v) => setForm({ ...form, evidence_type: Array.isArray(v) ? String(v[0]) : String(v) })}>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>能力域</label>
            <Select value={form.domain} onValueChange={(v) => setForm({ ...form, domain: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="strategy">数据战略</option>
              <option value="governance">数据治理</option>
              <option value="architecture">数据架构</option>
              <option value="application">数据应用</option>
              <option value="security">数据安全</option>
              <option value="quality">数据质量</option>
              <option value="standard">数据标准</option>
              <option value="lifecycle">数据生命周期</option>
              <option value="basic">基础保障</option>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.title.trim()}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
