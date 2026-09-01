/**
 * 治理评估 — 数据战略域页签
 * 战略目标台账：目标/里程碑/进度/评估结论（DCMM 2.0 数据战略域 L4 举证）
 * 支持：目标登记、进度更新、里程碑维护、评估结论记录。
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2, Target, Pencil } from 'lucide-react'
import { AssetDcmmApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select, Textarea } from '../../../../../components/ui'

interface StrategyRow {
  id: string
  code: string
  name: string
  period?: string | null
  objective?: string | null
  status?: string // planning | executing | evaluated | closed
  progress?: number
  milestones?: string[] | null
  assess_result?: string | null
  updated_at?: string
}

const PAGE_SIZE = 10
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: '规划中', color: 'var(--color-text-secondary)', bg: 'var(--color-bg)' },
  executing: { label: '实施中', color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  evaluated: { label: '评估中', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  closed: { label: '已闭环', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
}

const EMPTY_FORM = {
  code: '',
  name: '',
  period: '',
  objective: '',
  status: 'planning',
  progress: 0,
  milestones: '',
  assess_result: '',
}

export default function StrategyTab() {
  const [rows, setRows] = useState<StrategyRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<StrategyRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetDcmmApi.listStrategyObjectives({
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as StrategyRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载战略目标失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (row: StrategyRow) => {
    setEditing(row)
    setForm({
      code: row.code,
      name: row.name,
      period: row.period ?? '',
      objective: row.objective ?? '',
      status: row.status ?? 'planning',
      progress: row.progress ?? 0,
      milestones: (row.milestones ?? []).join('\n'),
      assess_result: row.assess_result ?? '',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        period: form.period.trim() || null,
        objective: form.objective.trim() || null,
        status: form.status,
        progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
        milestones: form.milestones.trim()
          ? form.milestones.split('\n').map((m) => m.trim()).filter(Boolean)
          : null,
        assess_result: form.assess_result.trim() || null,
      }
      if (editing) {
        await AssetDcmmApi.updateStrategyObjective(editing.id, payload)
      } else {
        await AssetDcmmApi.createStrategyObjective({ code: form.code.trim(), ...payload })
      }
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: StrategyRow) => {
    try {
      await AssetDcmmApi.deleteStrategyObjective(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)} ro>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={openCreate}>
            <Plus size={14} className="mr-1" /> 新建战略目标
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="settings"
          title="暂无战略目标"
          description="登记数据战略目标（目标/里程碑/进度/评估结论），对齐 DCMM 2.0 数据战略域 L4 举证。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">编码</th>
                <th className="px-4 py-3 font-medium">战略目标</th>
                <th className="px-4 py-3 font-medium">周期</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">进度</th>
                <th className="px-4 py-3 font-medium">评估结论</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = STATUS_LABELS[row.status ?? ''] ?? STATUS_LABELS.planning
                const progress = Math.min(100, Math.max(0, row.progress ?? 0))
                return (
                  <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{row.code}</td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1.5 text-left font-medium hover:opacity-70" onClick={() => openEdit(row)}>
                        <Target size={14} style={{ color: 'var(--color-primary)' }} /> {row.name}
                      </button>
                      {row.objective && (
                        <p className="mt-0.5 max-w-[320px] truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }} title={row.objective}>
                          {row.objective}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.period ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ minWidth: 120 }}>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-bg)' }}>
                          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: 'var(--color-primary)' }} />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-xs" style={{ color: 'var(--color-text-secondary)' }} title={row.assess_result ?? ''}>
                      {row.assess_result ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row)} title="编辑">
                          <Pencil size={13} style={{ color: 'var(--color-primary)' }} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(row)} title="删除">
                          <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}

      {/* 战略目标登记/编辑表单 */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? '编辑战略目标' : '新建战略目标'} size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>目标编码</label>
              <Input value={form.code} disabled={!!editing} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如：STR-2026-01" />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>实施周期</label>
              <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="如：2026 年度" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>目标名称</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：数据资产全域入表覆盖率提升至 80%" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>目标描述</label>
            <Textarea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} rows={2} placeholder="目标内容与量化口径说明" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>状态</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: Array.isArray(v) ? String(v[0]) : String(v) })}>
                {Object.entries(STATUS_LABELS).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>进度（0-100）</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={String(form.progress)}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>里程碑（每行一条）</label>
            <Textarea value={form.milestones} onChange={(e) => setForm({ ...form, milestones: e.target.value })} rows={3} placeholder={'完成数据资产盘点\n完成估值模型评审\n完成入表试点'} />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>评估结论</label>
            <Textarea value={form.assess_result} onChange={(e) => setForm({ ...form, assess_result: e.target.value })} rows={2} placeholder="阶段性/终期评估结论（评估人/时间/达标情况）" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowForm(false)} ro>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim() || (!editing && !form.code.trim())}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
