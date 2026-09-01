/**
 * 数据生命周期 — 分层策略页签
 * 冷热分层：访问频率/时间阈值 + 保留期限配置
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { AssetLifecycleApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'

interface PolicyRow {
  id: string
  name: string
  policy_type?: string
  config?: { tier?: string; access_threshold?: number; idle_days?: number; retention_days?: number }
  status?: string
}

const PAGE_SIZE = 10
const TIER_LABELS: Record<string, string> = {
  hot: '热数据',
  warm: '温数据',
  cold: '冷数据',
}

export default function TierPolicyTab() {
  const [rows, setRows] = useState<PolicyRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PolicyRow | null>(null)
  const [form, setForm] = useState({ name: '', tier: 'cold', access_threshold: '10', idle_days: '90', retention_days: '365' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetLifecycleApi.listPolicies({ limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE })
      setRows((data.items ?? []) as unknown as PolicyRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载分层策略失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', tier: 'cold', access_threshold: '10', idle_days: '90', retention_days: '365' })
    setShowForm(true)
  }

  const openEdit = (row: PolicyRow) => {
    setEditing(row)
    setForm({
      name: row.name,
      tier: row.config?.tier ?? 'cold',
      access_threshold: String(row.config?.access_threshold ?? 10),
      idle_days: String(row.config?.idle_days ?? 90),
      retention_days: String(row.config?.retention_days ?? 365),
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        policy_type: 'cold_hot',
        config: {
          tier: form.tier,
          access_threshold: Number(form.access_threshold) || 0,
          idle_days: Number(form.idle_days) || 0,
          retention_days: Number(form.retention_days) || 0,
        },
      }
      if (editing) {
        await AssetLifecycleApi.updatePolicy(editing.id, { name: payload.name, config: payload.config })
      } else {
        await AssetLifecycleApi.createPolicy(payload)
      }
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: PolicyRow) => {
    try {
      await AssetLifecycleApi.deletePolicy(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          按访问频率与闲置时间阈值自动降冷，保留期限到期触发归档/退役建议。
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={openCreate} data-ro>
            <Plus size={14} className="mr-1" /> 新建策略
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无分层策略"
          description="配置冷热分层规则：访问频率阈值 + 闲置天数 + 保留期限。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">策略名称</th>
                <th className="px-4 py-3 font-medium">分层</th>
                <th className="px-4 py-3 font-medium">访问频率阈值（次/月）</th>
                <th className="px-4 py-3 font-medium">闲置天数</th>
                <th className="px-4 py-3 font-medium">保留期限（天）</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {TIER_LABELS[row.config?.tier ?? ''] ?? row.config?.tier ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.config?.access_threshold ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.config?.idle_days ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.config?.retention_days ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(row)} data-ro>编辑</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(row)} data-ro>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? '编辑分层策略' : '新建分层策略'}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>策略名称</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：90 天无访问降冷" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>目标分层</label>
            <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="hot">热数据</option>
              <option value="warm">温数据</option>
              <option value="cold">冷数据</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>访问频率阈值（次/月）</label>
            <Input value={form.access_threshold} onChange={(e) => setForm({ ...form, access_threshold: e.target.value })} placeholder="10" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>闲置天数</label>
            <Input value={form.idle_days} onChange={(e) => setForm({ ...form, idle_days: e.target.value })} placeholder="90" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>保留期限（天）</label>
            <Input value={form.retention_days} onChange={(e) => setForm({ ...form, retention_days: e.target.value })} placeholder="365" />
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
